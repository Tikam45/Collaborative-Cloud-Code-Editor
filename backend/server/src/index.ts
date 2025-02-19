import express, {Express} from "express"
import { createServer } from "http";
import { Server } from "socket.io";
import getVirtualboxFiles from "./getVirtualboxFiles";
import {  z } from "zod";
import { saveFile, createFile, deleteFile } from "./utils";
import path from "path";
import fs from "fs"
import os from "os"
import { IDisposable, IPty, spawn } from "node-pty-prebuilt-multiarch";

const app : Express = express();

const port = process.env.PORT || 4000;

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

const terminals : {[id: string] : {
    terminal: IPty,
    onData: IDisposable,
    onExit: IDisposable;
}} = {}

const dirName = path.join(__dirname, "..")

const handshakeSchema = z.object({
    userId: z.string(),
    virtualboxId: z.string(),
    type: z.enum(["react", "node"]).optional(),
    EIO: z.string(),
    transport: z.string(),
})

io.use(async (socket, next) => {
    const q = socket.handshake.query;

    // console.log("middleware");
    // console.log(q);

    const parseQuery = handshakeSchema.safeParse(q);
    // console.log(parseQuery);
    if(!parseQuery.success){
        next(new Error("Invalid request"))
        return;
    }

    const {virtualboxId, userId, type} = parseQuery.data;
    const dbUser = await fetch(`https://cce-backend.tikamgupta05122004.workers.dev/api/user?id=${q.userId}`);

    const dbUserJSON = await dbUser.json();

    if(!dbUserJSON){
        next(new Error("DB Error"));
    }

    const virtualbox = dbUserJSON.virtualbox.find((v: { id: string }) => v.id === virtualboxId);

    const sharedVirtualboxes = dbUserJSON.usersToVirtualboxes.find(
        (utv: any) => utv.virtualboxId === virtualboxId
    );

    if(!virtualbox){
        next(new Error("Invalid credentials"));
        return;
    }

    socket.data = {
        id: virtualboxId,
        userId
    }
    next();
})


io.on ("connection", async(socket) => {
    const data = socket.data as {
        userId: string
        id: string
        type: "node" | "react"
    };
    const virtualboxFiles = await getVirtualboxFiles(data.id)
    // console.log("connected");
    virtualboxFiles.fileData.forEach((file) => {
        const filePath = path.join(dirName, file.id);
        fs.mkdirSync(path.dirname(filePath), {recursive: true})
        fs.writeFile(filePath, file.data, function(err){
            if(err) throw err;
        })
    })

    socket.emit("loaded", virtualboxFiles.files)

    socket.on("getFile", (fileId: string, callback) => {
        const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
        if(!file) return;

        callback(file.data);
    })

    socket.on("saveFile", async (fileId: string, body: string) => {
        const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
        if(!file) return;

        file.data = body;

        fs.writeFile(path.join(dirName, file.id), body, function(err){
            if(err) throw err;
        })
        await saveFile(fileId, body);
    });

    socket.on("createFile" , async(name: string) => {
        const id = `codestore/${data.id}/${name}`;

        fs.writeFile(path.join(dirName, id), "", function(err){
            if(err) throw err;
        })

        virtualboxFiles.files.push({
            id,
            name,
            type: "file"
        });

        virtualboxFiles.fileData.push({
            id,
            data: "",
        });

        await createFile(id);
    })

    socket.on("deleteFile" , async (fileId: string , callback) => {
        const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
        if(!file) return;

        fs.unlink(path.join(dirName, fileId), function(err) {
            if(err) throw err;
        })

        virtualboxFiles.fileData = virtualboxFiles.fileData.filter((f) => f.id !== fileId);

        await deleteFile(fileId);

        const newFiles = await getVirtualboxFiles(data.id);
        callback(newFiles.files);
    })

    socket.on("createTerminal", ({id} : {id: string}) => {
        const pty = spawn(os.platform() === "win32" ? "cmd.exe" : "bash", [], {
            name: "xterm",
            cols: 100,
            cwd: path.join(dirName, "projects", data.id),
        })

        const onData = pty.onData((data) => {
            socket.emit("terminalResponse", {
                data,
            })
        });

        const onExit = pty.onExit((code) => console.log("exit", code));
        pty.write("clear\r")
        terminals[id] = {
            terminal: pty,
            onData,
            onExit
        };
    })

    socket.on("terminalData" , ({id, data} : {id: string, data : string}) => {
        if(!terminals[id]){
            return;
        }

        try{
            terminals[id].terminal.write(data);
        }catch(e){
            console.log("Error writing to terminal", e);
        }
    });

    socket.on("generateCode", async(
        fileName: string,
        code: string,
        line: number,
        instructions: string,
        callback
    ) => {
        console.log("generating...")

        const res = await fetch("https://api.cloudflare.com/client/v4/accounts/49ec3b98dac5f81ba729f8283f7ad51d/ai/run/@cf/meta/llama-3-8b-instruct", {
            method: "POST",
            headers: { Authorization: "Bearer KNjfAc2pLtl-fnt4LVqWSHUUgghASZJcp4QN2JkY",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert coding assistant who reads from an existing code file and suggests code to add to the file. You many be given instructions on what to generate, which you should follow. You should generate code that is correct, efficient, and follows best practices. You should also generate code that is clear and easy to read."
                    },
                    {
                        role: "user",
                        content: `The file is called ${fileName}. Here are my instructions on what to generate: ${instructions}. Suggest me code to insert at line ${line} in my file. My code file content: ${code}. Return only the code, and nothing else. Do not include backticks`,
                    }
                ]
            })
        })

        const json = await res.json();
        callback(json);
    })

    socket.on("disconnect", () => {
        Object.entries(terminals).forEach((t) => {
            const {terminal, onData , onExit} = t[1];
            if(os.platform() !== "win32") terminal.kill();
            onData.dispose();
            onExit.dispose();
            delete terminals[t[0]];
        })
    });
});

app.get("/", (req,res)=>{
    res.send({message: "server is run"})
})
httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});