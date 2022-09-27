import { arrayUnique } from './utils.js';

/**
 * dim: [30-37], 
 * bright: [90-97], xterm-255
 * @param {int} color 
 */
export function color_string(string, color) {
    return '\u001b[38;5;' + color + 'm' + string + '\u001b[0m';
}

export class Tester {

    constructor() {
        this.results = {}
        this.options = {
            passed: false,
            failed: true
        };
        this.currGroup = 'Tests';
        this.run = [];
    }

    init(options) {
        this.options = {
            passed: options['passed'],
            failed: options['failed']
        };
        this.run = options['run'];
    }

    group(desc) {
        this.currGroup = desc;
        this.results[desc] = {
            pass: [],
            fail: []
        }
    }

    doRun(group) {
        return this.run.includes(group) || this.run.length === 0;
    }

    test(bool, success, fail) {
        if (this.doRun(this.currGroup)) {
            if (bool) {
                this.results[this.currGroup].pass.push(`  ${color_string('✔', 10)} ${color_string(success, 16)}`);
            } else {
                this.results[this.currGroup].fail.push(`  ${color_string('✘', 9)} ${color_string(fail, 196)}`);
            }
        }
    }

    log() {

        //Print te results
        console.log(color_string('\nTesting...\n', 160));

        let total = { pass: 0, fail: 0 };
        for (const key in this.results) {
            if (this.run.includes(key) || this.run.length === 0) {
                console.log(color_string(key, 63));
                console.log(color_string(`  Passed: ${this.results[key].pass.length}`, this.results[key].fail.length === 0 ? 46 : 124));
                console.log(color_string(`  Failed: ${this.results[key].fail.length}`, this.results[key].fail.length === 0 ? 46 : 124));
                total.pass += this.results[key].pass.length;
                total.fail += this.results[key].fail.length;
                if (this.options.failed) {
                    this.results[key].fail.forEach(s => {
                        console.log(s);
                    });
                }
                if (this.options.passed) {
                    this.results[key].pass.forEach(s => {
                        console.log(s);
                    });
                }
                console.log('')
            }
        }

        console.log(color_string(`Total Passed: ${total.pass}`, total.fail === 0 ? 46 : 124));
        console.log(color_string(`Total Failed: ${total.fail}`, total.fail === 0 ? 46 : 124));
        if (total.fail === 0) {
            console.log(color_string('All tests passed!', 10));
        }
        console.log(color_string('\nTesting Complete!\n', 160));

    }

}