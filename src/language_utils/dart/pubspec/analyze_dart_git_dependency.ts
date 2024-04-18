import { logInfo } from "../../../logger/logger";
import { TerminalCommand, runCommand, runTerminal } from "../../../terminal_utils/terminal_utils";
import { getActivateText, saveActivateEditor } from "../../../vscode_utils/activate_editor_utils";
import { isWindows } from "../../../vscode_utils/vscode_env_utils";
import { onDart } from "../../language_utils";
import { getPubspecAsText, getPubspecDependencyOverridePath, getPubspecLockAsMap, getPubspecLockAsText, getPubspecPath, openYamlEditor, replaceInPubspecFile, replaceInPubspecLockFile } from "./pubspec_utils";
import * as vscode from 'vscode';
import { extension_updateDependencyVersion } from "./update_git_dependency";
import { showPicker, sleep } from "../../../vscode_utils/vscode_utils";
import { List } from "lodash";
export class DependenciesInfo {
    name: string;
    uri: string;
    branch: string;
    hide: Array<string>;
    constructor(name: string, uri: string, branch: string, hide: Array<string>) {
        this.name = name;
        this.uri = uri;
        this.branch = branch;
        this.hide = hide;

    }
}

export class OverrideDependenciesInfo {
    name: string;
    path: string;
    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }

    commentString(): string {
        return `${this.name}:\n    path: ${this.path}`
    }

    unCommentString(): string {
        return `# ${this.name}:\n  #   path: ${this.path}`
    }

    isActivate(): boolean {
        return getPubspecAsText().indexOf(this.unCommentString()) == -1
    }
    isDeactivate(): boolean {
        return !this.isActivate()
    }
}


let gitExtensions: DependenciesInfo[] = [];
let gitDependenciesOverrides: OverrideDependenciesInfo[] = [];
let gitDependenciesPickerList: { label: string; description: string; url: string; }[] = []
let versionPickerCache = new Map<string, any>()
let isFirstOpen = true
let pubspecLock: any
let pubspec: any


export async function checkGitExtensionInYamlIfDart(showUpdate: boolean = false): Promise<any> {
    gitExtensions = []
    gitDependenciesOverrides = []
    gitDependenciesPickerList = []
    pubspecLock = await getPubspecLockAsMap()
    return await onDart(async (pubspecData) => {
        pubspec = pubspecData
        if (pubspecData == undefined) return undefined
        let gitDependencies = pubspecData['dependencies']
        let dependencyOverrides = pubspecData['dependency_overrides']
        if (dependencyOverrides != undefined) {
            gitDependenciesOverrides = convertToOverrideDependenciesInfo(dependencyOverrides)
        }
        gitDependenciesOverrides = [...gitDependenciesOverrides, ...parseIfOverrideMark()]
        if (gitDependencies != undefined) {
            gitExtensions = convertToDependenciesInfo(gitDependencies)
            await convertDependenciesToPickerItems(pubspecData, gitExtensions, showUpdate)
        }
        return pubspecData
    }, () => undefined, true)

}



async function convertDependenciesToPickerItems(pubspecData: any, gitDependencies: DependenciesInfo[], showUpdate: boolean = false) {
    let versionPickerList: { label: string; description: string; url: string; }[] = []
    for (let dependenciesInfo of gitDependencies) {
        versionPickerList = []
        const gitCommand: TerminalCommand = {
            windows: `git ls-remote --heads --sort=-v:refname '${dependenciesInfo.uri}' | ForEach-Object { $_.Split()[1] } `,
            mac: `git ls-remote --heads  --sort=-v:refname '${dependenciesInfo.uri}' | awk '{print $2}' `,
        };
        let allBranch = await runCommand(isWindows() ? gitCommand.windows : gitCommand.mac)
        let currentVersion = pubspecData['dependencies'][dependenciesInfo.name]['git']['ref']
        // get all branch from git
        let branchList = allBranch.split('\n').filter((x) => x != "");
        let showBranch = []
        let onlyVersionRepo = true
        for (let branch of branchList) {
            branch = branch.replace('refs/heads/', '').replace(/\r/g, '')
            let hideList = dependenciesInfo.hide
            if (hideList.includes(branch)) {
                continue
            }
            versionPickerList.push({ label: `${branch}`, description: `current version => ${currentVersion} `, url: dependenciesInfo.uri });
            showBranch.push(branch)
            //檢查字串有幾個.
            if (onlyVersionRepo) {
                const matches: RegExpMatchArray | null = branch.match(/\./g);
                let total = matches ? matches.length : 0;
                if (total < 2) {
                    onlyVersionRepo = false;
                }
            }
        }
        let lastVersion = versionPickerList[0].label
        if (onlyVersionRepo && showUpdate) {
            await showUpdateIfNotMatch(dependenciesInfo, lastVersion)
        } else {
            checkCommitHashInYamlIfDart(dependenciesInfo)
        }
        versionPickerCache.set(dependenciesInfo.name, versionPickerList)
        // Add git dependency to picker list 
        gitDependenciesPickerList.push({ label: dependenciesInfo.name, description: `current version => ${currentVersion} `, url: dependenciesInfo.uri });
        versionPickerCache.set(dependenciesInfo.name, versionPickerList)
    }
}

