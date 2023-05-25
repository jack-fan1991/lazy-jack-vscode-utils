  # lazy_jack_vscode_utils
  
## BaseTreeDataProvider
  <a id="sidebar"></a>
  
  * providerLabel => 用於註冊在package.json

    ```typescript
    // package.json

    "views": {
        "activitybarId": [
            {
            "id": "${providerLabel}",
            "name": "name",
            }
        ]
    }
    ```

    ```typescript

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

    ```

  * SideBarScriptType
    * terminal => [default] run script in terminal
    * command => [default] run script in child_process
    * browser => open url in browser
    * customer => handle by customer
    ```typescript
    export enum ScriptsType {
        terminal = 'terminal',
        command = 'command',
        browser = 'browser',
        customer = 'customer'
    }
    ```
  * Define SideBarScript sample

    ```typescript
    const gitScripts = [

        {
            scriptsType: ScriptsType.terminal,
            label: "git push",
            script: 'git push',
        },
        {
            scriptsType: ScriptsType.terminal,
            label: "git status",
            script: 'git status',
        }
    ]
    ```

* Implement sample 

  ```
    //Implement
    
    root/packages/lazy_jack_flutter_flavor_magic/src/sidebar/firebase.ts

    //register in vscode
    
    packages/lazy_jack_flutter_flavor_magic/src/extension.ts

  ``` 
