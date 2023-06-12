import path = require("path");
import vscode = require("vscode");
import { existsSync, lstatSync, writeFile } from "fs";
import * as fs from 'fs';
import { logError } from "../logger/logger";
import { convertPathIfWindow, getRootPath, getWorkspacePath } from "./vscode_env_utils";
import { runCommand } from "../terminal_utils/terminal_utils";


export async function openEditor(filePath:string, focus?: boolean): Promise<vscode.TextEditor | undefined> {
    filePath = vscode.Uri.parse(filePath).fsPath
    filePath = convertPathIfWindow(filePath)
    if (!fs.existsSync(filePath)) return
    let editor = vscode.window.visibleTextEditors.find(e => convertPathIfWindow(e.document.fileName) === filePath)
    if (!editor) {
      await vscode.workspace.openTextDocument(filePath).then(async (document) =>
        editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside, focus ?? false).then(editor => editor))
    }
    return editor
  }

export async function insertToEditor(editor: vscode.TextEditor, text: string, range: vscode.Position | undefined = undefined, msg: string | undefined = undefined) {
    await editor.edit((editBuilder) => {
        if (msg) {
            vscode.window.showInformationMessage(msg)
        }
        editBuilder.insert(range ?? new vscode.Position(0, 0), text);

    })
    if (editor.document.isDirty) {
        await editor.document.save()
    }
}

export function readFileToText(path: string) {
    if (!existsSync(path)) {
        throw Error(`readFileToText failed ${path} not exists`);
    }
    return fs.readFileSync(path, 'utf8')
}



export async function replaceText(filePath: string, searchValue: string, replaceValue: string): Promise<boolean> {
    // find yaml editor
    let editor = vscode.window.visibleTextEditors.find(e => e.document.fileName === filePath)
    if (!editor) {
        await vscode.workspace.openTextDocument(filePath).then(async (document) =>
            editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside, false).then(editor => editor))
    }
    if (!editor) {
        return false
    }
    // 修改yaml 中的 version
    const document = editor.document;
    const start = new vscode.Position(0, 0);
    const end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
    const textRange = new vscode.Range(start, end);
    const text = document.getText();
    const startIndex = text.indexOf(searchValue);
    if (startIndex !== -1) {
        const endIndex = startIndex + searchValue.length;
        const range = new vscode.Range(document.positionAt(startIndex), document.positionAt(endIndex));
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, replaceValue);
        });

        editor.document.save()
        return true
    }
    else {
        logError(`replaceText filePath 中找不到${searchValue}`, true)
        return false

    }
}



export function isFileExist(filePath: string) {
    let root = getRootPath()
    if (!filePath.startsWith(root)) {
        filePath = path.join(root, filePath)
    }
    let exist = existsSync(filePath)
    return exist
}


export async function createFile(
    targetPath: string,
    text: string,
) {
    if (existsSync(targetPath)) {
        throw Error(`$targetPath already exists`);
    }
    runCommand(`mkdir -p ${getWorkspacePath('lib/application')}`)
    return new Promise<void>(async (resolve, reject) => {
        writeFile(
            targetPath,
            text,
            "utf8",
            (error) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();

            }
        );
    });
}

 export  async  function listFilesInDirectory(directory: vscode.Uri): Promise<string[]> {
    const files: string[] = [];
    const entries = await vscode.workspace.fs.readDirectory(directory);
    for (const [name, type] of entries) {
      if (type === vscode.FileType.File) {
        files.push(name);
      }
    }
    return files;
  }