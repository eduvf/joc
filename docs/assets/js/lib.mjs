// @ts-check

/**
 * @file core library
 * @author eduvf.github.io
 */

//--------------------------------------------------------------

/**
 * returns an object with all core functions for joc
 * @param {Function} interpret
 * @param {Function} log
 * @param {Function} format
 */
export default function lib(interpret, log, format) {
    const pairs = (fn) => (arg, env, line) => {
        let r;
        for (let i = 0; i < arg.length; i += 2) {
            const name = arg[i];
            if (name.type === 'key' || name.type === 'word') {
                let val = interpret(arg.at(i + 1), env);
                r = fn(name.value, val, env, line);
            } else {
                log(`[*] Invalid name for assignment (line ${line})`);
            }
        }
        return r;
    };

    const op = (sym, bin, un = (x) => x) => {
        return (arg, env, line) => {
            if (arg.length === 1) {
                if (Array.isArray(arg[0])) arg = arg[0];
                else return un(interpret(arg[0], env));
            }
            arg = arg.map((e) => interpret(e, env));
            return arg.reduce((p, c) => {
                if (typeof p !== typeof c) log(`[*] Type mismatch at function '${sym}' (line ${line})`);
                return bin(p, c);
            });
        };
    };

    const bool = (bin) => (arg, env, line) => {
        let prev = interpret(arg.at(0), env);
        let curr;
        let r = true;
        for (let i = 1; i < arg.length; i++) {
            r = bin(prev, (curr = interpret(arg[i], env)));
            if (!r) return 0;
            prev = curr;
        }
        return 1;
    };

    return {
        // print
        ';': (arg, env, line) => {
            arg = arg.map((e) => interpret(e, env));
            log(arg.map(format).join('\t'));
            return arg.at(-1);
        },

        // let
        ':': pairs((name, value, env, line) => {
            env[env.length - 1][name] = value;
            return value;
        }),
        // set
        '.': pairs((name, value, env, line) => {
            if (name.charAt(0) !== '_') {
                for (let i = env.length - 1; i >= 0; i--)
                    if (name in env[i]) {
                        let old = env[i][name];
                        env[i][name] = value;
                        return old;
                    }
                log(`[*] Couldn't modify '${name}' because it wasn't declared (line ${line})`);
            }
            log(`[!] Words starting with '_' can't be modified! (line ${line})`);
        }),

        // fn
        '~': (arg, env, line) => {
            for (let i = 0; i < arg.length - 1; i++)
                if (arg[i].type !== 'word') {
                    log(`[!] Expected word, got '${arg[i].type}' as function parameter (line ${line})`);
                    return;
                }
            const parm = arg.slice(0, -1).map((e) => e.value);
            const body = arg.at(-1);
            return (fnParm, fnEnv) => {
                fnEnv.push({}); // new scope
                // match parameters to arguments
                for (let i in parm) fnEnv[fnEnv.length - 1][parm[i]] = interpret(fnParm.at(i), fnEnv);
                // interpret body
                const r = interpret(body, fnEnv);
                fnEnv.pop(); // remove scope
                return r;
            };
        },

        // if
        '?': (arg, env, line) => {
            for (let i = 1; i < arg.length; i += 2) {
                if (interpret(arg[i - 1], env)) {
                    return interpret(arg[i], env);
                }
            }
            if (arg.length % 2 === 1) return interpret(arg.at(-1), env);
        },
        // loop
        '@': (arg, env, line) => {
            let r;
            if (arg.length === 1) {
                while ((r = interpret(arg[0], env))) {}
            } else if (arg.length === 2) {
                while (interpret(arg[0], env)) r = interpret(arg[1], env);
            } else if (2 < arg.length && arg.length < 5) {
                const coll = interpret(arg[0], env);
                if (typeof coll !== 'object') {
                    log(`[!] First argument in loop '@' with > 2 arguments has to be a table or map (line ${line})`);
                    return;
                }
                if (arg[1].type !== 'word') {
                    log(`[!] Expected word, got '${arg[1].type}' as index (2nd arg.) in loop '@' (line ${line})`);
                    return;
                }
                if (arg.length === 4 && arg[2].type !== 'word') {
                    log(`[!] Expected word, got '${arg[2].type}' as value (3rd arg.) in loop '@' (line ${line})`);
                    return;
                }
                const idx = arg[1].value;
                const val = arg.length === 4 ? arg[2].value : null;
                const body = (x) => {
                    env[env.length - 1]['^'] = r;
                    env[env.length - 1][idx] = x;
                    if (val) env[env.length - 1][val] = coll[x];
                    r = interpret(arg.at(-1), env);
                };
                env.push({}); // new scope
                if (Array.isArray(coll)) {
                    for (let i = 0; i < coll.length; i++) body(i);
                } else {
                    for (const k in coll) body(k);
                }
                env.pop(); // remove scope
            }
            return r;
        },

        // add
        '+': op('+', (x, y) => x + y),
        // sub
        '-': op(
            '-',
            (x, y) => x - y,
            (x) => -x
        ),
        // mul
        '*': op('*', (x, y) => x * y),
        // div
        '/': op(
            '/',
            (x, y) => x / y,
            (x) => 1 / x
        ),
        // mod
        '%': op('%', (x, y) => x % y),

        // inc
        '++': (arg, env, line) => {
            if (arg.length !== 1) {
                log[`[!] Increment requires only one argument (line ${line})`];
                return;
            }
            if (arg[0].type !== 'word') {
                log(`[*] Invalid name for increment (line ${line})`);
                return;
            }
            const name = arg[0].value;
            if (name.charAt(0) === '_') {
                log(`[!] Words starting with '_' can't be modified! (line ${line})`);
                return;
            }
            for (let i = env.length - 1; i >= 0; i--)
                if (name in env[i]) {
                    if (typeof env[i][name] !== 'number') {
                        log(`[!] Couldn't increment '${name}' because it doesn't contain a number.`);
                        return;
                    }
                    env[i][name] = env[i][name] + 1;
                    return env[i][name];
                }
            log(`[*] Couldn't increment '${name}' because it wasn't declared (line ${line})`);
        },
        // dec
        '--': (arg, env, line) => {
            if (arg.length !== 1) {
                log[`[!] Decrement requires only one argument (line ${line})`];
                return;
            }
            if (arg[0].type !== 'word') {
                log(`[*] Invalid name for decrement (line ${line})`);
                return;
            }
            const name = arg[0].value;
            if (name.charAt(0) === '_') {
                log(`[!] Words starting with '_' can't be modified! (line ${line})`);
                return;
            }
            for (let i = env.length - 1; i >= 0; i--)
                if (name in env[i]) {
                    if (typeof env[i][name] !== 'number') {
                        log(`[!] Couldn't decrement '${name}' because it doesn't contain a number.`);
                        return;
                    }
                    env[i][name] = env[i][name] + 1;
                    return env[i][name];
                }
            log(`[*] Couldn't decrement '${name}' because it wasn't declared (line ${line})`);
        },
        // pow
        '**': op('**', (x, y) => x ** y),
        // floor div
        '//': op('//', (x, y) => Math.floor(x / y)),

        // abs
        '||': (arg, env, line) => {
            if (arg.length === 1) return Math.abs(interpret(arg[0], env));
            log(`[*] Function abs '||' requires only one argument (line ${line})`);
        },
        // max / ceil
        '|^': (arg, env, line) => {
            if (arg.length === 1) return Math.ceil(interpret(arg[0], env));
            return Math.max(...arg.map((e) => interpret(e, env)));
        },
        // min / floor
        '|_': (arg, env, line) => {
            if (arg.length === 1) return Math.floor(interpret(arg[0], env));
            return Math.min(...arg.map((e) => interpret(e, env)));
        },
        // sign
        '+-': (arg, env, line) => {
            if (arg.length === 1) return Math.sign(interpret(arg[0], env));
            log(`[*] Function sign '+-' requires only one argument (line ${line})`);
        },
        // rnd
        '??': (arg, env, line) => {
            if (arg.length === 0) return Math.random();
            return interpret(arg[Math.floor(Math.random() * arg.length)], env);
        },

        // not
        '!': (arg, env, line) => {
            if (arg.length === 1) return !interpret(arg[0], env) ? 1 : 0;
            log(`[*] Function not '!' requires only one argument (line ${line})`);
        },
        // and
        '&': bool((x, y) => x & y),
        // or
        '|': bool((x, y) => x | y),

        // eq
        '=': bool((x, y) => x === y),
        // lt
        '<': bool((x, y) => x < y),
        // gt
        '>': bool((x, y) => x > y),
        // ne
        '!=': bool((x, y) => x !== y),
        // le
        '<=': bool((x, y) => x <= y),
        // ge
        '>=': bool((x, y) => x >= y),

        // len
        '#': (arg, env, line) => {
            if (arg.length === 1) return interpret(arg[0], env)?.length;
            log(`[*] Function length '#' requires only one argument (line ${line})`);
        },
        // range
        '..': (arg, env, line) => {
            if (arg.length === 0) return [];
            if (arg.length > 3) {
                log(`[*] Too many arguments for range '..', max: 3 (line ${line})`);
                return [];
            }
            const from = arg.length > 1 ? interpret(arg[0], env) : 0;
            const to = interpret(arg.length > 1 ? arg[1] : arg[0], env);
            const step = arg.length > 2 ? interpret(arg[2], env) : 1;
            if (![from, to, step].every((e) => typeof e === 'number')) {
                log(`[*] Range '..' can only take numbers as arguments (line ${line})`);
                return [];
            }
            if (from > to) {
                log(`[*] Range '..' start (${from}) must be less than end (${to}) (line ${line})`);
                return [];
            }
            let r = [];
            for (let i = from; i < to; i += step) {
                r.push(i);
            }
            return r;
        },
        // get ref
        '->': (arg, env, line) => {
            /**
             *
             *
             * TODO
             *
             *
             */
        },
        // set ref
        '<-': (arg, env, line) => {
            /**
             *
             *
             * TODO
             *
             *
             */
        },
        // pop
        '|>': (arg, env, line) => {
            /**
             *
             *
             * TODO
             *
             *
             */
        },
        // push
        '<|': (arg, env, line) => {
            /**
             *
             *
             * TODO
             *
             *
             */
        },
        // reverse
        '<->': (arg, env, line) => {
            /**
             *
             *
             * TODO
             *
             *
             */
        },
    };
}
