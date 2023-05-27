import * as fs from 'fs';
import { logError, logInfo } from "../../../logger/logger";
import { getWorkspacePath } from "../../../vscode_utils/vscode_env_utils";
import { getYAMLFileContent, openEditor, readFileToText, replaceText } from "../../../vscode_utils/editor_utils";
import * as vscode from 'vscode';


const PUBSPEC_FILE_NAME = "pubspec.yaml";
const PUBSPEC_LOCK_FILE_NAME = "pubspec.lock";

export function isFlutterProject (){
  return  getPubspecPath()!= null
}

export function getPubspecPath(): string | undefined {
  return getWorkspacePath(PUBSPEC_FILE_NAME);
}

export function getPubspecLockPath(): string | undefined {
  return getWorkspacePath(PUBSPEC_LOCK_FILE_NAME);
}


export async function getPubspecAsMap(): Promise<Record<string, any> | undefined> {
    const pubspecPath = getPubspecPath();
    return getYAMLFileContent(pubspecPath);
  }

  export  function getPubspecAsText(): string {
    const pubspecPath = getPubspecPath();
    return getYAMLFileText(pubspecPath??'');
  }
  
  
  export async function getPubspecLockAsMap(): Promise<Record<string, any> | undefined> {
    const pubspecLockPath = getPubspecLockPath();
    return getYAMLFileContent(pubspecLockPath);
  }
  

  
export function getYAMLFileText(path: string ){
 return readFileToText(path)
}

export async function replaceInPubspecFile( searchValue: string, replaceValue: string): Promise<boolean> {
  const pubspecPath = getPubspecPath();
  return await replaceText(pubspecPath!,searchValue,replaceValue)
}

export async function openYamlEditor(): Promise<vscode.TextEditor> {
  let editor= await  openEditor( getPubspecPath()!)
  if (editor==undefined) throw new Error("openYamlEditor failed")
  return editor
}


export function getPubspecDependencyOverridePath(dependencyName: string, text: string | undefined = undefined): string | undefined {
  {
    const regex = new RegExp(`${dependencyName}:\\s*\\n\\s*#\\s*path:\\s*(.*)`);
    const regex2 = new RegExp(`#${dependencyName}:\\s*#\\s*path:\\s*(.*)`);

    let t = readFileToText(getPubspecPath()!)
    if (text !== undefined) {
      t = text
    }
    const match = t.match(regex);
    if (match) {
      const path = match[1];
      return path;
    } else {
      return undefined;
    }
  }
}