async function showUpdateIfNotMatch(dependenciesInfo: DependenciesInfo, latestVersion: string) {
    if (dependenciesInfo.branch == latestVersion) return
    let dependencyOverride = gitDependenciesOverrides.filter((x) => x.name.includes(dependenciesInfo.name))[0];
    let overrideActivate = dependencyOverride == undefined ? false : dependencyOverride.isActivate()
    let localPathInfo = overrideActivate ? `Project using override path「 ${dependencyOverride.path} 」 ` : ""    // show update or use locale
    vscode.window.showInformationMessage(`[ New Version ${latestVersion}] ${dependenciesInfo.name} : In Project from ${dependenciesInfo.branch}=>${latestVersion},  ${localPathInfo} `, 'Update', !overrideActivate ? 'Debug Local' : "").then(async (selectedOption) => {
        if (selectedOption === 'Debug Local') {
            if (!overrideActivate) {
                if (dependencyOverride == undefined) {
                    await vscode.window.showInputBox({ prompt: `Please input ${dependenciesInfo.name} local path`, value: `../${dependenciesInfo.name}` }).then(async (localPath) => {
                        if (localPath == undefined) return
                        dependencyOverride = new OverrideDependenciesInfo(dependenciesInfo.name, localPath!)
                        let editor = await openYamlEditor()
                        let text = getActivateText()
                        let assertLineAt = text.split('\n').indexOf('assets:') - 1
                        editor.edit((editBuilder) => {
                            editBuilder.insert(new vscode.Position(assertLineAt, 0), `\ndependency_overrides:\n  ${dependencyOverride.commentString()}\n`)
                        })
                        logInfo(`Activate ${dependencyOverride.name} local override ${dependencyOverride.path}`)

                    }
                    )
                } else {
                    await replaceInPubspecFile(dependencyOverride.unCommentString(), dependencyOverride.commentString());
                    logInfo(`Activate ${dependencyOverride.name} local override ${dependencyOverride.path}`)
                }
            }

        } else if (selectedOption === 'Update') {
            await vscode.commands.executeCommand(extension_updateDependencyVersion, dependenciesInfo, latestVersion, dependencyOverride);
        }
        saveActivateEditor()

    });
}

function convertToDependenciesInfo(data: any): DependenciesInfo[] {
    let gitExtensions: DependenciesInfo[] = [];
    let keys = Object.keys(data)
    for (let key of keys) {
        let extension = data[key]
        if (extension == undefined) {
            continue
        }
        let gitInfo = extension['git']
        if (gitInfo != undefined) {
            let hide: Array<string> = []
            if (gitInfo['skipBranch'] != undefined) {
                if (typeof gitInfo['skipBranch'] === 'string') {
                    hide.push(gitInfo['skipBranch'])
                } else {
                    for (let b of gitInfo['skipBranch']) {
                        hide.push(b)
                    }
                }
            }
            gitExtensions.push(new DependenciesInfo(key, gitInfo['url'], gitInfo['ref'], hide))
        }
    }
    return gitExtensions;
}
function convertToOverrideDependenciesInfo(data: any): OverrideDependenciesInfo[] {
    let dependenciesOverrideInfo: OverrideDependenciesInfo[] = [];
    let keys = Object.keys(data)
    for (let key of keys) {
        let extension = data[key]
        if (extension != undefined && extension['path'] != undefined) {
            dependenciesOverrideInfo.push(new OverrideDependenciesInfo(key, extension['path']))
        }
    }
    return dependenciesOverrideInfo;
}

function parseIfOverrideMark(): OverrideDependenciesInfo[] {
    let dependenciesOverrideInfo: OverrideDependenciesInfo[] = [];
    let start = false
    let text = getPubspecAsText()
    let textLine = text.split('\n')
    textLine.forEach((line) => {
        let index = text.indexOf(line)
        if (!start && line.includes('dependency_overrides:')) {
            start = true
        }
        if (line.includes('flutter:')) {
            start = false
        }
        if (start && line.includes('#')) {
            let target = line + text[index + 1]
            let dependency = line.replace('#', '').replace(':', '').trim()
            let path = getPubspecDependencyOverridePath(dependency)
            if (path != undefined) {
                dependenciesOverrideInfo.push(new OverrideDependenciesInfo(dependency, path ?? ''))
            }
        }

    })

    return dependenciesOverrideInfo;
}


