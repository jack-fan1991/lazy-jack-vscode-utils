import * as vscode from 'vscode';
import * as path from 'path';
import { checkDirInEvn, isWindows, removeDirInEvn } from '../../../vscode_utils/vscode_env_utils';
import { replaceInPubspecFile } from './pubspec_utils';
import { logError, logInfo } from '../../../logger/logger';
import { openEditor, readFileToText } from '../../../vscode_utils/editor_utils';
import { runFlutterPubGet } from '../../../common/lazy_common';
import { DependenciesInfo, OverrideDependenciesInfo } from './analyze_dart_git_dependency';
import { runCommand } from '../../../terminal_utils/terminal_utils';
import { showPicker } from '../../../vscode_utils/vscode_utils';


export async function updateGitSubModule(context: vscode.ExtensionContext) {
    const files = await vscode.workspace.findFiles(".gitmodules");
    if (files.length > 0) {
        let text = readFileToText(files[0].fsPath)
        vscode.window.showInformationMessage(`update submodules =>${text}`, '確定', '取消').then((option) => {
            if (option === '確定') {
                runCommand(`git submodule update --init --recursive`).then((result) => {
                    if (result!= '') {
                        vscode.window.showInformationMessage(`update submodules success`);
                    }else{
                        vscode.window.showInformationMessage(`submodules is up to date`);
                    }
                },);
            }
        });
    }



}

