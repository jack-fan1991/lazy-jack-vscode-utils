export * as logger from './logger/logger';
export * as sidebar from './vscode_feature/sidebar/sidebar';
export * as terminal_utils from './terminal_utils/terminal_utils';
export * as vscode_utils from './vscode_utils/vscode_utils';
export * as language_utils from './language_utils/language_utils';
export * as regex_utils from './regex/regex_utils';
export * as lazy_common from './common/lazy_common';


export function showMessage(msg:number): void {
  console.log(`Hello worldasdasdasdd!\n${msg}`);   
}

export function showMessage2(msg:number): void {
  console.log(`>>\n${msg}`);   
}


export function showMessage3(msg:number): void {
  console.log(`33333333>>\n${msg}`);   
}
