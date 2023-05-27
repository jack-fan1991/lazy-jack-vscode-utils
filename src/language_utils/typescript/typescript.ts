import { getYAMLFileContent } from "../../vscode_utils/editor_utils";
import { getWorkspacePath } from "../../vscode_utils/vscode_env_utils";


const PACKAGEJson = "package.json";


export function getPackageJsonPath(): string | undefined {
  return getWorkspacePath(PACKAGEJson);
}

export async function getPackageJsonAsMap(): Promise<Record<string, any> | undefined> {
    const packageJson = getPackageJsonPath();
    return getYAMLFileContent(packageJson);
  }
