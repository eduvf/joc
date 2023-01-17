//@ts-check

/**
 * file: joc.mjs
 * repo: github.com/eduvf/joc
 *
 * This module is structured as follows:
 * - lex(s)
 * - parse(tok)
 * - evaluate(node, env)
 *
 * lex() return a list of tokens, and parse() constructs an AST.
 * Then, evaluate() executes the code provided an environment to
 * work with. It'll return the array 'msg' with all relevant
 * print messages, as well as warnings and errors (if any).
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
            tok.push({ type: 's', val: s.slice(from, i), line: line });
            i++; // ignore ending quote
        } else if (/[a-z^_]/.test(char)) {
            // word keyword
            let from = i;
            for (i++; i < s.length && /[\w^!?~+]/.test(s[i]); i++);
            tok.push({ type: 'w', val: s.slice(from, i), line: line });
        } else if (/[!-~]/.test(char)) {
            // number or symbol keyword
            let from = i;
            for (i++; i < s.length && /[!-~]/.test(s[i]) && /[^'(),\[\]{}]/.test(s[i]); i++);
            let t = s.slice(from, i);
            // check if number (int, float, ratio) or keyword
            if (/^-?\d+$/.test(t)) {
                // integer
                tok.push({ type: 'i', val: Number(t), line: line });
            } else if (/^0[xb]\d+$/.test(t)) {
                // hex or binary (same as integer)
                tok.push({ type: 'i', val: Number(t), line: line });
            } else if (/^-?(\d*\.\d+)|(\d+\.\d*)$/.test(t)) {
                // float
                tok.push({ type: 'f', val: Number(t), line: line });
            } else if (/^-?\d+:-?\d+$/.test(t)) {
                // ratio
                let ratio = t.split(':').map((e) => Number(e));
                tok.push({ type: 'r', val: ratio, line: line });
            } else {
                tok.push({ type: 'k', val: t, line: line });
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
 * Take a list of tokens and return an AST
 * @param {Array.<object>} tok
 */
export function parse(tok, head = true) {
    while (tok.length > 0) {
        let t = tok.shift();
        // an expression can start with...
        if (t.type === 'k' || (head && t.type === 'w')) {
            // - a symbol keyword (k)
            // - a word keyword (w), given that head == true
            let expr = [t];
            while (tok.length > 0 && !'\n)'.includes(tok[0].type)) {
                expr.push(parse(tok, false));
            }
            return expr;
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
            return expr;
        } else if (t.type === '\n') {
            continue; // ignore extra new lines
        }
        return t;
    }
    return [];
}

export function evaluate(node, env) {
    let result = msg.slice(0);
    msg.length = 0;
    return result;
}
