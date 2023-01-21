//@ts-check

/**
 * file: lib.mjs
 * repo: github.com/eduvf/joc
 *
 * function library for the JavaScript joc interpreter
 */

//--------------------------------------------------------------

/**
 * returns an environment with the standard joc library, as well
 * as some other tools for math, audio and graphics
 * @param {Function} interpret
 * @param {Function} log
 * @returns {Array.<Object>}
 */
export function lib(interpret, log) {
    function op(fn) {
        return (arg, env, line) => {
            arg = arg.map((a) => interpret(a, env));
            let type = typeof arg.at(0);
            return arg.reduce((prev, curr) => {
                if (typeof curr !== type) log(`[*] Type mismatch at line ${line}`);
                return fn(prev, curr);
            });
        };
    }

    const std = {
        // (arg, env, line) => {},

        // print
        ';': (arg, env, line) => {
            arg = arg.map((a) => interpret(a, env));
            arg.map(log);
            return arg;
        },
        // let
        ':': (arg, env, line) => {
            let r = undefined;
            while (arg.length > 0) {
                let name = arg.shift();
                let value = arg.shift();
                if (name.type === 'word') {
                    r = value ? interpret(value, env) : undefined;
                    env[env.length - 1][name.value] = r;
                    continue;
                }
                log(`[*] Invalid name for assignment at line ${line}`);
            }
            return r;
        },
        // set
        '.': (arg, env, line) => {
            let r = undefined;
            while (arg.length > 0) {
                let name = arg.shift();
                let value = arg.shift();
                if (name.type === 'word' && name.value.charAt(0) !== '_') {
                    r = value ? interpret(value, env) : undefined;
                    for (let i = env.length - 1; i >= 0; i--) {
                        if (name.value in env[i]) {
                            env[i][name.value] = r;
                            break;
                        }
                    }
                    continue;
                }
                log(`[*] Invalid name for assignment at line ${line}`);
            }
            return r;
        },
        // add
        '+': op((x, y) => x + y),
        // mul
        '*': op((x, y) => x * y),
        // random
        '??': (arg, env, line) => {
            if (arg.length === 0) return Math.random();
            return interpret(arg[Math.floor(Math.random() * arg.length)], env);
        },
        // reshape
        '<>': (arg, env, line) => {
            let axis = [];
            while (arg.length > 1) {
                let n = interpret(arg.shift(), env);
                if (typeof n !== 'number' || n < 0) {
                    log(`[!] <> requires numbers >= 0 as arguments before the table`);
                    return [];
                }
                axis.push(n);
            }
            let tab = Array(axis.reduce((p, c) => p * c))
                .fill(0)
                .map(() => interpret(arg[0], env));
            for (let n of axis) {
                let temp = [];
                while (tab.length > 0) {
                    temp.push(tab.splice(0, n));
                }
                tab = temp;
            }
            return tab;
        },
    };
    return [std];
}
