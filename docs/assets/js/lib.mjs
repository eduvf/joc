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
    const op = (fn) => (arg, env, line) => {
        arg = arg.map((a) => interpret(a, env));
        let type = typeof arg.at(0);
        return arg.reduce((prev, curr) => {
            if (typeof curr !== type) log(`[*] Type mismatch at line ${line}`);
            return fn(prev, curr);
        });
    };

    const shape = (fn) => (arg, env, line) => {
        let last = arg.at(-1);
        let axis = arg.slice(0, arg.length - 1).map((a) => {
            a = interpret(a, env);
            if (typeof a === 'number' || a >= 0) return a;
            log(`[!] Function at line ${line} requires numbers >= 0 as arguments before the table`);
            return 0;
        });
        return fn(axis, last, env);
    };

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
            for (let i = 0; i < arg.length; i += 2) {
                let name = arg.at(i);
                let value = arg.at(i + 1);
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
            for (let i = 0; i < arg.length; i += 2) {
                let name = arg.at(i);
                let value = arg.at(i + 1);
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
        // for map
        '@#': (arg, env, line) => {
            if (arg.length !== 2) {
                log(`[!] Function @# at line ${line} requires 2 arguments`);
                return [];
            }
            let tab = interpret(arg[0], env);
            let r = [];
            if (Array.isArray(tab))
                return tab.map((e) => {
                    env[env.length - 1]['^'] = e;
                    return interpret(arg[1], env);
                });
            log(`[!] First argument for function @# at line ${line} has to be a table`);
            return [];
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
        '<>': shape((axis, last, env) => {
            let tab = Array(axis.reduce((p, c) => p * c))
                .fill(0)
                .map(() => interpret(last, env));
            for (let n of axis) {
                let temp = [];
                while (tab.length > 0) {
                    temp.push(tab.splice(0, n));
                }
                tab = temp;
            }
            return tab[0];
        }),
        // reverse
        '<->': shape((axis, last, env) => {
            let tab = interpret(last, env);
            if (axis.length === 0) return tab.reverse();
            let r = [];
            for (let n of axis) {
                let temp = tab.slice(0);
                for (let i = n; i !== 0; i -= Math.sign(i)) {
                    i > 0 ? temp.unshift(temp.pop()) : temp.push(temp.shift());
                }
                r.push(temp);
            }
            return r;
        }),
        // reverse vertical
        '<|>': shape((axis, last, env) => {
            let tab = interpret(last, env);
            if (axis.length === 0) {
                for (let e of tab) e.reverse();
                return tab;
            }
            let r = [];
            for (let n of axis) {
                let temp = [];
                for (let e of tab) {
                    let tempE = e.slice(0);
                    for (let i = n; i !== 0; i -= Math.sign(i)) {
                        i > 0 ? tempE.unshift(tempE.pop()) : tempE.push(tempE.shift());
                    }
                    temp.push(tempE);
                }
                r.push(temp);
            }
            return r;
        }),
        // transpose
        '</>': (arg, env, line) => {
            let tab = interpret(arg.at(0), env);
            if (Array.isArray(tab)) {
                if (tab.length === 0) return [];
                let len = tab[0].length;
                if (!tab.every((e) => Array.isArray(e) && e.length === len))
                    log(`[*] Table for transposing isn't square, some elements will be added/removed (line ${line})`);
                return tab[0].map((_, col) => tab.map((row) => row[col]));
            }
        },
        // deep sum
        '<+>': shape((axis, last, env) => {
            let tab = interpret(last, env).flat(Infinity);
            for (let n of axis) {
                let temp = [];
                while (tab.length > 0) {
                    temp.push(tab.splice(0, n).reduce((p, c) => p + c));
                }
                tab = temp;
            }
            return tab;
        }),
    };
    return [std];
}
