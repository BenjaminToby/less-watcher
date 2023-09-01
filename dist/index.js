#! /usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const grabSrcDisStrings = () => {
    let srcArray = [];
    let dstArray = [];
    if (fs_1.default.existsSync("./lesscw.config.json")) {
        if (process.argv.indexOf("--src")) {
            try {
                process.argv.splice(process.argv.indexOf("--src"));
            }
            catch (error) { }
        }
        try {
            const configObject = JSON.parse(fs_1.default.readFileSync("./lesscw.config.json", "utf-8"));
            if ((configObject === null || configObject === void 0 ? void 0 : configObject.src) &&
                (configObject === null || configObject === void 0 ? void 0 : configObject.dst) &&
                typeof configObject.src === "string" &&
                typeof configObject.dst === "string") {
                srcArray = configObject.src.split(",");
                dstArray = configObject.dst.split(",");
            }
            else if ((configObject === null || configObject === void 0 ? void 0 : configObject.src) &&
                (configObject === null || configObject === void 0 ? void 0 : configObject.dst) &&
                typeof configObject.src === "object" &&
                typeof configObject.dst === "object" &&
                Array.isArray(configObject.src) &&
                Array.isArray(configObject.dst)) {
                srcArray = configObject.src;
                dstArray = configObject.dst;
            }
            else if ((configObject === null || configObject === void 0 ? void 0 : configObject.srcDst) &&
                Array.isArray(configObject.srcDst) &&
                configObject.srcDst.length > 0) {
                const srcDstArray = configObject.srcDst;
                srcDstArray.forEach((item) => {
                    if ((item === null || item === void 0 ? void 0 : item.src) &&
                        (item === null || item === void 0 ? void 0 : item.dst) &&
                        typeof item.src === "string" &&
                        typeof item.dst === "string") {
                        srcArray.push(item.src);
                        dstArray.push(item.dst);
                    }
                });
            }
            else {
                console.log("- \x1b[31mERROR:\x1b[0m Your config file has some errors. Please check your config file");
                process.exit();
            }
        }
        catch (error) {
            console.log("- \x1b[31mERROR:\x1b[0m Your config file has some errors. ERROR =>", error.message);
            process.exit();
        }
    }
    else {
        if (process.argv.indexOf("--src") >= 0 &&
            process.argv.indexOf("--dst") >= 0) {
            try {
                srcArray =
                    process.argv[process.argv.indexOf("--src") + 1].split(",");
                dstArray =
                    process.argv[process.argv.indexOf("--dst") + 1].split(",");
            }
            catch (error) { }
        }
        else {
            console.log("- \x1b[31mERROR:\x1b[0m Missing source or destination file");
            process.exit();
        }
    }
    return {
        sourceFile: srcArray.join(","),
        destinationFile: dstArray.join(","),
    };
};
const { sourceFile, destinationFile } = grabSrcDisStrings();
if (sourceFile && destinationFile) {
    process.argv.push("--src", sourceFile, "--dst", destinationFile);
}
console.log("- \x1b[35mStart:\x1b[0m Running Less compiler ...");
if (!sourceFile || !destinationFile) {
    console.log("- \x1b[31mERROR:\x1b[0m => Missing source or destination file");
    process.exit();
}
function traverseFiles(src, dst) {
    var _a;
    const sourceFiles = src.split(",");
    const dstFiles = dst.split(",");
    for (let i = 0; i < sourceFiles.length; i++) {
        const srcFolder = sourceFiles[i];
        const dstFile = dstFiles[i];
        if ((srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\/[^\/]+\.[^\/]+$/)) &&
            !(srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/))) {
            console.log("- \x1b[31mERROR:\x1b[0m Source must be a folder or a .less file");
            process.exit();
        }
        if (!fs_1.default.existsSync(srcFolder)) {
            if (srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/)) {
                fs_1.default.mkdirSync(srcFolder.replace(/\/[^\/]+\.less$/, ""), {
                    recursive: true,
                });
                fs_1.default.writeFileSync(srcFolder, "", "utf-8");
            }
            else {
                fs_1.default.mkdirSync(srcFolder.replace(/\/[^\/]+\.[^\/]+$/, ""), {
                    recursive: true,
                });
                fs_1.default.writeFileSync((srcFolder + "/main.less").replace(/\/\//g, ""), "", "utf-8");
            }
        }
        else if (fs_1.default.existsSync(srcFolder) &&
            fs_1.default.existsSync((srcFolder + "/main.less").replace(/\/\//g, ""))) {
        }
        if (!fs_1.default.existsSync(dstFile)) {
            if (dstFile === null || dstFile === void 0 ? void 0 : dstFile.match(/\.css$/)) {
                fs_1.default.mkdirSync(dstFile.replace(/\/[^\/]+\.css$/, ""), {
                    recursive: true,
                });
            }
            else {
                fs_1.default.mkdirSync(dstFile.replace(/\/[^\/]+\.[^\/]+$/, ""), {
                    recursive: true,
                });
            }
        }
        compile(srcFolder, dstFile, null);
        try {
            fs_1.default.readdirSync(srcFolder).forEach((file) => {
                if (file === null || file === void 0 ? void 0 : file.match(/^\[.*\.less$/)) {
                    compile(srcFolder + "/" + file, dstFile, null);
                }
            });
        }
        catch (error) { }
        if (srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.less$/)) {
            fs_1.default.watchFile(srcFolder, { interval: 500 }, (current, previous) => {
                const dstFilePathRoot = (dstFile === null || dstFile === void 0 ? void 0 : dstFile.match(/\.css$/))
                    ? dstFile
                    : dstFile + "/" + "_main.css";
                try {
                    const currentProcessArgsSrc = process.argv[process.argv.indexOf("--src") + 1];
                    const activeSourceFiles = currentProcessArgsSrc.split(",");
                    if (activeSourceFiles.includes(srcFolder)) {
                        compile(srcFolder, dstFilePathRoot, null);
                    }
                    else {
                        fs_1.default.unwatchFile(srcFolder);
                    }
                }
                catch (error) {
                    console.log("- \x1b[31mERROR:\x1b[0m Please check your config file =>", error.message);
                }
            });
        }
        else if (!(srcFolder === null || srcFolder === void 0 ? void 0 : srcFolder.match(/\.[^\/]+$/))) {
            fs_1.default.watch(srcFolder, {
                recursive: ((_a = process.platform) === null || _a === void 0 ? void 0 : _a.match(/win/i))
                    ? true
                    : undefined,
            }, (evtType, fileName) => {
                if (!(evtType === null || evtType === void 0 ? void 0 : evtType.match(/change/i))) {
                    return;
                }
                if (!fileName)
                    return;
                const srcFilePathRoot = srcFolder + "/main.less";
                try {
                    const currentProcessArgsSrc = process.argv[process.argv.indexOf("--src") + 1];
                    const activeSourceFiles = currentProcessArgsSrc.split(",");
                    if (fileName === null || fileName === void 0 ? void 0 : fileName.match(/^\[/)) {
                        compile(srcFolder + "/" + fileName, dstFile, evtType);
                    }
                    else if ((fileName === null || fileName === void 0 ? void 0 : fileName.match(/^\(/)) ||
                        activeSourceFiles.includes(srcFilePathRoot)) {
                        return;
                    }
                    else {
                        compile(srcFilePathRoot, dstFile, evtType);
                    }
                }
                catch (error) {
                    console.log("- \x1b[31mERROR:\x1b[0m Please check your config file =>", error.message);
                }
            });
        }
        else {
            console.log("- \x1b[31mERROR:\x1b[0m Source must be a folder or a .less file");
            process.exit();
        }
    }
}
traverseFiles(sourceFile, destinationFile);
function compile(fileName, dst, evtType) {
    if ((fileName === null || fileName === void 0 ? void 0 : fileName.match(/\(/)) ||
        (fileName.match(/\.[\/]$/) && !(fileName === null || fileName === void 0 ? void 0 : fileName.match(/\.less$/i)))) {
        return;
    }
    let finalSrcPath = (fileName === null || fileName === void 0 ? void 0 : fileName.match(/\.less$/))
        ? fileName
        : `${fileName}/main.less`;
    const distFolder = (dst === null || dst === void 0 ? void 0 : dst.match(/\.css$/)) ? null : dst === null || dst === void 0 ? void 0 : dst.replace(/\/+$/, "");
    let finalDstPath = distFolder ? `${distFolder}/_main.css` : dst;
    if (distFolder && !fs_1.default.existsSync(distFolder)) {
        fs_1.default.mkdirSync(distFolder, { recursive: true });
    }
    if (fileName === null || fileName === void 0 ? void 0 : fileName.match(/\[/)) {
        const paths = fileName.split("/");
        const targetPathFull = paths[paths.length - 1];
        const targetPath = targetPathFull
            .replace(/\[|\]/g, "")
            .replace(/\.less/, "");
        const destinationFileParentFolder = dst.replace(/\/[^\/]+\.css$/, "");
        const targetDstFilePath = `${destinationFileParentFolder}/${targetPath}.css`;
        finalSrcPath = fileName;
        finalDstPath = targetDstFilePath;
    }
    const executionCmd = `lessc ${finalSrcPath} ${finalDstPath}`;
    (0, child_process_1.exec)(executionCmd, (error, stdout, stderr) => {
        if (error) {
            console.log("- \x1b[33mWarn:\x1b[0m Compilation didn't run successfully. ERROR =>", error.message);
            if (!(evtType === null || evtType === void 0 ? void 0 : evtType.match(/change/i)) &&
                fileName &&
                fileName.match(/\[/)) {
                fs_1.default.unlinkSync(finalDstPath);
            }
            return;
        }
        console.log("- \x1b[32mCompiled:\x1b[0m Less Compilation Successful!");
    });
}
if (fs_1.default.existsSync("./lesscw.config.json")) {
    fs_1.default.watchFile("./lesscw.config.json", { interval: 500 }, (evtType, fileName) => {
        console.log("- \x1b[34mInfo:\x1b[0m Restarting process...");
        const newSrcDistStrings = grabSrcDisStrings();
        if (newSrcDistStrings.destinationFile &&
            newSrcDistStrings.sourceFile) {
            process.argv.push("--src", newSrcDistStrings.sourceFile, "--dst", newSrcDistStrings.destinationFile);
            traverseFiles(newSrcDistStrings.sourceFile, newSrcDistStrings.destinationFile);
        }
    });
}
