import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getPubspecAsMap } from './dart/pubspec/pubspec_utils';
import { getRootPath } from '../vscode_utils/vscode_env_utils';
import { readFileToText } from '../vscode_utils/editor_utils';
import { logError } from '../logger/logger';
export * as analyze_dart_git_dependency from './dart/pubspec/analyze_dart_git_dependency';
export * as pubspec_utils from './dart/pubspec/pubspec_utils';
export * as update_git_dependency from './dart/pubspec/update_git_dependency';





export function activeEditorIsDart() {
    return isActiveEditorLanguage('dart');
}

export function isActiveEditorLanguage(languageId: string) {
    return vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === languageId;
}

export async function onDart(onYamlParse: (pubspec: any) => any, onError: () => any, parseYaml: boolean = false) {
    if (vscode.workspace.rootPath == undefined) {
        return
    }

    let filePath = '**/pubspec.yaml';
    let yaml;
    const files = await vscode.workspace.findFiles(filePath);
    if (files.length <= 0) {
        logError('當前不是flutter 專案');
        return onError()
    }
    if (parseYaml) {
        yaml = await getPubspecAsMap()
        if (yaml == undefined) {
            logError('onDart yaml is undefined')
            logError(`project => ${getRootPath()}`)
            logError(`file => ${filePath}`)
        }
    }
    return onYamlParse(yaml)
}

  
  export async function onGit(getData: () => any[], errorData: () => any[]) {
    let workspace = getRootPath()
    if (fs.existsSync(`${workspace}/.git`)) {
      return getData()
    }
  }


export async function onTypeScript(getData: (data: any) => any, errorData: () => any, returnData: boolean = false) {
    if (vscode.workspace.rootPath == undefined) {
      return
    }
    let absPath = path.join(vscode.workspace.rootPath, 'package.json');
    let filePath = '**/package.json';
    let data;
    const files = await vscode.workspace.findFiles(filePath);
    if (files.length <= 0) {
      console.log('當前不是TypeScript 專案');
      return errorData()
    }
    if (returnData) {
      data = readFileToText(absPath)
      if(data   == undefined){
        logError('onTypeScript data is undefined')
        logError(`project => ${getRootPath()}`)
        logError(`file => ${absPath}`)
      }
    }
    return getData(data)
  
  }