import { runCommand, runTerminal } from "../../terminal_utils/terminal_utils";
import { ScriptsType, SideBarEntryItem, TreeScriptModel } from "./sidebar_model"
import * as vscode from 'vscode';

/*

* Every tree Item is register on common 'lazyjack.sidebar.command.onselect'
* BaseTreeDataProvider provide handleCommand for every tree item call back with TreeScriptModel
* Implement your own BaseTreeDataProvider.handleCommand to handle your TreeScriptModel

How to use:

* project/src/extension.ts
* see FirebaseDataProvider =>root/lazy_jack_flutter_flavor_magic/src/sidebar/firebase.ts
* register your own BaseTreeDataProvider

export async function activate(context: vscode.ExtensionContext) {
  let sideBars: BaseTreeDataProvider[] = []
  sideBars.push(new FirebaseDataProvider())
  for (let sideBar of sideBars) {
    sideBar.register(context)
  }

  vscode.commands.registerCommand(sidebar_command_onselect, (args) => {
    let dataScript = args as TreeDataScript
    if (dataScript.scriptsType == sidebar.ScriptsType.browser) {
      openBrowser(dataScript.script)
      return
    }
    for (let sideBar of sideBars) {
      sideBar.handleCommand(context, dataScript)
    }
  })
}
export function deactivate() { }
*/

export abstract class BaseTreeDataProvider implements vscode.TreeDataProvider<SideBarEntryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    static sidebar_command_onselect = 'sidebar.command.onselect'
    // 用於註冊在package.json

    // "views": {
    //     "explorer": [
    //         {
    //             "id": "lazyjack.sidebar",
    //             "name": "Lazy Jack",
    //             "when": "explorerResourceIsFolder && explorerViewletVisible && !inputFocus"
    //         }
    //     ]
    // },
    viewsId(): string {
        return this.constructor.name
    }
    abstract supportScripts(): TreeScriptModel[]
    constructor(private workspaceRoot?: string) {
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(); // undefined 表示整棵樹都刷新
    }

    public static parseScripts(scripts: TreeScriptModel[]): SideBarEntryItem[] {
        let childrenList: SideBarEntryItem[] = []
        for (let index = 0; index < scripts.length; index++) {
            let script = scripts[index]
            let item = new SideBarEntryItem(
                script.label ?? script.script,
                vscode.TreeItemCollapsibleState.None,
                script.scriptsType,
            )
            item.command = {
                command: BaseTreeDataProvider.sidebar_command_onselect, //命令id
                title: "run" + scripts[index].label + "on" + scripts[index].scriptsType,
                arguments: [scripts[index]], //命令接收的参数
            }
            childrenList[index] = item
        }
        return childrenList
    }

    /// register to vscode
    registerToVscode(context: vscode.ExtensionContext) {
        vscode.window.registerTreeDataProvider(this.viewsId(), this);
    }

    getTreeItem(element: SideBarEntryItem): vscode.TreeItem {
        return element
    }
    getChildren(): vscode.ProviderResult<SideBarEntryItem[]> {
        let items = this.supportScripts()
        const uniqueItems = this.deduplicateBy(items, item => `${item.script}-${item.label}`);
        return Promise.resolve(BaseTreeDataProvider.parseScripts(uniqueItems));
    }

    deduplicateBy<T>(array: T[], keyFn: (item: T) => string): T[] {
        const seen = new Set<string>();
        return array.filter(item => {
            const key = keyFn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    // 分發事件
    dispatchEvent(context: vscode.ExtensionContext, scriptModel: TreeScriptModel) {
        if (scriptModel.itemAction != undefined) {
            scriptModel.itemAction()
            return
        }
        //default run terminal
        if (scriptModel.scriptsType == ScriptsType.terminal) {
            runTerminal(scriptModel.script)
        }
        else {
            runCommand(scriptModel.script)
        }

    }
    // 在 extension.ts 會註冊 ../sidebar_command_onselect
    // BaseTreeDataProvider 皆會收到命令 並透過 handleCommand 處理進行分發
    handleCommand(context: vscode.ExtensionContext, scriptModel: TreeScriptModel) {
        let allScripts = this.supportScripts().map((item) => { return item.script })
        if (allScripts.includes(scriptModel.script)) {
            this.dispatchEvent(context, scriptModel)
        }
    }
}
