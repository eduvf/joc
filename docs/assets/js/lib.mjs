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
export function std(evaluate, log = (e) => console.log(e)) {
    function op(type, bin, un = (x) => x) {
        return {
            type: 'function',
            const: true,
            value: (arg, env, line) => {
                if (arg.length === 0) return { type: 'nothing', value: '' };
                let first = evaluate(arg.shift(), env, log);
                if (arg.length === 0) return { type: first.type, value: un(first.value) };
                return {
                    type: type,
                    value: arg.reduce((acc, e) => {
                        e = evaluate(e, env, log);
                        if (e.type !== type) {
                            log(`[*] Type mismatch in function at line ${line}. Expected ${type}, got ${e.type}.`);
                        }
                        return bin(acc, e.value);
                    }, first.value),
                };
            },
        };
    }

    return {
        // bool const
        _0: { type: 'boolean', const: true, value: false },
        _1: { type: 'boolean', const: true, value: true },
        // basic math
        '+': op('number', (x, y) => x + y),
        '-': op(
            'number',
            (x, y) => x - y,
            (x) => -x
        ),
        '*': op('number', (x, y) => x * y),
        '/': op('number', (x, y) => x / y),
        '%': op('number', (x, y) => x % y),
        // // comparison
        // '=': op((x, y) => x === y),
        // '<': op((x, y) => x < y),
        // '>': op((x, y) => x > y),
        // '!=': op((x, y) => x !== y),
        // '<=': op((x, y) => x <= y),
        // '>=': op((x, y) => x >= y),
        // // logic
        // '&': op((x, y) => x && y),
        // '|': op((x, y) => x || y),
    };
}
