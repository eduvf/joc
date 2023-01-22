//@ts-check

/**
 * file: std.mjs
 * repo: github.com/eduvf/joc
 *
 * standard functions
 */

//--------------------------------------------------------------

/**
 * @param {Function} interpret
 * @param {Function} log
 * @returns {Object}
 */
export function std(interpret, log) {
    const pairs = (fn) => (arg, env, line) => {
        let r = undefined;
        for (let i = 0; i < arg.length; i += 2) {
            let pair = { k: arg.at(i), v: arg.at(i + 1) };
            if (pair.k.type === 'word') {
                r = pair.v ? interpret(pair.v, env) : undefined;
                fn(pair.k.value, r, env, line);
                continue;
            }
            log(`[*] Invalid name for assignment at line ${line}`);
        }
        return r;
    };

    const op = (bin, un) => (arg, env, line) => {
        arg = arg.map((a) => interpret(a, env));
        if (arg.length === 1) {
            if (!Array.isArray(arg[0])) return un(arg[0]);
            arg = arg[0];
        }
        let type = typeof arg.at(0);
        return arg.reduce((p, c) => {
            if (typeof c !== type) log(`[*] Type mismatch at line ${line}`);
            return bin(p, c);
        });
    };

    const compare = (bin) => (arg, env, line) => {
        let p = arg.at(0) ? interpret(arg[0], env) : null;
        let r = p ? 1 : 0;
        for (let c of arg.slice(1)) {
            c = interpret(c, env);
            r = bin(p, c) ? 1 : 0;
            p = c;
            if (r === 0) break;
        }
        return r;
    };

    const std = {
        // print
        ';': (arg, env, line) => {
            arg = arg.map((a) => interpret(a, env));
            arg.map(log);
            return arg.at(-1);
        },
        // let
        ':': pairs((name, value, env, line) => {
            env[env.length - 1][name] = value;
        }),
        // set
        '.': pairs((name, value, env, line) => {
            if (name.charAt(0) !== '_')
                for (let i = env.length - 1; i >= 0; i--)
                    if (name in env[i]) {
                        env[i][name] = value;
                        return;
                    }
            log(`[!] Words starting with '_' can't be modified (line ${line})`);
        }),
        // fn
        '~': (arg, env, line) => {
            let parm = arg.slice(0, -1).map((p) => {
                if (p.type !== 'word') log(`[*] Bad parameter name for '~' at line ${line}`);
                return p.value;
            });
            let body = arg.at(-1);
            return (fnParm, fnEnv) => {
                fnEnv.push({});
                parm.forEach((p, i) => {
                    fnEnv[fnEnv.length - 1][p] = interpret(fnParm.at(i), fnEnv);
                });
                let r = interpret(body, fnEnv);
                fnEnv.pop();
                return r;
            };
        },
        // if
        '?': (arg, env, line) => {
            // (? cond then cond then ...)
            for (let i = 0; i < arg.length; i += 2) {
                const cond = interpret(arg[i], env);
                if (cond) return i + 1 < arg.length ? interpret(arg[i + 1], env) : cond;
            }
            return undefined;
        },
        // loop
        '@': (arg, env, line) => {
            // TODO
        },
        // add
        '+': op((x, y) => x + y),
        // mul
        '*': op((x, y) => x * y),
        // sub
        '-': op(
            (x, y) => x - y,
            (x) => -x
        ),
        // div
        '/': op((x, y) => x / y),
        // mod
        '%': op((x, y) => x % y),
        // not
        // and
        // or
        // eq
        '=': compare((x, y) => x === y),
        // lt
        '<': compare((x, y) => x < y),
        // gt
        '>': compare((x, y) => x > y),
        // neq
        '!=': compare((x, y) => x !== y),
        // lte
        '<=': compare((x, y) => x <= y),
        // gte
        '>=': compare((x, y) => x >= y),
        // random
        '??': (arg, env, line) => {
            if (arg.length === 0) return Math.random();
            return interpret(arg[Math.floor(Math.random() * arg.length)], env);
        },
    };
    return std;
}
