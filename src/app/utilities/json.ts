import * as fs from 'fs';

export function loadJSONFromFile(filename: string): any {
    const data = fs.readFileSync(filename, 'utf8');
    return JSON.parse(data);
}
