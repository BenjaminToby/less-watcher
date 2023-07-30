#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
if (fs_1.default.existsSync("./lesscw.config.json")) {
    if (process.argv.indexOf("--src") >= 0 || process.argv.indexOf("--dst") >= 0) {
        try {
            process.argv.splice(process.argv.indexOf("--src"));
            process.argv.splice(process.argv.indexOf("--dst"));
        }
        catch (error) { }
    }
    try {
        const configObject = JSON.parse(fs_1.default.readFileSync("./lesscw.config.json", "utf-8"));
        if ((configObject === null || configObject === void 0 ? void 0 : configObject.src) && (configObject === null || configObject === void 0 ? void 0 : configObject.dst) && typeof configObject.src === "string" && typeof configObject.dst === "string") {
            process.argv.push("--src", configObject.src);
            process.argv.push("--dst", configObject.dst);
        }
        else if ((configObject === null || configObject === void 0 ? void 0 : configObject.src) && (configObject === null || configObject === void 0 ? void 0 : configObject.dst) && typeof configObject.src === "object" && typeof configObject.dst === "object" && Array.isArray(configObject.src) && Array.isArray(configObject.dst)) {
            process.argv.push("--src", configObject.src.join(","));
            process.argv.push("--dst", configObject.dst.join(","));
        }
        else if ((configObject === null || configObject === void 0 ? void 0 : configObject.srcDst) && Array.isArray(configObject.srcDst) && configObject.srcDst.length > 0) {
            const srcDstArray = configObject.srcDst;
            let srcArray = [];
            let dstArray = [];
            srcDstArray.forEach((item) => {
                if ((item === null || item === void 0 ? void 0 : item.src) && (item === null || item === void 0 ? void 0 : item.dst) && typeof item.src === "string" && typeof item.dst === "string") {
                    srcArray.push(item.src);
                    dstArray.push(item.dst);
                }
            });
            if (srcArray.length && dstArray.length) {
                process.argv.push("--src", srcArray.join(","));
                process.argv.push("--dst", dstArray.join(","));
            }
        }
    }
    catch (error) {
        console.log("ERROR in your config file =>", error.message);
        process.exit();
    }
}
const sourceFile = process.argv.indexOf("--src") >= 0 ? process.argv[process.argv.indexOf("--src") + 1] : null;
const destinationFile = process.argv.indexOf("--dst") >= 0 ? process.argv[process.argv.indexOf("--dst") + 1] : null;
console.log("\x1b[44mRunning Less compiler\x1b[0m ...");
if (!sourceFile || !destinationFile) {
    console.log("\x1b[33mERROR:\x1b[0m => Missing source or destination file");
    process.exit();
}
const sourceFiles = sourceFile.split(",");
const dstFiles = destinationFile.split(",");
for (let i = 0; i < sourceFiles.length; i++) {
    const srcFolder = sourceFiles[i];
    const dstFile = dstFiles[i];
    if ((srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.[^\/]+$/)) && !(srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/))) {
        console.log("\x1b[33mERROR:\x1b[0m Source must be a folder or a .less file");
        process.exit();
    }
    if (!fs_1.default.existsSync(srcFolder)) {
        if (srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/)) {
            fs_1.default.mkdirSync(srcFolder.replace(/\/[^\/]+\.less$/, ""), { recursive: true });
            fs_1.default.writeFileSync(srcFolder, "", "utf-8");
        }
        else {
            fs_1.default.mkdirSync(srcFolder.replace(/\/[^\/]+\.[^\/]+$/, ""), { recursive: true });
            fs_1.default.writeFileSync((srcFolder + "/main.less").replace(/\/\//g, ""), "", "utf-8");
        }
    }
    else if (fs_1.default.existsSync(srcFolder) && fs_1.default.existsSync((srcFolder + "/main.less").replace(/\/\//g, ""))) {
        fs_1.default.writeFileSync((srcFolder + "/main.less").replace(/\/\//g, ""), "", "utf-8");
    }
    if (!fs_1.default.existsSync(dstFile)) {
        if (dstFile === null || dstFile === void 0 ? void 0 : dstFile.match(/\.css$/)) {
            fs_1.default.mkdirSync(dstFile.replace(/\/[^\/]+\.css$/, ""), { recursive: true });
            fs_1.default.writeFileSync(dstFile, "/* Your compiled CSS from your less file(s) goes here */", "utf-8");
        }
        else {
            fs_1.default.mkdirSync(dstFile.replace(/\/[^\/]+\.[^\/]+$/, ""), { recursive: true });
            fs_1.default.writeFileSync((dstFile + "/_main.css").replace(/\/\//g, ""), "/* Your compiled CSS from your less file(s) goes here */", "utf-8");
        }
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
