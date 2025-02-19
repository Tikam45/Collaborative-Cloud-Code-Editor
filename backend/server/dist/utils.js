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
exports.deleteFile = exports.createFile = exports.saveFile = void 0;
const saveFile = (fileId, data) => __awaiter(void 0, void 0, void 0, function* () {
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
