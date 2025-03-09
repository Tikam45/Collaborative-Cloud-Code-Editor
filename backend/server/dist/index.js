"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const getVirtualboxFiles_1 = __importDefault(require("./getVirtualboxFiles"));
const zod_1 = require("zod");
const cors_1 = __importDefault(require("cors"));
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const node_pty_1 = require("node-pty");
const ratelimit_1 = require("./ratelimit");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
    methods: "*",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true
}));
const port = process.env.PORT || 4000;
const httpServer = (0, http_1.createServer)(app);
// const io = new Server(res.socket.server,{ path: '/api/socket',addTrailingSlash: false });
const io = new socket_io_1.Server(httpServer, {
    path: "/socket.io",
    addTrailingSlash: false,
    cors: {
        origin: '*',
        methods: '*',
        allowedHeaders: "Content-Type, Authorization, Access-Control-Allow-Origin",
        credentials: true
    },
});
const terminals = {};
const dirName = path_1.default.join(__dirname, "..");
const handshakeSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    virtualboxId: zod_1.z.string(),
    type: zod_1.z.enum(["react", "node"]).optional(),
    EIO: zod_1.z.string(),
    transport: zod_1.z.string(),
});
io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const q = socket.handshake.query;
    console.log("middleware");
    console.log(q);
    const parseQuery = handshakeSchema.safeParse(q);
    console.log(parseQuery);
    if (!parseQuery.success) {
        next(new Error("Invalid request"));
        return;
    }
    const { virtualboxId, userId, type } = parseQuery.data;
    const dbUser = yield fetch(`https://cce-backend.tikamgupta05122004.workers.dev/api/user?id=${q.userId}`);
    const dbUserJSON = yield dbUser.json();
    if (!dbUserJSON) {
        next(new Error("DB Error"));
    }
    const virtualbox = dbUserJSON.virtualbox.find((v) => v.id === virtualboxId);
    const sharedVirtualboxes = dbUserJSON.usersToVirtualboxes.find((utv) => utv.virtualboxId === virtualboxId);
    console.log(sharedVirtualboxes);
    if (!virtualbox && !sharedVirtualboxes) {
        next(new Error("Invalid credentials"));
        return;
    }
    socket.data = {
        virtualboxId: virtualboxId,
        userId
    };
    next();
}));
io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
    const data = socket.data;
    const virtualboxFiles = yield (0, getVirtualboxFiles_1.default)(data.virtualboxId);
    // console.log("connected");
    virtualboxFiles.fileData.forEach((file) => {
        const filePath = path_1.default.join(dirName, file.id);
        fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        fs_1.default.writeFile(filePath, file.data, function (err) {
            if (err)
                throw err;
        });
    });
    socket.emit("loaded", virtualboxFiles.files);
    socket.on("getFile", (fileId, callback) => {
        const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
        if (!file)
            return;
        callback(file.data);
    });
    socket.on("saveFile", (fileId, body) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log("in saving..........");
            yield ratelimit_1.saveFileRL.consume(data.userId, 1);
            const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
            if (!file)
                return;
            file.data = body;
            fs_1.default.writeFile(path_1.default.join(dirName, file.id), body, function (err) {
                if (err)
                    throw err;
            });
            yield (0, utils_1.saveFile)(fileId, body);
        }
        catch (e) {
            socket.emit("rateLimit", "Rate limited: file saving. Please slow down ");
        }
    }));
    socket.on("createFile", (name) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield ratelimit_1.createFileRL.consume(data.userId, 1);
            const id = `${data.virtualboxId}/${name}`;
            fs_1.default.writeFile(path_1.default.join(dirName, id), "", function (err) {
                if (err)
                    throw err;
            });
            virtualboxFiles.files.push({
                id,
                name,
                type: "file"
            });
            virtualboxFiles.fileData.push({
                id,
                data: "",
            });
            yield (0, utils_1.createFile)(id);
        }
        catch (e) {
            io.emit("rateLimit", "Rate limited: file creation. Please slow down ");
        }
    }));
    socket.on("deleteFile", (fileId, callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield ratelimit_1.deleteFileRL.consume(data.userId, 1);
            const file = virtualboxFiles.fileData.find((f) => f.id === fileId);
            if (!file)
                return;
            fs_1.default.unlink(path_1.default.join(dirName, fileId), function (err) {
                if (err)
                    throw err;
            });
            virtualboxFiles.fileData = virtualboxFiles.fileData.filter((f) => f.id !== fileId);
            yield (0, utils_1.deleteFile)(fileId);
            const newFiles = yield (0, getVirtualboxFiles_1.default)(data.virtualboxId);
            callback(newFiles.files);
        }
        catch (e) {
            io.emit("rateLimit", "Rate limited: file deletion. Please slow down ");
        }
    }));
    socket.on("createTerminal", (id, callback) => {
        console.log("in Terminal", id);
        if (terminals[id]) {
            console.log("Terminal already exists");
            return;
        }
        if (Object.keys(terminals).length > 5) {
            console.log("Too many terminals");
            return;
        }
        const newPath = path_1.default.join(dirName, "projects", data.virtualboxId);
        console.log(newPath);
        fs_1.default.mkdirSync(newPath, { recursive: true });
        const pty = (0, node_pty_1.spawn)(os_1.default.platform() === "win32" ? "cmd.exe" : "bash", [], {
            name: "xterm",
            cols: 100,
            cwd: path_1.default.join(dirName, "projects", data.virtualboxId),
        });
        const onData = pty.onData((data) => {
            io.emit("terminalResponse", {
                id,
                data,
            });
        });
        console.log("Terminal created", terminals);
        const onExit = pty.onExit((code) => console.log("exit", code));
        pty.write("clear\r");
        terminals[id] = {
            terminal: pty,
            onData,
            onExit
        };
        callback(true);
    });
    socket.on("closeTerminal", (id, callback) => {
        if (!terminals[id]) {
            console.log("tried to close, but terminal doesn't exist");
            return;
        }
        terminals[id].onData.dispose();
        terminals[id].onExit.dispose();
        delete terminals[id];
        callback(true);
    });
    socket.on("terminalData", (id, data) => {
        console.log("term Data", id, data);
        if (!terminals[id]) {
            return;
        }
        try {
            console.log("writing to terminal");
            terminals[id].terminal.write(data);
        }
        catch (e) {
            console.log("Error writing to terminal", e);
        }
    });
    socket.on("generateCode", (fileName, code, line, instructions, callback) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("generating...");
        const fetchPromise = fetch("https://cce-backend.tikamgupta05122004.workers.dev/api/virtualbox/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: data.userId,
            })
        });
        const generateCodePromise = (0, utils_1.generateCode)({
            fileName,
            code,
            line,
            instructions
        });
        const [fetchResponse, generateCodeResponse] = yield Promise.all([fetchPromise, generateCodePromise]);
        const json = yield generateCodeResponse.json();
        callback(json);
    }));
    socket.on("disconnect", () => {
        Object.entries(terminals).forEach((t) => {
            const { terminal, onData, onExit } = t[1];
            if (os_1.default.platform() !== "win32")
                terminal.kill();
            onData.dispose();
            onExit.dispose();
            delete terminals[t[0]];
        });
    });
}));
app.get("/", (req, res) => {
    res.send({ message: "server is run" });
});
httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
