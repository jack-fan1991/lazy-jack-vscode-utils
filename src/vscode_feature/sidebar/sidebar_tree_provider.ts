import { runCommand, runTerminal } from "../../terminal_utils/terminal_utils";
import { sidebar_command_onselect } from "./sidebar";
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
    abstract viewsId():string
    abstract supportScripts():TreeScriptModel[]
    constructor(private workspaceRoot?: string) { 
    }

    public static  parseScripts(scripts: TreeScriptModel[]): SideBarEntryItem[] {
        let childrenList: SideBarEntryItem[] = []
        for (let index = 0; index < scripts.length; index++) {
            let script = scripts[index]
            let item = new SideBarEntryItem(
                script.label ?? script.script,
                vscode.TreeItemCollapsibleState.None,
                script.scriptsType,
            )
            item.command = {
                command: sidebar_command_onselect, //命令id
                title: "run" + scripts[index].label + "on" + scripts[index].scriptsType,
                arguments: [scripts[index]], //命令接收的参数
            }
            childrenList[index] = item
        }
        return childrenList
    }

    /// register to vscode
    register(context : vscode.ExtensionContext){
        vscode.window.registerTreeDataProvider(this.viewsId(), this);
    }

    getTreeItem(element: SideBarEntryItem): vscode.TreeItem {
        return element
    }
    getChildren(): vscode.ProviderResult<SideBarEntryItem[]> {
        return  Promise.resolve(BaseTreeDataProvider.parseScripts(this.supportScripts()));
    }

    // 分發事件
    dispatchEvent(context: vscode.ExtensionContext,scriptModel: TreeScriptModel) {
        //default run terminal
        if (scriptModel.scriptsType == ScriptsType.terminal) {
            runTerminal(scriptModel.script)
        }
        else{
            runCommand(scriptModel.script)
        }

    }
    // 在 extension.ts 會註冊 ../sidebar_command_onselect
    // BaseTreeDataProvider 皆會收到命令 並透過 handleCommand 處理進行分發
    handleCommand(context: vscode.ExtensionContext, scriptModel: TreeScriptModel) {
        let allScripts = this.supportScripts().map((item) => { return item.script })
        if (allScripts.includes(scriptModel.script)) {
            this.dispatchEvent(context,scriptModel)
        }
    }
}
