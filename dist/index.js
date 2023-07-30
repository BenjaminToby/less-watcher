#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const sourceFile = process.argv.indexOf("--src") >= 0 ? process.argv[process.argv.indexOf("--src") + 1] : null;
const destinationFile = process.argv.indexOf("--dst") >= 0 ? process.argv[process.argv.indexOf("--dst") + 1] : null;
console.log("\x1b[44mRunning Less compiler\x1b[0m ...");
if (!sourceFile || !destinationFile) {
    console.log("ERROR => Missing source or destination file");
    process.exit();
}
const sourceFiles = sourceFile.split(",");
const dstFiles = destinationFile.split(",");
for (let i = 0; i < sourceFiles.length; i++) {
    const srcFolder = sourceFiles[i];
    const dstFile = dstFiles[i];
    if ((srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\..{2,4}$/)) && !(srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/))) {
        console.log("\x1b[33mERROR:\x1b[0m Source must be a folder or a .less file");
        process.exit();
    }
    compile(srcFolder, dstFile, null);
    fs_1.default.watch(srcFolder, { recursive: true }, (evtType, fileName) => {
        if (!fileName)
            return;
        const filePathRoot = (srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/)) ? srcFolder : srcFolder + "/" + fileName;
        compile(filePathRoot, dstFile, evtType);
    });
}
function compile(fileName, dst, evtType) {
    if ((fileName === null || fileName === void 0 ? void 0 : fileName.match(/\(/)) || (fileName.match(/\..{2,4}$/) && !(fileName === null || fileName === void 0 ? void 0 : fileName.match(/\.less$/i)))) {
        return;
    }
    let finalSrcPath = (fileName === null || fileName === void 0 ? void 0 : fileName.match(/\.less$/)) ? fileName : `${fileName}/main.less`;
    let finalDstPath = dst;
    if (fileName === null || fileName === void 0 ? void 0 : fileName.match(/\[/)) {
        const paths = fileName.split("/");
        const targetPathFull = paths[paths.length - 1];
        const targetPath = targetPathFull.replace(/\[|\]/g, "").replace(/\.less/, "");
        const destinationFileParentFolder = dst.replace(/\/[^\/]+\.css$/, "");
        const targetDstFilePath = `${destinationFileParentFolder}/${targetPath}.css`;
        finalSrcPath = `${fileName}/${targetPathFull}`;
        finalDstPath = targetDstFilePath;
    }
    (0, child_process_1.exec)(`lessc ${finalSrcPath} ${(finalDstPath === null || finalDstPath === void 0 ? void 0 : finalDstPath.match(/\.css$/)) ? finalDstPath : finalDstPath.replace(/\/$/, "") + "/_main.css"}`, (error, stdout, stderr) => {
        if (error) {
            console.log("ERROR =>", error.message);
            if (!(evtType === null || evtType === void 0 ? void 0 : evtType.match(/change/i)) && fileName && fileName.match(/\[/)) {
                fs_1.default.unlinkSync(finalDstPath);
            }
            return;
        }
        console.log("Less Compilation \x1b[32msuccessful\x1b[0m!");
    });
}
