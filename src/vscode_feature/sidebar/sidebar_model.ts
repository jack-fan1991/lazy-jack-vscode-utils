import * as vscode from 'vscode';

export enum ScriptsType {
    terminal = 'terminal',
    command = 'command',
    browser = 'browser',
    customer = 'customer'
}

export type TreeScriptModel = {
    scriptsType: ScriptsType;
    label: string;
    script: string;
    description?: string;

};

export class SideBarEntryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly  scriptsType :ScriptsType,
        public description?: string,
        
    ) {
        super(label, collapsibleState)
        this.tooltip = `${this.label}`
        if(this.description != undefined){
            this.tooltip += `( ${this.description} )`
        }
        // this.description = `${this.version}-${Math.ceil(Math.random() * 1000)}`
    }
}
