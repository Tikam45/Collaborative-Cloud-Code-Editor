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
Object.defineProperty(exports, "__esModule", { value: true });
const getVirtualboxFiles = (id) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("hello", id)
    const virtualboxRes = yield fetch(`https://storage.tikamgupta05122004.workers.dev/api?virtualboxId=${id}`);
    const virtualboxData = yield virtualboxRes.json();
    // console.log("hi")
    // console.log( virtualboxData);
    const paths = virtualboxData;
    return processFiles(paths, id);
});
const processFiles = (paths, id) => __awaiter(void 0, void 0, void 0, function* () {
    const root = { id: "/", type: "folder", name: "/", children: [] };
    const fileData = [];
    // console.log(paths, "paths");
    paths.forEach((path) => {
        const allParts = path.split('/');
        if (allParts[0] !== id) {
            return;
        }
        const parts = allParts.slice(1);
        // console.log("parts", parts);
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            // console.log("inside", parts[i]);
            const part = parts[i];
            const isFile = i === parts.length - 1 && part.includes(".");
            const existing = current.children.find((child) => child.name === part);
            // console.log(isFile, existing);
            if (existing) {
                if (!isFile) {
                    current = existing;
                }
            }
            else {
                if (isFile) {
                    const file = { id: path, type: "file", name: part };
                    current.children.push(file);
                    fileData.push({ id: path, data: "" });
                    // console.log(file)
                }
                else {
                    const folder = {
                        id: parts.slice(0, i + 1).join("/"),
                        type: "folder",
                        name: part,
                        children: []
                    };
                    current.children.push(folder);
                    current = folder;
                    // console.log(folder)
                }
            }
        }
        // console.log(root);
    });
    // console.log(fileData);
    yield Promise.all(fileData.map((file) => __awaiter(void 0, void 0, void 0, function* () {
        const data = yield fetchFileContent(file.id);
        file.data = data;
    })));
    return { files: root.children, fileData };
});
const fetchFileContent = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileRes = yield fetch(`https://storage.tikamgupta05122004.workers.dev/api?fileId=${fileId}`);
        return yield fileRes.text();
    }
    catch (error) {
        return "";
    }
});
exports.default = getVirtualboxFiles;
