
import * as vscode from 'vscode';
import { BaseTreeDataProvider } from './sidebar_tree_provider';
import { ScriptsType, TreeScriptModel } from './sidebar_model';
import { openBrowser } from '../../vscode_utils/vscode_utils';

export class SidebarManager {
    private sideBars: BaseTreeDataProvider[] = [];
    constructor() { }

    public addSideBar(sideBar: BaseTreeDataProvider): SidebarManager {
        this.sideBars.push(sideBar);
        return this;
    }

    public registerSideBar(context: vscode.ExtensionContext) {
        for (const sideBar of this.sideBars) {
            sideBar.registerToVscode(context);
        }
    }

    public registerSideBarCommands(context :vscode.ExtensionContext ,  sidebarItemSelectClickCommand: string): SidebarManager  {
        BaseTreeDataProvider.sidebar_command_onselect =sidebarItemSelectClickCommand
        vscode.commands.registerCommand(sidebarItemSelectClickCommand, (args) => {
            const itemScript = args as TreeScriptModel;

            if (itemScript.scriptsType === ScriptsType.browser) {
                openBrowser(itemScript.script);
                return;
            }

            for (const sideBar of this.sideBars) {
                sideBar.handleCommand(context, itemScript);
            }
        });
        return this;
    }
}

