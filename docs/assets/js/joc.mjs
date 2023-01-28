// @ts-check

/**
 * @file joc interpreter
 * @author eduvf.github.io
 */

//--------------------------------------------------------------

import lib from './lib.mjs';

/**
 * used for showing messages to the user; it defaults to the
 * console, but can be overwritten to print elsewhere
 * @type {Function}
 */
let log = console.log;

/**
 * main function for evaluating joc code
 * @param {String} code
 * @param {Function} output
 * @returns {*}
 */
export default function joc(code, output, env) {
    if (output) log = output;
    if (!env) env = [lib(interpret, log, format)];

    const ast = parse(lex('(' + code + ')'));

    // test
    // console.dir(ast, { depth: null });

    const r = interpret(ast, env);
    log('\n--> ' + format(r));
    return r;
}

/**
 * formats any given value into its string representation
 * @param {*} value
 * @param {Number} level
 * @returns {String}
 */
export function format(value, level = 0) {
    switch (typeof value) {
        case 'function':
            return '(~ ...)';
        case 'string':
            return value;
        case 'number':
            return value.toString();
        case 'object':
            // table
            if (Array.isArray(value)) {
                if (value.every((e) => typeof e === 'string')) {
                    return value.join('');
                }
                return (
                    (level > 0 ? '\n' : '') +
                    '  '.repeat(level) +
                    `[ ${value.map((e) => format(e, level + 1)).join(' ')} ]`
                );
            }
            // map
            let s = '{\n';
            for (let k in value) {
                s += `${k} → ${format(value[k])}\n`;
            }
            return s + '\n}';
        default:
            return '∅';
    }
}

//--------------------------------------------------------------
// LEX & PARSE
//--------------------------------------------------------------

/**
 * splits a string of joc code into an array of tokens
 * @param {String} s
 * @returns {Array.<Object>}
 */
