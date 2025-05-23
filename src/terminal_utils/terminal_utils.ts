import * as vscode from 'vscode';
import * as child_process from "child_process";
import * as iconv from 'iconv-lite';
import * as vscode_env_utils from '../vscode_utils/vscode_env_utils';
import { logError } from '../logger/logger';

export type TerminalCommand = {
    windows: string;
    mac: string;
  };

function findTerminalAndActivate(name:string):vscode.Terminal{
    const terminal = vscode.window.terminals.find(t=>t.name == name);
    if(terminal){
        terminal.show();
        return terminal;
    }
    else{
        const newTerminal = vscode.window.createTerminal(name);
        newTerminal.show();
        return newTerminal;
    }
}

export function runTerminal(cmd: string, terminalName: string = "",enter:boolean=false):vscode.Terminal {
    vscode.window.showInformationMessage('Run ' + cmd + '');
    terminalName = 'Lazy Jack '+terminalName
   let  terminal = findTerminalAndActivate(terminalName)
    terminal.sendText(cmd);
    if(enter){
        terminal.sendText('\r');
    }
    return terminal;
}
export function runCommand(
    command: string,
    cwdPath: string | undefined = undefined,
    forceCmd: boolean = false
): Promise<string> {
    const cwd = vscode_env_utils.getRootPath();

    if (cwd === null || cwd === undefined) {
        logError('No active workspace folder was found.');
        return Promise.reject('No active workspace folder was found.');
    }

    if (cwd) {
        if (vscode_env_utils.isWindows()) {
            command = `cd "${cwd}" ; ${command}`;
        } else {
            command = `cd "${cwd}" && ${command}`;
        }
    }

    if (vscode_env_utils.isWindows() && !forceCmd) {
        return runPowerShellCommand(command);
    }

    return new Promise((resolve, reject) => {
        child_process.exec(command, {
            env: {
                ...process.env,
                GITHUB_TOKEN: undefined 
            }
        }, (error, stdout, stderr) => {
            if (stderr) {
                console.error(stderr);
            }
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}





export function runPowerShellCommand(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const powershell = child_process.spawn('powershell.exe', [command]);

        let stdout = '';
        let stderr = '';

        powershell.stdout.on('data', (data) => {
            stdout += iconv.decode(data, 'cp936');
        });

        powershell.stderr.on('data', (data) => {
            stderr += iconv.decode(data, 'cp936');
    
        });

        powershell.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`PowerShell command failed with code ${code}: ${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}