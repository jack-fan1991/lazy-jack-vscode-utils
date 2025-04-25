import * as vscode from 'vscode';
import { openEditor, readFileToText } from '../../../vscode_utils/editor_utils';
import { runCommand } from '../../../terminal_utils/terminal_utils';


export async function updateGitSubModule(context: vscode.ExtensionContext) {
    const files = await vscode.workspace.findFiles(".gitmodules");
    // test
    if (files.length > 0) {
        let text = readFileToText(files[0].fsPath)
        vscode.window.showInformationMessage(`update submodules =>${text}`, 'Confirm', 'Cancel').then((option) => {
            if (option === 'Confirm') {
                // vscode.window.showInformationMessage(`git submodule update --remote => update loading`);
                // runCommand(`git submodule update --init --recursive`).then((result) => {
                //     runCommand(`git submodule foreach git pull origin main`).then((result) => {
                //         vscode.window.showInformationMessage(`${result}`);
                //     })
                // },);

                vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Window,
                        title: '🔄 Updating Git Submodules...',
                        cancellable: false
                    },
                    async () => {
                        try {
                            // 把 submodule init 完整
                            await runCommand(`git submodule update --init --recursive`);
                    
                            // 拉每個 submodule 的最新 main
                            await runCommand(`git submodule foreach 'git checkout main && git pull origin main'`);
                    
                            // 把主專案的 submodule commit pointer 加入 staging
                            await runCommand(`git add .`);
                    
                            // 自動 commit（可選）
                            await runCommand(`git commit -m "🛠 chore: update submodules to latest commit"`);
                    
                            vscode.window.showInformationMessage(`✅ Submodules updated and committed.`);
                          } catch (e) {
                            vscode.window.showErrorMessage(`❌ Submodule force update failed: ${e}`);
                          }
                    }
                );

            }
        });
    }



}

