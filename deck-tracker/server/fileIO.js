import { readFile, writeFile } from 'fs/promises';

/**
 * 
 * @returns 
 */
export async function _read(file) {
    try {
        return await readFile(file, 'utf8');
    } catch (error) {
        return `${error}`;
    }
}

// This is a private methods. The # prefix means that they are private.
export async function _write(data, file) {
    await writeFile(file, data, 'utf8');
}