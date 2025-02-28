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
exports.generateCode = exports.deleteFile = exports.createFile = exports.saveFile = void 0;
const saveFile = (fileId, data) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("saving...");
    const res = yield fetch(`https://storage.tikamgupta05122004.workers.dev/api/save`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId, data })
    });
    return res.ok;
});
exports.saveFile = saveFile;
const createFile = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(`https://storage.tikamgupta05122004.workers.dev/api`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId })
    });
    return res.ok;
});
exports.createFile = createFile;
const deleteFile = (fileId) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(`https://storage.tikamgupta05122004.workers.dev/api`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId })
    });
    return res.ok;
});
exports.deleteFile = deleteFile;
const generateCode = (_a) => __awaiter(void 0, [_a], void 0, function* ({ fileName, code, line, instructions }) {
    return yield fetch("https://api.cloudflare.com/client/v4/accounts/49ec3b98dac5f81ba729f8283f7ad51d/ai/run/@cf/meta/llama-3-8b-instruct", {
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
    });
});
exports.generateCode = generateCode;
