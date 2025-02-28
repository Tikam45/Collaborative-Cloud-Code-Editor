import express, {Express} from "express"
import { createServer } from "http";
import { Server } from "socket.io";
import getVirtualboxFiles from "./getVirtualboxFiles";
import {  z } from "zod";
import { saveFile, createFile, deleteFile, generateCode } from "./utils";
import path from "path";
import fs from "fs"
// import {spawn} from "node-pty-prebuilt-multiarch"
import os from "os"
import { IDisposable, IPty, spawn } from "node-pty-prebuilt-multiarch";
import { createFileRL, deleteFileRL, saveFileRL } from "./ratelimit";

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

    console.log("middleware");
    console.log(q);

    const parseQuery = handshakeSchema.safeParse(q);
    console.log(parseQuery);
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

    console.log(sharedVirtualboxes);

    if(!virtualbox && !sharedVirtualboxes){
        next(new Error("Invalid credentials"));
        return;
    }

    socket.data = {
        virtualboxId: virtualboxId,
        userId
    }
    next();
})


io.on ("connection", async(socket) => {
    const data = socket.data as {
        userId: string
        virtualboxId: string
    };
    const virtualboxFiles = await getVirtualboxFiles(data.virtualboxId)
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
        try{
            console.log("in saving..........")
            await saveFileRL.consume(data.userId, 1);

            const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
            if(!file) return;

            file.data = body;

            fs.writeFile(path.join(dirName, file.id), body, function(err){
                if(err) throw err;
            })
            await saveFile(fileId, body);
        }
        catch(e){
            socket.emit("rateLimit", "Rate limited: file saving. Please slow down ")
        }
    });

    socket.on("createFile" , async(name: string) => {
        try{
            await createFileRL.consume(data.userId, 1);

            const id = `${data.virtualboxId}/${name}`;

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
        }
        catch(e){
            io.emit("rateLimit", "Rate limited: file creation. Please slow down ")
        }
    })

    socket.on("deleteFile" , async (fileId: string , callback) => {
        try{
            await deleteFileRL.consume(data.userId, 1);

            const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
            if(!file) return;

            fs.unlink(path.join(dirName, fileId), function(err) {
                if(err) throw err;
            })

            virtualboxFiles.fileData = virtualboxFiles.fileData.filter((f) => f.id !== fileId);

            await deleteFile(fileId);

            const newFiles = await getVirtualboxFiles(data.virtualboxId);
            callback(newFiles.files);
        }
        catch(e){
            io.emit("rateLimit", "Rate limited: file deletion. Please slow down ")
        }
    })

    socket.on("createTerminal", (id: string, callback) => {
        console.log("in Terminal", id);

        if(terminals[id]){
            console.log("Terminal already exists");
            return;
        }
        if(Object.keys(terminals).length > 5){
            console.log("Too many terminals");
            return;
        }

        const newPath = path.join(dirName, "projects", data.virtualboxId);
        console.log(newPath);
        fs.mkdirSync(newPath, {recursive: true});

        const pty = spawn(os.platform() === "win32" ? "cmd.exe" : "bash", [], {
            name: "xterm",
            cols: 100,
            cwd: path.join(dirName, "projects", data.virtualboxId),
        })

        const onData = pty.onData((data) => {
            io.emit("terminalResponse", {
                id,
                data,
            })
        });

        console.log("Terminal created", terminals);
        const onExit = pty.onExit((code) => console.log("exit", code));
        pty.write("clear\r")
        terminals[id] = {
            terminal: pty,
            onData,
            onExit
        };

        callback(true);
    });

    socket.on("closeTerminal", (id: string, callback) => {
        if(!terminals[id]){
            console.log("tried to close, but terminal doesn't exist");
            return;
        }

        terminals[id].onData.dispose();
        terminals[id].onExit.dispose();

        delete terminals[id];
        callback(true);
    })

    socket.on("terminalData" , (id: string, data: string) => {
        console.log("term Data", id, data);
        if(!terminals[id]){
            return;
        }

        try{
            console.log("writing to terminal");
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

        const fetchPromise = fetch("https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: data.userId,
            })
        });

        const generateCodePromise = generateCode({
            fileName,
            code,
            line,
            instructions
        })

        const [fetchResponse, generateCodeResponse] = await Promise.all([fetchPromise, generateCodePromise]);

        const json = await generateCodeResponse.json();
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