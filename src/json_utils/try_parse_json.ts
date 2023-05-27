import { logError } from "../logger/logger";

export function tryParseJson(text: string): any {
    try {
        return JSON.parse(text);
    } catch (_) {
        logError(`JSON parse error`,true);
        throw _;
    }
}