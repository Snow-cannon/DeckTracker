/**
 * dim: [30-37], 
 * bright: [90-97], xterm-255
 * @param {int} color 
 */
export function color_string(string, color) {
    return '\u001b[38;5;' + color + 'm' + string + '\u001b[0m';
}

export function test(bool, desc) {
    console.log(`  ${bool ? color_string('✔', 10) : color_string('✘', 9)} ${bool ? color_string(desc, 16) : color_string(desc, 196)} `);
}

export function groupTitle(title){
    console.log(color_string(title, 39));
}