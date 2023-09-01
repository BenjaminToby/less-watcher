#! /usr/bin/env node

import fs from "fs";
import { exec } from "child_process";
import { LessCssWatcherConfigObject } from "./index.d";

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

const grabSrcDisStrings = () => {
    let srcArray: string[] = [];
    let dstArray: string[] = [];

    if (fs.existsSync("./lesscw.config.json")) {
        if (process.argv.indexOf("--src")) {
            try {
                process.argv.splice(process.argv.indexOf("--src"));
            } catch (error) {}
        }

        try {
            const configObject: LessCssWatcherConfigObject = JSON.parse(
                fs.readFileSync("./lesscw.config.json", "utf-8")
            );

            if (
                configObject?.src &&
                configObject?.dst &&
                typeof configObject.src === "string" &&
                typeof configObject.dst === "string"
            ) {
                srcArray = configObject.src.split(",");
                dstArray = configObject.dst.split(",");
            } else if (
                configObject?.src &&
                configObject?.dst &&
                typeof configObject.src === "object" &&
                typeof configObject.dst === "object" &&
                Array.isArray(configObject.src) &&
                Array.isArray(configObject.dst)
            ) {
                srcArray = configObject.src;
                dstArray = configObject.dst;
            } else if (
                configObject?.srcDst &&
                Array.isArray(configObject.srcDst) &&
                configObject.srcDst.length > 0
            ) {
                const srcDstArray = configObject.srcDst;

                srcDstArray.forEach((item) => {
                    if (
                        item?.src &&
                        item?.dst &&
                        typeof item.src === "string" &&
                        typeof item.dst === "string"
                    ) {
                        srcArray.push(item.src);
                        dstArray.push(item.dst);
                    }
                });
            } else {
                console.log(
                    "- \x1b[31mERROR:\x1b[0m Your config file has some errors. Please check your config file"
                );
                process.exit();
            }
        } catch (error: any) {
            console.log(
                "- \x1b[31mERROR:\x1b[0m Your config file has some errors. ERROR =>",
                error.message
            );
            process.exit();
        }
    } else {
        if (
            process.argv.indexOf("--src") >= 0 &&
            process.argv.indexOf("--dst") >= 0
        ) {
            try {
                srcArray =
                    process.argv[process.argv.indexOf("--src") + 1].split(",");
                dstArray =
                    process.argv[process.argv.indexOf("--dst") + 1].split(",");
            } catch (error) {}
        } else {
            console.log(
                "- \x1b[31mERROR:\x1b[0m Missing source or destination file"
            );
            process.exit();
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    return {
        sourceFile: srcArray.join(","),
        destinationFile: dstArray.join(","),
    };
};

const { sourceFile, destinationFile } = grabSrcDisStrings();

if (sourceFile && destinationFile) {
    process.argv.push("--src", sourceFile, "--dst", destinationFile);
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

console.log("- \x1b[35mStart:\x1b[0m Running Less compiler ...");

if (!sourceFile || !destinationFile) {
    console.log(
        "- \x1b[31mERROR:\x1b[0m => Missing source or destination file"
    );
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

        if (
            srcFolder?.match(/\/[^\/]+\.[^\/]+$/) &&
            !srcFolder?.match(/\.less$/)
        ) {
            console.log(
                "- \x1b[31mERROR:\x1b[0m Source must be a folder or a .less file"
            );
            process.exit();
        }

        if (!fs.existsSync(srcFolder)) {
            if (srcFolder?.match(/\.less$/)) {
                fs.mkdirSync(srcFolder.replace(/\/[^\/]+\.less$/, ""), {
                    recursive: true,
                });
                fs.writeFileSync(srcFolder, "", "utf-8");
            } else {
                fs.mkdirSync(srcFolder.replace(/\/[^\/]+\.[^\/]+$/, ""), {
                    recursive: true,
                });
                fs.writeFileSync(
                    (srcFolder + "/main.less").replace(/\/\//g, ""),
                    "",
                    "utf-8"
                );
            }
        } else if (
            fs.existsSync(srcFolder) &&
            fs.existsSync((srcFolder + "/main.less").replace(/\/\//g, ""))
        ) {
        }

        if (!fs.existsSync(dstFile)) {
            if (dstFile?.match(/\.css$/)) {
                fs.mkdirSync(dstFile.replace(/\/[^\/]+\.css$/, ""), {
                    recursive: true,
                });
            } else {
                fs.mkdirSync(dstFile.replace(/\/[^\/]+\.[^\/]+$/, ""), {
                    recursive: true,
                });
            }
        }

        compile(srcFolder, dstFile, null);

        try {
            fs.readdirSync(srcFolder).forEach((file) => {
                if (file?.match(/^\[.*\.less$/)) {
                    compile(srcFolder + "/" + file, dstFile, null);
                }
            });
        } catch (error) {}

        if (srcFolder?.match(/\.less$/)) {
            fs.watchFile(srcFolder, { interval: 500 }, (current, previous) => {
                const dstFilePathRoot = dstFile?.match(/\.css$/)
                    ? dstFile
                    : dstFile + "/" + "_main.css";

                try {
                    const currentProcessArgsSrc =
                        process.argv[process.argv.indexOf("--src") + 1];
                    const activeSourceFiles = currentProcessArgsSrc.split(",");

                    if (activeSourceFiles.includes(srcFolder)) {
                        compile(srcFolder, dstFilePathRoot, null);
                    } else {
                        fs.unwatchFile(srcFolder);
                    }
                } catch (error: any) {
                    console.log(
                        "- \x1b[31mERROR:\x1b[0m Please check your config file =>",
                        error.message
                    );
                }
            });
        } else if (!srcFolder?.match(/\.[^\/]+$/)) {
            fs.watch(
                srcFolder,
                {
                    recursive: process.platform?.match(/win/i)
                        ? true
                        : undefined,
                },
                (evtType, fileName) => {
                    if (!evtType?.match(/change/i)) {
                        return;
                    }

                    if (!fileName) return;

                    const srcFilePathRoot = srcFolder + "/main.less";

                    try {
                        const currentProcessArgsSrc =
                            process.argv[process.argv.indexOf("--src") + 1];
                        const activeSourceFiles =
                            currentProcessArgsSrc.split(",");

                        if (fileName?.match(/^\[/)) {
                            compile(
                                srcFolder + "/" + fileName,
                                dstFile,
                                evtType
                            );
                        } else if (
                            fileName?.match(/^\(/) ||
                            activeSourceFiles.includes(srcFilePathRoot)
                        ) {
                            return;
                        } else {
                            compile(srcFilePathRoot, dstFile, evtType);
                        }
                    } catch (error: any) {
                        console.log(
                            "- \x1b[31mERROR:\x1b[0m Please check your config file =>",
                            error.message
                        );
                    }
                }
            );
        } else {
            console.log(
                "- \x1b[31mERROR:\x1b[0m Source must be a folder or a .less file"
            );
            process.exit();
        }
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
    if (
        fileName?.match(/\(/) ||
        (fileName.match(/\.[\/]$/) && !fileName?.match(/\.less$/i))
    ) {
        return;
    }

    let finalSrcPath = fileName?.match(/\.less$/)
        ? fileName
        : `${fileName}/main.less`;
    const distFolder = dst?.match(/\.css$/) ? null : dst?.replace(/\/+$/, "");
    let finalDstPath = distFolder ? `${distFolder}/_main.css` : dst;

    if (distFolder && !fs.existsSync(distFolder)) {
        fs.mkdirSync(distFolder, { recursive: true });
    }

    if (fileName?.match(/\[/)) {
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

    exec(executionCmd, (error, stdout, stderr) => {
        /** @type {Error} */
        if (error) {
            console.log(
                "- \x1b[33mWarn:\x1b[0m Compilation didn't run successfully. ERROR =>",
                error.message
            );

            if (
                !evtType?.match(/change/i) &&
                fileName &&
                fileName.match(/\[/)
            ) {
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
    fs.watchFile(
        "./lesscw.config.json",
        { interval: 500 },
        (evtType, fileName) => {
            console.log("- \x1b[34mInfo:\x1b[0m Restarting process...");

            const newSrcDistStrings = grabSrcDisStrings();

            if (
                newSrcDistStrings.destinationFile &&
                newSrcDistStrings.sourceFile
            ) {
                process.argv.push(
                    "--src",
                    newSrcDistStrings.sourceFile,
                    "--dst",
                    newSrcDistStrings.destinationFile
                );
                traverseFiles(
                    newSrcDistStrings.sourceFile,
                    newSrcDistStrings.destinationFile
                );
            }
        }
    );
}
