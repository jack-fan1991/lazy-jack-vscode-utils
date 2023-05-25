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

export class BaseTreeDataProvider implements vscode.TreeDataProvider<SideBarEntryItem> {
    readonly supportScripts: TreeScriptModel[] = []
    readonly providerLabel: string=''
    constructor(private workspaceRoot?: string) { 
    }
    ///  part tou
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
        vscode.window.registerTreeDataProvider(this.providerLabel, this);
    }

    getTreeItem(element: SideBarEntryItem): vscode.TreeItem {
        return element
    }
    getChildren(): vscode.ProviderResult<SideBarEntryItem[]> {
        return []
    }

    /// implement this method to handle your action from TreeScriptModel
    handleCommand(context: vscode.ExtensionContext, scriptModel: TreeScriptModel) {
        let allScripts = this.supportScripts.map((item) => { return item.script })
        if (allScripts.includes(scriptModel.script)) {
            if (scriptModel.scriptsType == ScriptsType.terminal) {
                runTerminal(scriptModel.script)
            }
            else{
                runCommand(scriptModel.script)
            }
        }
    }
}