export function lex(s) {
    let tok = [];
    let char;

    // store line for debugging
    let line = 1;
    let i = 0;
    while (i < s.length) {
        // get current character
        char = s[i];

        if (char === ',') {
            // comment
            while (i < s.length && s[i] !== '\n') i++;
        } else if (char === '\n') {
            // new line
            tok.push({ type: '\n', line: line });
            i++;
            line++;
        } else if ('([{}])'.includes(char)) {
            // bracket
            tok.push({ type: char, line: line });
            i++;
        } else if (char === "'") {
            // string
            const from = ++i;
            const fromLine = line;
            // advance until a non-escaped quote is found
            while (s.charAt(i) && !(s[i - 1] !== '\\' && s[i] === char)) {
                if (s[i] === '\n') line++;
                i++;
            }
            if (s.charAt(i) !== char) {
                log(`[!] Unclosed string (starting at line ${fromLine})`);
                return [];
            }
            tok.push({ type: 'str', value: s.slice(from, i), line: fromLine });
            i++; // skip ending quote
        } else if (/\S/.test(char)) {
            // word, key or number
            const from = i++;
            // match everything except whitespace, commas, single quotes and brackets
            while (/[^\s,'()\[\]{}]/.test(s.charAt(i))) i++;
            const t = s.slice(from, i);
            if (/^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/.test(t)) {
                // number
                tok.push({ type: 'num', value: Number(t), line: line });
            } else if (/^[!-@|~]/.test(t)) {
                // key
                tok.push({ type: 'key', value: t, line: line });
            } else {
                // word
                tok.push({ type: 'word', value: t, line: line });
            }
        } else {
            // ignore anything else
            i++;
        }
    }
    return tok;
}

/**
 * transforms an array of tokens into an abstract syntax tree
 * @param {Array.<Object>} tok
 * @param {Boolean} firstInLine
 * @returns {Object}
 */
export function parse(tok, firstInLine = true) {
    let t;
    // get token (or undefined if 'tok' is empty)
    while ((t = tok.shift())) {
        // ignore extra lines
        if (t.type === '\n') continue;

        // keys (anywhere) and words (starting a line) create
        // expressions that run until the end of the line or
        // the next closing bracket
        if (t.type === 'key' || (firstInLine && t.type === 'word')) {
            let args = [];
            while (tok.length > 0 && !'\n)]}'.includes(tok[0]?.type)) {
                args.push(parse(tok, false));
            }
            return { type: 'exp', fn: t, args: args, line: t.line };
        } else if ('([{'.includes(t.type)) {
            let list = [];
            const type = { '(': 'scope', '[': 'table', '{': 'map' }[t.type];
            const end = { '(': ')', '[': ']', '{': '}' }[t.type];
            while (tok.length > 0 && tok[0].type !== end) {
                tok[0].type === '\n'
                    ? tok.shift() // ignore extra new lines
                    : list.push(parse(tok, type === 'scope'));
            }
            if (tok.length > 0 && tok[0].type !== end) {
                log(`[!] Missing ending bracket '${end}' for ${type} (starting at line ${t.line})`);
                return;
            }
            if (tok.length > 0) tok.shift(); // remove end bracket
            return { type: type, value: list, line: t.line };
        } else if ('}])'.includes(t.type)) {
            log(`[!] Unexpected closing bracket '${t.type}' (line ${t.line})`);
            return;
        }
        return t;
    }
}

/**
 * walks the AST and interprets it
 * @param {Object} node
 * @param {Array.<Object>} env
 * @returns {*}
 */
export function interpret(node, env) {
    switch (node?.type) {
        case 'exp':
            const fn = interpret(node.fn, env);
            if (typeof fn === 'function') return fn(node.args, env, node.line);
            log(`[*] Couldn't find function '${node.fn}' (line ${node.line})`);
            return;
        case 'scope':
            let r;
            env.push({}); // start scope
            for (const e of node.value) {
                // the variable ^ stores the previously returned value
                env[env.length - 1]['^'] = r;
                r = interpret(e, env);
            }
            env.pop(); // end scope
            return r;
        case 'table':
            const t = node.value.map((e) => interpret(e, env));
            if (!t.every((e) => typeof e === typeof t[0])) {
                log(`[*] Tables should store only one type of value (line ${node.line})`);
                return [];
            }
            return t;
        case 'map':
            let m = {};
            for (let i = 0; i < node.value.length; i += 2) {
                if (['key', 'word', 'str'].includes(node.value[i].type)) {
                    m[node.value[i].value] = interpret(node.value.at(i + 1), env);
                    continue;
                }
                log(`[*] Expected key, word or string for map assignment (line ${node.line})`);
            }
            return m;
        case 'key':
        case 'word':
            // search from inner to outer scope
            for (let i = env.length - 1; i >= 0; i--) {
                if (node.value in env[i]) return env[i][node.value];
            }
            log(`[*] Couldn't find '${node.value}', returning nil instead (line ${node.line})`);
            return;
        case 'str':
            return node.value.length > 1 ? node.value.split('') : node.value;
        case 'num':
            return node.value;
    }
    return;
}

/*






                   TO DO







//--------------------------------------------------------------
// VALIDATE & COMPILE
//--------------------------------------------------------------

export function validate(node, env = [{}]) {
    if (node.type === 'exp') {
        let arg = node.args;
        let len = arg.length;
        let ret = 'nil';

        switch (node.fn) {
            case 'scope':
                if (len > 1) ret = arg.map((a) => validate(a, env)).at(-1);
                break;
            case 'table':
                arg = arg.map((a) => validate(a, env));
                // check all elements have the same type
                let allSame = arg.every((v, _, arr) => v === arr[0]);
                if (!allSame) {
                    log(`[!] All elements within the table should have the same type (line ${node.line})`);
                    return '*';
                }
                ret = 'table';
            case 'map':
            //
            //
            //    TODO
            //
            //
        }

        return ret;
    } else if (node.type === 'key' || node.type === 'word') {
        // check if it has been declared before
        for (let i = env.length - 1; i >= 0; i--) {
            if (node.value in env[i]) return env[i][node.value];
        }
        log(`[!] Identifier '${node.value}' hasn't been declared (line ${node.line})`);
        return;
    }
    return node.type;
}

export function compile(node, byte = []) {
    if (node.type === 'exp') {
        const arg = node.args;
        const len = arg.length;
        switch (node.fn) {
            case 'scope':
                byte.push(['s(']);
                for (let i = 0; i < len; i++) {
                    compile(arg[i], byte);
                    if (i < len - 1) byte.push(['pp']);
                }
                byte.push([')s']);
                break;
            case 'table':
                arg.forEach((a) => compile(a, byte));
                byte.push(['tb', len]);
                break;
            case ':':
            case '.':
                for (let i = 0; i < len; i += 2) {
                    arg.at(i + 1) ? compile(arg[i + 1], byte) : byte.push(['ps', null]);
                    byte.push(['sv', arg[i].value]);
                }
                break;
            case '?':
                for (let i = 0; i < len; i += 2) {
                    compile(arg[i], byte);
                    if (arg.at(i + 1)) {
                        const body = compile(arg[i + 1]);
                        byte.push(['jz', body.length]);
                        body.forEach((e) => byte.push(e));
                    }
                }
                break;
            case '@':
                if (len === 2) {
                    const cond = compile(arg[0]);
                    const body = compile(arg[1]);
                    cond.forEach((e) => byte.push(e));
                    byte.push(['jz', body.length + 1]);
                    body.forEach((e) => byte.push(e));
                    byte.push(['jp', -(cond.length + body.length)]);
                }
                break;
            case '~':
                // TODO
                break;
            default:
                arg.forEach((a) => compile(a, byte));
                byte.push(['cl', node.fn, len]);
        }
    } else if (node.type === 'word') {
        byte.push(['ld', node.value]);
    } else {
        byte.push(['ps', node.value]);
    }
    return byte;
}

//--------------------------------------------------------------
// INTERPRET
//--------------------------------------------------------------

//*/