export async function selectUpdateDependency() {
    await checkGitExtensionInYamlIfDart()
    showPicker('Select dependencies', gitDependenciesPickerList, (item) => {
        let dependenciesInfo = gitExtensions.filter((x) => x.name == item.label)[0]
        let dependencyOverride = gitDependenciesOverrides.filter((x) => x.name.includes(dependenciesInfo.name))[0]
        let versionPickerList = versionPickerCache.get(item.label)
        if (dependencyOverride != null) {
            showOverrideDependencySwitcher(dependenciesInfo, dependencyOverride)
        }
        showPicker('Select version', versionPickerList, async (item) => {
            let version = item.label.replace(`${dependenciesInfo.name} => `, '')
            await vscode.commands.executeCommand(extension_updateDependencyVersion, dependenciesInfo, version, dependencyOverride), dependencyOverride
        })
    }
    )
}

// 這裡處理override 的切換
function showOverrideDependencySwitcher(dependenciesInfo: DependenciesInfo, dependenciesOverrideInfo: OverrideDependenciesInfo) {
    let msg = ''
    if (dependenciesOverrideInfo.isActivate()) {
        msg = `${dependenciesInfo.name} is using override path「 ${dependenciesOverrideInfo.path} 」 `
    } else {
        msg = `Switch ${dependenciesInfo.name} to override path「 ${dependenciesOverrideInfo.path} 」 `
    }
    vscode.window.showInformationMessage(` ${msg}`, dependenciesOverrideInfo.isActivate() ? 'comment override path' : 'Switch to override path').then(async (selectedOption) => {
        if (selectedOption === 'comment override path') {
            replaceInPubspecFile(dependenciesOverrideInfo.commentString(), dependenciesOverrideInfo.unCommentString())
            logInfo(`${dependenciesInfo.name} using remote branch ${dependenciesInfo.branch} now`)
        }
        if (selectedOption === 'Switch to override path') {
            replaceInPubspecFile(dependenciesOverrideInfo.unCommentString(), dependenciesOverrideInfo.commentString())
            logInfo(`${dependenciesInfo.name} using override path ${dependenciesOverrideInfo.path} now`)
        }


    })

}
async function checkCommitHashInYamlIfDart(dependenciesInfo: DependenciesInfo) {
    let libName = dependenciesInfo.name
    let lockInfo = pubspecLock['packages'][libName]
    let lockRef = lockInfo['description']['resolved-ref']
    const gitCommand: TerminalCommand = {
        windows: `git ls-remote '${dependenciesInfo.uri}' ${dependenciesInfo.branch} `,
        mac: `git ls-remote '${dependenciesInfo.uri}' ${dependenciesInfo.branch} `,
    };
    let remoteCommitHash = await runCommand(isWindows() ? gitCommand.windows : gitCommand.mac)
    const regex = /^([a-z0-9]{8})/;
    let remoteRefHash = remoteCommitHash.match(regex)![1]
    let localRefHash = lockRef.match(regex)![1]
    if (remoteRefHash != localRefHash) {
        vscode.window.showInformationMessage(`[ Update pubspec package : ${libName}]  : In Project from ${localRefHash}=>${remoteRefHash} `, 'Update').then(async (selectedOption) => {
            if (selectedOption === 'Update') {
                await updatePackage(libName,remoteCommitHash)
            }
        });
    }
}

async function updatePackage(packageName: string,remoteCommitHash:string) {
    let text = await getPubspecLockAsText()
    let line = text.split('\n')
    let packageString = []
    let unPackageString = []
    let start = false
    for (let l of line) {
        if (l.includes(packageName)) {
            start = true
        }
        // 計算空格數量
        const regex = /^\s+/;
        const match = l.match(regex);
        let total = 0
        if(match ==undefined){
            total =0
        }else{
            total =match[0].length
        }

        if (start) {
            packageString.push(l)
            unPackageString.push(`# ${l}`)
            let isPackageStart =(total ==2||total==0||l=='')
            if (isPackageStart&& !l.includes(packageName)) {
                packageString.pop()
                unPackageString.pop()
                break
            }
        }


    }
    let packageText = packageString.join('\n')
    let unPackageText = unPackageString.join('\n')
    await replaceInPubspecLockFile(packageText, "")
    await runTerminal('flutter pub get')

   
    logInfo(`${packageName} in last version : hash ${remoteCommitHash}`)





}