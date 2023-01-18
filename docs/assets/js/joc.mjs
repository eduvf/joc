//@ts-check

/**
 * file: joc.mjs
 * repo: github.com/eduvf/joc
 *
 * This module is structured as follows:
 * - lex(s)
 * - parse(tok)
 * - evaluate(node, env)
 * - show(r)
 *
 * lex() return a list of tokens, and parse() constructs an AST.
 * Then, evaluate() executes the code provided an environment to
 * work with, and returns the result. show() formats the result
 * as a string, along with the messages stored in 'msg'.
 */

//--------------------------------------------------------------

/**
 * Stores messages to display to the user (prints, warnings, errors...)
 * @type {Array.<string>}
 */
let msg = [];

/**
 * Splits a string of joc code into tokens (objects)
 * @param {String} s
 * @returns {Array.<object>} tok
 */
export function lex(s) {
    let tok = [];
    let char;
    let line = 1;

    for (let i = 0; i < s.length; ) {
        char = s[i]; // current character

        if (char === ',') {
            // comment
            while (i < s.length && s[i] !== '\n') i++;
            line++;
        } else if ('\n()[]{}'.includes(char)) {
            // special characters
            if (char === '\n') line++;
            tok.push({ type: char, line: line });
            i++;
        } else if (char === "'") {
            // string
            i++; // ignore opening quote
            let fromLine = line;
            let from = i;
            // advance until a non-escaped quote is found
            for (; !(s[i - 1] !== '\\' && s[i] === char); i++) {
                if (i > s.length) {
                    msg.push(`[!] Unclosed string starting at line ${fromLine}.`);
                    return [];
                }
                if (s[i] === '\n') line++;
            }
            tok.push({ type: 'string', value: s.slice(from, i), line: line });
            i++; // ignore ending quote
        } else if (/[a-z^_]/.test(char)) {
            // word
            let from = i;
            for (i++; i < s.length && /[\w^!?~+]/.test(s[i]); i++);
            tok.push({ type: 'word', value: s.slice(from, i), line: line });
        } else if (/[!-~]/.test(char)) {
            // number or key
            let from = i;
            for (i++; i < s.length && /[!-~]/.test(s[i]) && /[^'(),\[\]{}]/.test(s[i]); i++);
            let t = s.slice(from, i);
            // check if number (int, float, ratio) or key
            if (/^(-?|0[xb])\d+$/.test(t)) {
                // integer (including hex or binary)
                tok.push({ type: 'integer', value: Number(t), line: line });
            } else if (/^-?(\d*\.\d+)|(\d+\.\d*)$/.test(t)) {
                // float
                tok.push({ type: 'float', value: Number(t), line: line });
            } else if (/^-?\d+:-?\d+$/.test(t)) {
                // ratio
                let ratio = t.split(':').map((e) => Number(e));
                tok.push({ type: 'ratio', value: ratio, line: line });
            } else {
                tok.push({ type: 'key', value: t, line: line });
            }
        } else if (/\s/.test(char)) {
            // ignore whitespace
            i++;
        } else {
            msg.push(`[!] Invalid character '${char}' at line ${line}.`);
            return [];
        }
    }
    return tok;
}

/**
 * Takes a list of tokens and return an AST
 * @param {Array.<object>} tok
 * @param {boolean} head
 * @returns {Object}
 */
export function parse(tok, head = true) {
    while (tok.length > 0) {
        let t = tok.shift();
        // an expression can start with...
        if (t.type === 'key' || (head && t.type === 'word')) {
            // - a key
            // - a word, given that head == true
            let expr = [t];
            while (tok.length > 0 && !'\n)'.includes(tok[0].type)) {
                expr.push(parse(tok, false));
            }
            return { type: 'expression', value: expr, line: t.line };
        } else if (t.type === '(') {
            // - a parenthesis (...)
            let expr = [];
            let isMulti = tok[0].type === '\n';
            // a new line after the opening parenthesis treats all word keywords
            // starting a line, as starting an expression
            while (tok.length > 0 && tok[0].type !== ')') {
                expr.push(parse(tok, isMulti));
                while (tok.length > 0 && tok[0].type === '\n') tok.shift();
            }
            if (tok.length === 0) {
                msg.push(`[*] Missing ending parenthesis for expression starting at line ${t.line}.`);
            } else {
                tok.shift(); // remove ')'
            }
            return { type: isMulti ? 'scope' : 'expression', value: expr, line: t.line };
        } else if (t.type === '\n') {
            continue; // ignore extra new lines
        }
        return t;
    }
    return { type: 'nothing' };
}

/**
 * Interpret an AST and return the resulting value
 * @param {Object} node
 * @param {Array.<object>} env
 * @returns {Object}
 */
export function evaluate(node, env) {
    switch (node.type) {
        case 'scope':
        case 'expression':
            let scope = node.type === 'scope';
            if (!scope && node.value.length > 0) {
                // if is an expression, check if the first element is a function
                let func = evaluate(node.value[0], env);
                if (func.type === 'function') {
                    return func.value(node.value.slice(1), env, node.line, msg);
                }
            }
            // otherwise, process each element and return the last one
            let result = { type: 'nothing' };
            if (scope) env.push({}); // start scope
            for (let e of node.value) {
                result = evaluate(e, env);
            }
            if (scope) env.pop(); //end scope
            return result;
        case 'key':
        case 'word':
            // search of the reference from inner to outer scope
            for (let i = env.length - 1; i >= 0; i--) {
                if (node.value in env[i]) return env[i][node.value];
            }
            msg.push(`[*] Couldn't find '${node.value}', returning nothing instead.`);
            return { type: 'nothing' };
        default:
            // is a literal value
            return node;
    }
}

/**
 * Takes a result from evaluate() and returns a string with
 * messages to the user and the result.
 * @param {Object} r
 * @returns {String}
 */
export function show(r) {
    msg.push(`(${r.type}) ${r.value}`);
    return msg.splice(0, Infinity).join('\n');
}
