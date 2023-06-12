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
  
  

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  export async function tryRun(fn:  () => Promise<boolean>|boolean , minutes: number=3 , msSleepSeconds: number = 5000): Promise<any | undefined> {
    let count = 0
    let maxTry = minutes * 60 / (msSleepSeconds / 1000)
    while (count < maxTry) {
      try {
        let result = await fn()
        if (!result) throw new Error(`tryRun retry remind ${maxTry-count} times`)
        return fn()
      } catch (e) {
        console.log(e)
        count++
        await sleep(msSleepSeconds)
      }
    }
    return undefined
  }