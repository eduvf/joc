//@ts-check

/**
 * file: joc.mjs
 * repo: github.com/eduvf/joc
 *
 * main file for the JavaScript joc interpreter
 */

//--------------------------------------------------------------

import { lib } from './lib.mjs';

// used for printing stuff to the console or output window
var log = (x) => console.log(format(x));

/**
 * takes a string and returns an array of tokens
 * @param {String} s
 * @returns {Array.<Object>} tok
 */
export function lex(s) {
    let tok = [];
    let char;
    let line = 1;

    let i = 0;
    while (i < s.length) {
        char = s[i]; // current character

        if (char === ',') {
            // comment
            while (i < s.length && s[i] !== '\n') i++;
        } else if (char === '\n') {
            // new line
            tok.push({ type: '\n', line: line++, i: i++ });
        } else if ('([{}])'.includes(char)) {
            // bracket
            tok.push({ type: s[i], line: line, i: i++ });
        } else if (char === "'") {
            // string
            let from = ++i;
            // advance until a non-escaped quote is found
            while (s.charAt(i) && !(s[i - 1] !== '\\' && s[i] === char)) {
                if (s[i] === '\n') line++;
                i++;
            }
            if (s.charAt(i) !== char) log(`[*] Unclosed string`);
            tok.push({ type: 'str', value: s.slice(from, i), line: line, i: i });
            i++; // skip ending quote
        } else if (/[a-z_^]/.test(char)) {
            // word
            let from = i++;
            while (/[\w^!?~+*]/.test(s.charAt(i))) i++;
            tok.push({ type: 'word', value: s.slice(from, i), line: line, i: i });
        } else if (/[!-~]/.test(char)) {
            // key or number
            let from = i++;
            while (/[!-~]/.test(s.charAt(i)) && !"([{}])',".includes(s.charAt(i))) i++;
            let t = s.slice(from, i);
            tok.push(
                /^(-?\d*\.?\d+)|(0[xb][\da-fA-F]+)$/.test(t)
                    ? { type: 'num', value: Number(t), line: line, i: i } // number
                    : { type: 'key', value: t, line: line, i: i } // key
            );
        } else {
            // ignore everything else
            if (/\S/.test(char)) log(`[*] Invalid character '${char}' will be ignored!`);
            i++;
        }
    }
    return tok;
}

/**
 * takes an array fo tokens and returns an AST made up of objects
 * @param {Array.<Object>} tok
 * @param {Boolean} scope
 * @returns {Object}
 */
export function parse(tok, scope = true) {
    while (tok.length > 0) {
        let t = tok.shift(); // get token
        if (t.type === '\n') continue; // ignore extra new lines
        // check for a function key/word
        if (t.type === 'key' || (scope && t.type === 'word')) {
            let args = [];
            while (tok.length > 0 && !'\n)]}'.includes(tok[0].type)) {
                args.push(parse(tok, false));
            }
            return { type: 'exp', fn: t, args: args, line: t.line, i: t.i };
        } else if ('([{'.includes(t.type)) {
            let list = [];
            let type = { '(': 'scp', '[': 'tab', '{': 'map' }[t.type];
            let end = { '(': ')', '[': ']', '{': '}' }[t.type];
            while (tok.length > 0 && tok[0].type !== end) {
                tok[0].type === '\n'
                    ? tok.shift() // ignore extra new lines
                    : list.push(parse(tok, true));
            }
            if (tok.length > 0) tok.shift(); // remove end bracket
            return { type: type, value: list, line: t.line, i: t.i };
        }
        return t; // atom
    }
    return { type: 'nil' };
}

/**
 * takes an AST and an environment, and interprets it
 * @param {Object} node
 * @param {Array.<Object>} env
 * @returns {*}
 */
export function interpret(node, env) {
    switch (node.type) {
        case 'exp':
            let fn = interpret(node.fn, env);
            if (typeof fn === 'function') {
                return fn(node.args, env, node.line);
            }
            log(`[*] Couldn't find function for expression:\n${node}`);
        case 'scp':
            let r = undefined;
            env.push({}); // start scope
            for (let e of node.value) {
                env[env.length - 1]['^'] = r;
                r = interpret(e, env);
            }
            env.pop(); // end scope
            return r;
        case 'tab':
            let t = [];
            for (let e of node.value) {
                t.push(interpret(e, env));
            }
            return t;
        case 'map':
            let m = {};
            for (let i = 0; i < node.value.length; i += 2) {
                if (['key', 'word', 'str'].includes(node.value[i].type)) {
                    let name = node.value[i].value;
                    m[name] = i + 1 < node.value.length ? interpret(node.value[i + 1], env) : undefined;
                    continue;
                }
                log(`[*] Expected key, word or string for map assignment:\n${node}`);
            }
            return m;
        case 'key':
        case 'word':
            // search from inner to outer scope
            for (let i = env.length - 1; i >= 0; i--) {
                if (node.value in env[i]) return env[i][node.value];
            }
            log(`[*] Could not find '${node.value}', returning nil instead`);
        case 'nil':
            return undefined;
        default: // number or string
            return node.value;
    }
}

/**
 * takes some value and returns a string representation
 * @param {*} value
 * @param {Number} level
 * @returns {String}
 */
export function format(value, level = 0) {
    switch (typeof value) {
        case 'function':
            return '(~ ...)';
        case 'number':
        case 'string':
            return `${value}`;
        case 'object':
            if (Array.isArray(value))
                return (
                    (level > 0 ? '\n' : '') +
                    '  '.repeat(level) +
                    `[ ${value.map((e) => format(e, level + 1)).join(' ')} ]`
                );
            // otherwise, it's a map
            let s = '{\n';
            for (let k in value) {
                s += k + ' ' + format(value[k]) + '\n';
            }
            return s + '\n}';
        default:
            return '∅';
    }
}

/**
 * wraps lex(), parse() and interpret() to execute some joc code
 * @param {String} code
 * @param {Array} env
 * @param {*} output
 * @returns {*}
 */
export function joc(code, env, output) {
    if (output) log = output;
    if (!env) env = lib(interpret, log);
    let r = interpret(parse(lex(code)), env);
    log(r);
    return r;
}
