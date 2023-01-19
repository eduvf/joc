//@ts-check

/**
 * file: joc.mjs
 * repo: github.com/eduvf/joc
 *
 * This module is structured as follows:
 * - lex(s, log)
 * - parse(tok, log, head)
 * - evaluate(node, env, log)
 * - joc(s, env, log)
 *
 * lex() return a list of tokens, and parse() constructs an AST.
 * Then, evaluate() executes the code provided an environment to
 * work with, and returns the result.
 * joc() is a wrapper function that does all of the above and
 * takes optionally a 'log' function to output messages.
 * By default, it just outputs to console with console.log().
 */

//--------------------------------------------------------------

/**
 * Splits a string of joc code into tokens (objects)
 * @param {String} s
 * @param {Function} log
 * @returns {Array.<object>} tok
 */
export function lex(s, log) {
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
                    log(`[!] Unclosed string starting at line ${fromLine}.`);
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
            if (/^(-|0x|0b)?\d*\.?\d+$/.test(t)) {
                // number
                tok.push({ type: 'number', value: Number(t), line: line });
            } else {
                // key
                tok.push({ type: 'key', value: t, line: line });
            }
        } else if (/\s/.test(char)) {
            // ignore whitespace
            i++;
        } else {
            log(`[!] Invalid character '${char}' at line ${line}.`);
            return [];
        }
    }
    return tok;
}

/**
 * Takes a list of tokens and return an AST
 * @param {Array.<object>} tok
 * @param {Function} log
 * @param {boolean} head
 * @returns {Object}
 */
export function parse(tok, log, head = true) {
    while (tok.length > 0) {
        let t = tok.shift();
        // ignore extra new lines
        if (t.type === '\n') continue;
        // an expression can start with...
        if (t.type === 'key' || (head && t.type === 'word')) {
            // - a key
            // - a word, given that head == true
            let expr = [t];
            while (tok.length > 0 && !'\n)'.includes(tok[0].type)) {
                expr.push(parse(tok, log, false));
            }
            return { type: 'expression', value: expr, scope: false, line: t.line };
        } else if (t.type === '(') {
            // - a parenthesis (...)
            let expr = [];
            let scope = tok[0].type === '\n';
            // a new line after the opening parenthesis treats all word keywords
            // starting a line, as starting an expression
            while (tok.length > 0 && tok[0].type !== ')') {
                expr.push(parse(tok, log, scope));
                while (tok.length > 0 && tok[0].type === '\n') tok.shift();
            }
            if (tok.length === 0) {
                log(`[*] Missing ending parenthesis for expression starting at line ${t.line}.`);
            } else {
                tok.shift(); // remove ')'
            }
            return { type: 'expression', value: expr, scope: scope, line: t.line };
        }
        // is an atom
        return t;
    }
    return { type: 'nothing', value: '' };
}

/**
 * Interpret an AST and return the resulting value
 * @param {Object} node
 * @param {Array.<object>} env
 * @param {Function} log
 * @returns {Object}
 */
export function evaluate(node, env, log) {
    switch (node.type) {
        case 'expression':
            if (!node.scope && node.value.length > 0) {
                // if is an expression, check if the first element is a function
                let func = evaluate(node.value[0], env, log);
                if (func.type === 'function') {
                    return func.value(node.value.slice(1), env, node.line, log);
                }
            }
            // otherwise, process each element and return the last one
            let result = { type: 'nothing', value: '', line: node.line };
            if (node.scope) env.push({}); // start scope
            for (let e of node.value) {
                result = evaluate(e, env, log);
            }
            if (node.scope) env.pop(); // end scope
            return result;
        case 'key':
        case 'word':
            // search of the reference from inner to outer scope
            for (let i = env.length - 1; i >= 0; i--) {
                if (node.value in env[i]) return env[i][node.value];
            }
            log(`[*] Couldn't find '${node.value}', returning nothing instead.`);
            return { type: 'nothing', value: '', line: node.line };
        default:
            // is a literal value
            return node;
    }
}

/**
 * Calls lex(), parse() and evaluate(), and then takes the
 * result from evaluate() and passes a string to log() with
 * messages and the result.
 * @param {String} s
 * @param {Array.<object>} env
 * @param {Function} log
 */
export function joc(s, env, log = (e) => console.log(e)) {
    let r = evaluate(parse(lex(s, log), log), env, log);
    log(`(${r.type}) ${r.value}`);
    return r.value;
}
