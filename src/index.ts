#! /usr/bin/env node

import fs, { watch } from "fs";
import { exec, spawn } from "child_process";
import { LessCssWatcherConfigObject } from "./index.d";

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const grabSrcDisStrings = () => {
    if (fs.existsSync("./lesscw.config.json")) {
        if (process.argv.indexOf("--src") >= 0 || process.argv.indexOf("--dst") >= 0) {
            try {
                process.argv.splice(process.argv.indexOf("--src"));
                process.argv.splice(process.argv.indexOf("--dst"));
            } catch (error) {}
        }

        try {
            const configObject: LessCssWatcherConfigObject = JSON.parse(fs.readFileSync("./lesscw.config.json", "utf-8"));

            if (configObject?.src && configObject?.dst && typeof configObject.src === "string" && typeof configObject.dst === "string") {
                process.argv.push("--src", configObject.src);
                process.argv.push("--dst", configObject.dst);
            } else if (configObject?.src && configObject?.dst && typeof configObject.src === "object" && typeof configObject.dst === "object" && Array.isArray(configObject.src) && Array.isArray(configObject.dst)) {
                process.argv.push("--src", configObject.src.join(","));
                process.argv.push("--dst", configObject.dst.join(","));
            } else if (configObject?.srcDst && Array.isArray(configObject.srcDst) && configObject.srcDst.length > 0) {
                const srcDstArray = configObject.srcDst;

                let srcArray: string[] = [];
                let dstArray: string[] = [];

                srcDstArray.forEach((item) => {
                    if (item?.src && item?.dst && typeof item.src === "string" && typeof item.dst === "string") {
                        srcArray.push(item.src);
                        dstArray.push(item.dst);
                    }
                });

                if (srcArray.length && dstArray.length) {
                    process.argv.push("--src", srcArray.join(","));
                    process.argv.push("--dst", dstArray.join(","));
                }
            }
        } catch (error: any) {
            console.log("- \x1b[31mERROR:\x1b[0m Your config file has some errors. ERROR =>", error.message);
            process.exit();
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    const sourceFile = process.argv.indexOf("--src") >= 0 ? process.argv[process.argv.indexOf("--src") + 1] : null;
    const destinationFile = process.argv.indexOf("--dst") >= 0 ? process.argv[process.argv.indexOf("--dst") + 1] : null;

    return { sourceFile, destinationFile };
};

const { sourceFile, destinationFile } = grabSrcDisStrings();

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

console.log("- \x1b[35mStart:\x1b[0m Running Less compiler ...");

if (!sourceFile || !destinationFile) {
    console.log("- \x1b[31mERROR:\x1b[0m => Missing source or destination file");
    process.exit();
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Loop through source files and destination files and run the compile function
 */
function traverseFiles(src: string, dst: string) {
    const sourceFiles = src.split(",");
    const dstFiles = dst.split(",");

    for (let i = 0; i < sourceFiles.length; i++) {
        const srcFolder = sourceFiles[i];
        const dstFile = dstFiles[i];

        if (srcFolder?.match(/\.[^\/]+$/) && !srcFolder?.match(/\.less$/)) {
            console.log("- \x1b[31mERROR:\x1b[0m Source must be a folder or a .less file");
            process.exit();
        }

        if (!fs.existsSync(srcFolder)) {
            if (srcFolder?.match(/\.less$/)) {
                fs.mkdirSync(srcFolder.replace(/\/[^\/]+\.less$/, ""), { recursive: true });
                fs.writeFileSync(srcFolder, "", "utf-8");
            } else {
                fs.mkdirSync(srcFolder.replace(/\/[^\/]+\.[^\/]+$/, ""), { recursive: true });
                fs.writeFileSync((srcFolder + "/main.less").replace(/\/\//g, ""), "", "utf-8");
            }
        } else if (fs.existsSync(srcFolder) && fs.existsSync((srcFolder + "/main.less").replace(/\/\//g, ""))) {
            fs.writeFileSync((srcFolder + "/main.less").replace(/\/\//g, ""), "", "utf-8");
        }

        if (!fs.existsSync(dstFile)) {
            if (dstFile?.match(/\.css$/)) {
                fs.mkdirSync(dstFile.replace(/\/[^\/]+\.css$/, ""), { recursive: true });
                fs.writeFileSync(dstFile, "/* Your compiled CSS from your less file(s) goes here */", "utf-8");
            } else {
                fs.mkdirSync(dstFile.replace(/\/[^\/]+\.[^\/]+$/, ""), { recursive: true });
                fs.writeFileSync((dstFile + "/_main.css").replace(/\/\//g, ""), "/* Your compiled CSS from your less file(s) goes here */", "utf-8");
            }
        }

        compile(srcFolder, dstFile, null);

        const watcher = fs.watch(srcFolder, { recursive: true }, (evtType, fileName) => {
            if (!fileName) return;

            const filePathRoot = srcFolder?.match(/\.less$/) ? srcFolder : srcFolder + "/" + fileName;

            try {
                const currentProcessArgsSrc = process.argv[process.argv.indexOf("--src") + 1];
                const activeSourceFiles = currentProcessArgsSrc.split(",");

                if (activeSourceFiles.includes(srcFolder)) {
                    compile(filePathRoot, dstFile, evtType);
                } else {
                    watcher.close();
                }
            } catch (error: any) {
                console.log("- \x1b[31mERROR:\x1b[0m Please check your config file =>", error.message);
            }
        });
    }
}

traverseFiles(sourceFile, destinationFile);

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * Compile less file to css function
 * @param fileName - less file path or folder path
 * @param dst - destination file path or folder path
 * @param evtType - event type (change, rename, etc.) or null
 * @returns
 */
function compile(fileName: string, dst: string, evtType: string | null) {
    if (fileName?.match(/\(/) || (fileName.match(/\..{2,4}$/) && !fileName?.match(/\.less$/i))) {
        return;
    }

    let finalSrcPath = fileName?.match(/\.less$/) ? fileName : `${fileName}/main.less`;
    let finalDstPath = dst;

    if (fileName?.match(/\[/)) {
        const paths = fileName.split("/");
        const targetPathFull = paths[paths.length - 1];
        const targetPath = targetPathFull.replace(/\[|\]/g, "").replace(/\.less/, "");

        const destinationFileParentFolder = dst.replace(/\/[^\/]+\.css$/, "");

        const targetDstFilePath = `${destinationFileParentFolder}/${targetPath}.css`;

        finalSrcPath = `${fileName}/${targetPathFull}`;
        finalDstPath = targetDstFilePath;
    }

    exec(`lessc ${finalSrcPath} ${finalDstPath?.match(/\.css$/) ? finalDstPath : finalDstPath.replace(/\/$/, "") + "/_main.css"}`, (error, stdout, stderr) => {
        /** @type {Error} */
        if (error) {
            console.log("- \x1b[33mWarn:\x1b[0m Compilation didn't run successfully. ERROR =>", error.message);

            if (!evtType?.match(/change/i) && fileName && fileName.match(/\[/)) {
                fs.unlinkSync(finalDstPath);
            }

            return;
        }

        console.log("- \x1b[32mCompiled:\x1b[0m Less Compilation Successful!");
    });
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

/**
 * watch for changes to the config file
 */
if (fs.existsSync("./lesscw.config.json")) {
    fs.watchFile("./lesscw.config.json", (evtType, fileName) => {
        console.log("- \x1b[34mInfo:\x1b[0m! Restarting process...");

        const newSrcDistStrings = grabSrcDisStrings();

        if (newSrcDistStrings.destinationFile && newSrcDistStrings.sourceFile) {
            process.argv.push("--src", newSrcDistStrings.sourceFile, "--dst", newSrcDistStrings.destinationFile);
            traverseFiles(newSrcDistStrings.sourceFile, newSrcDistStrings.destinationFile);
        }
    });
}
