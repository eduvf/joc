//@ts-check

/**
 * file: lib.mjs
 * repo: github.com/eduvf/joc
 *
 * lib() return an environment with all standard joc functions
 */

//--------------------------------------------------------------

import { evaluate } from './joc.mjs';

/**
 * Returns a constant object
 * @param {String} type
 * @param {*} value
 * @returns {Object}
 */
function c(type, value) {
    return {
        type: type,
        const: true,
        value: value,
    };
}
/**
 * Shorthand for reducing operators
 * @param {Function} log
 * @param {Function} bin
 * @param {Function} un
 * @returns {Function}
 */
function op(log, bin, un = (x) => x) {
    //
    //
    //  FIX
    //
    //
    return c('function', (arg, env, line) => {
        if (arg.length === 0) return { type: 'nothing', value: '', line: line };
        let first = evaluate(arg.shift(), env, log);
        let type = first.type;
        if (arg.length === 0) return { type: type, value: un(first.value), line: line };
        return {
            type: type,
            value: arg.reduce((acc, e) => {
                e = evaluate(e, env, log);
                if (e.type !== type) {
                    log(`[*] Type mismatch in function at line ${line}. Expected ${type}, got ${e.type}.`);
                }
                return bin(acc, e.value);
            }, first.value),
            line: line,
        };
    });
}

//--------------------------------------------------------------

/**
 * Returns joc's library
 * @param {Function} log
 * @returns {Array.<object>}
 */
export function lib(log = (e) => console.log(e)) {
    const library = {
        // constants
        _0: c('boolean', false),
        _1: c('boolean', true),
        _pi: c('number', Math.PI),
        // basic math
        '+': op(log, (x, y) => x + y),
        '-': op(
            log,
            (x, y) => x - y,
            (x) => -x
        ),
        '*': op(log, (x, y) => x * y),
        '/': op(log, (x, y) => x / y),
        '%': op(log, (x, y) => x % y),
        // comparison
        '=': op(log, (x, y) => x === y),
        '<': op(log, (x, y) => x < y),
        '>': op(log, (x, y) => x > y),
        '!=': op(log, (x, y) => x !== y),
        '<=': op(log, (x, y) => x <= y),
        '>=': op(log, (x, y) => x >= y),
        // logic
        '&': op(log, (x, y) => x && y),
        '|': op(log, (x, y) => x || y),
    };
    return [library];
}
