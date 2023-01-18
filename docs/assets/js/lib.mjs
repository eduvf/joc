//@ts-check

/**
 * file: lib.mjs
 * repo: github.com/eduvf/joc
 *
 * Each function in this module returns an object with the
 * contents of its library.
 */

//--------------------------------------------------------------

/**
 * Standard library
 */
export function std(evaluate) {
    function op(binFunc, unFunc = (x) => x) {
        return {
            type: 'function',
            value: (arg, env, line, msg) => {
                if (arg.length === 0) return { type: 'nothing' };
                if (arg.length === 1) return unFunc(evaluate(arg[0], env).value);
                let first = evaluate(arg[0], env);
                const type = first.type;
                return arg.slice(1).reduce((total, e) => {
                    e = evaluate(e, env);
                    if (e.type !== type) {
                        msg.push(`[*] Type mismatch in function at line ${line}.`);
                        msg.push(`    Expected ${type}, got ${e.type}. `);
                    }
                    return { type: type, value: binFunc(total, e.value) };
                }, first.value);
            },
        };
    }

    return {
        '+': op((x, y) => x + y),
        '-': op(
            (x, y) => x - y,
            (x) => -x
        ),
        '*': op((x, y) => x * y),
        '/': op((x, y) => x / y),
        '%': op((x, y) => x % y),
    };
}
