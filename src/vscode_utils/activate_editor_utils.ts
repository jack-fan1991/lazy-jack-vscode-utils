import path = require("path");
import vscode = require("vscode");

/// 一定是當前有active的editor
export function getActivateSelectedText() {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    let selection = editor.selection
    let text = editor.document.getText(selection)
    return text
}

export  function getActivateText(range: vscode.Range | undefined = undefined) {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    if (range != null) {
        return editor.document.getText(range)
    }
    let text = editor.document.getText()
    return text
}

export function getActivateTextEditor() {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    return editor
}

export async function reFormat() {
    await vscode.commands.executeCommand('editor.action.formatDocument')
}

export function saveActivateEditor() {
    let editor = vscode.window.activeTextEditor
    if (!editor)
        throw new Error('No active editor');
    return editor.document.save()
}


export async function insertToActivateEditor(text: string, range: vscode.Position | undefined = undefined, msg: string | undefined = undefined) {
    await getActivateTextEditor().edit((editBuilder) => {
        if (msg) {
            vscode.window.showInformationMessage(msg)
        }
        editBuilder.insert(range ?? new vscode.Position(0, 0), text);
    })
}
