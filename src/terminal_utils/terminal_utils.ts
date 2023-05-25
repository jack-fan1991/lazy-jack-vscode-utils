import * as vscode from 'vscode';
import * as child_process from "child_process";
import * as iconv from 'iconv-lite';
import * as vscode_env_utils from '../vscode_utils/vscode_env_utils';
import { logError } from '../logger/logger';

export type TerminalCommand = {
    windows: string;
    mac: string;
  };

export function runTerminal(cmd: string, terminalName: string = '',enter:boolean=false) {
    vscode.window.showInformationMessage('正在執行' + cmd + ' 命令...');
    const terminal = vscode.window.activeTerminal;
    if (!terminal?.name.startsWith('Lazy_Jack')) {
        const newTerminal = vscode.window.createTerminal('Lazy_Jack');
        newTerminal.show();
        newTerminal.sendText(cmd);
        if(enter){
            newTerminal.sendText('\r');
        }
        return;
    }
    else if (terminalName != '' && terminal.name != terminalName) {
        const newTerminal = vscode.window.createTerminal(`Lazy_Jack ${terminalName}`);
        newTerminal.show();
        newTerminal.sendText(cmd);
        if(enter){
            newTerminal.sendText('\r');
        }
        return;
    }
    terminal.show();
    terminal.sendText(cmd);
    if(enter){
        terminal.sendText('\r');
    }

}

export function runCommand(command: string, onDone?: (stdout: string) => void, onError?: (stdout: string) => void, cmdOnRoot = true,forceCmd:boolean=false): Promise<string> {
    const cwd = vscode_env_utils.getRootPath();
    if(cmdOnRoot && cwd==null){
        logError('No active workspace folder was found.')
    }
    if (cmdOnRoot) {
        if (vscode_env_utils.isWindows()) {
            command = "cd " + cwd + ` ;  ${command}`
        } else {
            command = "cd " + cwd + ` &&  ${command}`
        }
    }
    if (vscode_env_utils.isWindows()&&!forceCmd) {
        return runPowerShellCommand(command, onDone, onError)
    }
    return new Promise((resolve, reject) => {
        child_process.exec(command, (error, stdout, stderr) => {
            console.log(`${stderr}`);
            if (onDone != null) {
                onDone(stdout)
            }
            if (error) {
                if (onError != null) {
                    onError(error.message)
                }
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

export function runPowerShellCommand(command: string, onDone?: (stdout: string) => void, onError?: (stdout: string) => void,): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const powershell = child_process.spawn('powershell.exe', [command]);

        let stdout = '';
        let stderr = '';

        powershell.stdout.on('data', (data) => {
            stdout += iconv.decode(data, 'cp936');
            if (onDone != null) {
                onDone(stdout)
            }
        });

        powershell.stderr.on('data', (data) => {
            stderr += iconv.decode(data, 'cp936');
            if (onError != null) {
                onError(stderr)
            }
        });

        powershell.on('close', (code) => {
            if (code !== 0) {
                if (onError != null) {
                    onError(stderr)
                }
                reject(new Error(`PowerShell command failed with code ${code}: ${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}