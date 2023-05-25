import * as vscode from 'vscode';
import * as path from 'path';
import { checkDirInEvn, isWindows, removeDirInEvn } from '../../../vscode_utils/vscode_env_utils';
import { replaceInPubspecFile } from './pubspec_utils';
import { logError, logInfo } from '../../../logger/logger';
import { openEditor } from '../../../vscode_utils/editor_utils';
import { runFlutterPubGet } from '../../../common/lazy_common';
import { DependenciesInfo, OverrideDependenciesInfo } from './analyze_dart_git_dependency';

export const extension_updateDependencyVersion = "extension.updateDependencyVersion"

export function registerUpdateDependencyVersion(context: vscode.ExtensionContext) {
    let fix = isWindows() ? '\r\n' : '\n'
    context.subscriptions.push(vscode.commands.registerCommand(extension_updateDependencyVersion, async (dependenciesInfo: DependenciesInfo, updateVersion: string, dependenciesOverrideInfo: OverrideDependenciesInfo) => {
        const searchValue = `${dependenciesInfo.name}:${fix}    git:${fix}      url: ${dependenciesInfo.uri}${fix}      ref: ${dependenciesInfo.branch}${fix}`;
        const replaceValue = `${dependenciesInfo.name}:${fix}    git:${fix}      url: ${dependenciesInfo.uri}${fix}      ref: ${updateVersion}${fix}`;
        const yamlPath = path.join(vscode.workspace.rootPath ?? '', 'pubspec.yaml');

        // 修改yaml 中的 version
        const replace = await replaceInPubspecFile(searchValue, replaceValue);
        if (!replace) {
            return;
        }

        // 刪除local ..pub-cache/test
        const delPubCachePath = '.pub-cache/git';
        checkDirInEvn(() => {
            logInfo(`Start delete ${delPubCachePath}`)
            removeDirInEvn(
                async () => {
                    logInfo(`Clean done ${delPubCachePath}`)
                    const textEditor = await openEditor(yamlPath, true);
                    logInfo(`Change ${dependenciesInfo.name} ${dependenciesInfo.branch} => ${updateVersion}`)
                    if (dependenciesOverrideInfo.isActivate()) {
                        await replaceInPubspecFile(dependenciesOverrideInfo.commentString(), dependenciesOverrideInfo.unCommentString());
                        logInfo(`${dependenciesInfo.name} remove local override`)
                    }
                    runFlutterPubGet()
                },
                delPubCachePath
            );
        }, () => {
            logError(`找不到${delPubCachePath}`)
        }, delPubCachePath);
    }))
}

