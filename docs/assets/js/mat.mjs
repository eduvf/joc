//@ts-check

/**
 * file: mat.mjs
 * repo: github.com/eduvf/joc
 *
 * math and matrix functions
 */

//--------------------------------------------------------------

/**
 * @param {Function} interpret
 * @param {Function} log
 * @returns {Object}
 */
export function mat(interpret, log) {
    const shape = (name, fn) => (arg, env, line) => {
        let last = arg.at(-1);
        let axis = arg.slice(0, -1).map((a) => {
            a = interpret(a, env);
            if (typeof a === 'number' || a >= 0) return a;
            log(`[!] Function '${name}' at line ${line} requires numbers >= 0 as axis`);
        });
        return fn(axis, last, env);
    };

    const mat = {
        // reshape
        '<>': shape('<>', (axis, last, env) => {
            let tab = Array(axis.reduce((p, c) => p * c))
                .fill(0)
                .map(() => interpret(last, env));
            for (let a of axis) {
                let temp = [];
                while (tab.length > 0) temp.push(tab.splice(0, a));
                tab = temp;
            }
            return { $: axis, _: tab[0] };
        }),
        // reverse
        '<->': shape('<->', (axis, last, env) => {
            let tab = interpret(last, env);
            return (function iter(x) {
                if (typeof x === 'object') {
                    if (Array.isArray(x)) return x.map(iter);
                    if ('_' in x) {
                        if (axis.length === 0) return { $: x.$, _: x._.reverse() };
                        return axis.map((a) => {
                            let temp = x._.slice(0);
                            for (let i = a; i !== 0; i -= Math.sign(i))
                                i > 0 ? temp.unshift(temp.pop()) : temp.push(temp.shift());
                            return { $: x.$, _: temp };
                        });
                    }
                } else if (typeof x === 'string') {
                    return iter(x.split(''))._.join('');
                }
                log(`[!] Couldn't reverse`);
                return [];
            })(tab);
        }),
        // reverse vertical
        '<|>': shape('<|>', (axis, last, env) => {
            let tab = interpret(last, env);
            return (function iter(x) {
                if (typeof x === 'object') {
                    if (Array.isArray(x)) return x.map(iter);
                    if ('_' in x) {
                        if (axis.length === 0) {
                            return { $: x.$, _: x._.map((e) => e.reverse()) };
                        }
                        return axis.map((a) => {
                            let r = [];
                            for (let e of x._) {
                                let temp = e.slice(0);
                                for (let i = a; i !== 0; i -= Math.sign(i))
                                    i > 0 ? temp.unshift(temp.pop()) : temp.push(temp.shift());
                                r.push(temp);
                            }
                            return { $: x.$, _: r };
                        });
                    }
                }
                log(`[!] Couldn't reverse`);
                return [];
            })(tab);
        }),
    };
    return mat;
}
