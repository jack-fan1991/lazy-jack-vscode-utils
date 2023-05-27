import path = require("path");
import vscode = require("vscode");
import { existsSync, lstatSync, writeFile } from "fs";
import * as fs from 'fs';
import { logError, logInfo } from "../logger/logger";
import { convertPathIfWindow, getRootPath } from "./vscode_env_utils";
import * as yaml from "yaml";


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
    fs.openSync(targetPath, 'w');
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


export function getSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    let selection = editor.selection
    let text = editor.document.getText(selection)
    return text
}

export function getActivateEditorFileName(showFileType: boolean = false): string {
    let file = path.basename(getActivateEditorFilePath())
    return showFileType ? file : file.split('.')[0]
}

export function getActivateEditorFilePath(): string {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    return editor.document.fileName
}

export function getCursorLineText() {
    let editor = vscode.window.activeTextEditor
    if (!editor) {
        logError(`[No active editor]=> getCursorLineText`, false)
        return
    }
    const position = editor.selection.active;
    return editor.document.lineAt(position.line).text
}

export function getActivateEditor(): vscode.TextEditor {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    return editor
}

export function getActivateFileAsUri(): vscode.Uri {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    return editor.document.uri
}
export function getFolderPath(document: vscode.TextDocument): string {
    return path.dirname(convertPathIfWindow(document.fileName));
}

export function removeFolderPath(document: vscode.TextDocument) {
    let currentDir = path.dirname(document.fileName);
    return document.fileName.replace(currentDir, '')
}



export function getRelativePath(file1: string, file2: string, fileName: string | undefined = undefined): string {
    file1 = file1.replace(/\\/g, '/')
    file2 = file2.replace(/\\/g, '/')
    const relativePath = vscode.workspace.asRelativePath(file1, true);
    const relativePath2 = vscode.workspace.asRelativePath(file2, true);
    const relate = path.relative(path.dirname(relativePath), path.dirname(relativePath2))
    if (fileName != undefined) {
        return path.join(relate, fileName).replace(/\\/g, '/')
    }
    return relate.replace(/\\/g, '/');
}


export function getAbsFilePath(uri: vscode.Uri): string {
    let path = uri.path
    let split = path.split(':')
    if (split.length > 1) {
        path = split[0].replace('/', '') + ':' + split[1]
    }
    return path
}

export async function getYAMLFileContent(path: string | undefined): Promise<Record<string, any> | undefined> {
    try {
      if (path==undefined) throw new Error("path is undefined");
      logInfo(`正在解析 ${path}`,true)
      const fileContents = fs.readFileSync(path, 'utf-8');
      return yaml.parse(fileContents);
    } catch (e) {
      logError(`getYAMLFileContent ${e}`,false)
    }
  
}