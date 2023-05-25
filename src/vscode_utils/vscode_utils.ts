import vscode = require("vscode");
export * as vscode_env_utils from "./vscode_env_utils";
export * as editor_utils from "./editor_utils";
export * as activate_editor_utils from "./activate_editor_utils";



export function openBrowser(url: string) {
    vscode.env.openExternal(vscode.Uri.parse(url));
}

export function showPicker(placeholder: string, items: any, onItemSelect: (item: any) => void) {
    let quickPick = vscode.window.createQuickPick();
    quickPick.placeholder = placeholder
    quickPick.items = items;
    quickPick.onDidAccept(() => onItemSelect(quickPick.selectedItems[0]));
    quickPick.show()
  }
  
  