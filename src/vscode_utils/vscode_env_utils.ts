import path = require("path");
import vscode = require("vscode");
import { logError } from "../logger/logger";
import * as fs from 'fs';

export function isWindows(): boolean {
    return process.platform.startsWith('win');
}

export function convertPathIfWindow(path: string): string {
    try {
        if (isWindows()) {
            if (path.startsWith('\\')) {
                path = path.substring(1)
            }
            return path.replace(/\\/g, '/')
        }
        else {
            return path
        }
    }
    catch (e) {
        logError(e, false)
        return ''

    }
}

export function getWorkspace() {
    let path = getWorkspacePath('')
    return getRootPath().split('/').pop();
}

export function getRootPath() {
    let path = getWorkspacePath('')
    return convertPathIfWindow(path!);
}

export function getWorkspacePath(fileName: string): string | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        let filePath = path.join(
            `${vscode.workspace.workspaceFolders[0].uri.path}`,
            fileName
        );
        return convertPathIfWindow(filePath);
    }
}


export function checkDirInEvn(onFileFind: () => void,onFileNotFind: () => void, ...paths: string[]) {
    let targetPath: string[] = [process.env.HOME ?? ""];
    targetPath = [...targetPath, ...paths];
    let pubCacheGit = path.join(...targetPath);
    if (fs.existsSync(pubCacheGit)) {
        onFileFind()
    } else {
        console.log(`The directory ${pubCacheGit} does not exist.`);
        onFileNotFind()
    }
}



export function removeDirInEvn(onRemoveDone: () => void, ...paths: string[]) {
    let targetPath: string[] = [process.env.HOME ?? ""];
    targetPath = [...targetPath, ...paths];
    let pubCacheGit = path.join(...targetPath);
    let removeDone = !fs.existsSync(pubCacheGit);
    let count = 1;
    let maxCount = 3;
    while (!removeDone && count < maxCount) {
        fs.rmdirSync(pubCacheGit, { recursive: true });
        removeDone = fs.existsSync(pubCacheGit);
        count++
        console.log(`done`);
        onRemoveDone()
    }
    if (count >= maxCount) {
        vscode.window.showErrorMessage(`${path} 刪除失敗`, `再試一次`,'取消').then((options) => {
            if (options === "再試一次") {
                removeDirInEvn(onRemoveDone, ...paths)
            }

        })

    }
    console.log(`done`);


}
