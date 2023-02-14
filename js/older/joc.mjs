// @ts-check

/**
 * compile and evaluate a string of joc code
 * @param {String} code - joc code to evaluate
 * @param {Boolean} debug - enable/disable compiler debugging
 * @param {Function} log - where to output messages
 */
export default function joc(code, debug, log = console.log) {
    try {
        let tok = lex('(' + code + ')');
        if (debug) console.dir(tok, { depth: null });

        let ast = parse(tok.reverse());
        if (debug) console.dir(ast, { depth: null });

        let pcode = compile(ast);
        if (debug) console.dir(pcode, { depth: null });

        interpret(pcode);
    } catch (error) {
        log('[!] ' + error);
    }
}

/**
 * split a string of joc code into an array of tokens
 * @param {String} code - joc code
 * @returns {Array.<(Array|String)>}
 */
function lex(code) {
    let tok = [];
    let pos = 1;
    let char = code.charAt(0);
    const next = () => (char = code.charAt(pos++));

    while (char) {
        // @ts-ignore comment
        if (char === ',') while (next() && char !== '\n');

        if ('\n([{}])'.includes(char)) {
            // special characters
            tok.push(char);
        } else if (char === "'") {
            // string
            let s = '';
            while (!(s.charAt(-1) !== '\\' && next() === "'")) {
                if (!char) throw 'Unclosed string';
                s += char;
            }
            tok.push(['str', s]);
        } else if (/\S/.test(char)) {
            // boolean, number or symbol
            let t = char;
            while (/[^\s,'()\[\]{}]/.test(next())) t += char;
            pos -= 1; // fix offset
            if (['ok', 'no'].includes(t)) {
                tok.push(['bool', t === 'ok']);
            } else if (/^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/.test(t)) {
                tok.push(['num', Number(t)]);
            } else if (/^[!-@|~]/.test(t)) {
                tok.push(['key', t]);
            } else {
                tok.push(['ref', t]);
            }
        }
        next();
    }
    return tok;
}

/**
 * transform an array of tokens into an AST
 * @param {Array} tok - array of tokens
 * @param {Boolean} first - if first in expression
 */
function parse(tok, first = false) {
    let t; // get token
    while ((t = tok.pop())) {
        // ignore extra new lines
        if (t === '\n') continue;
        if (')]}'.includes(t)) throw `Unexpected bracket '${t}'`;
        // check for expressions
        if ('([{'.includes(t)) {
            let branch = ['('];
            const end = ')]}'.charAt('([{'.indexOf(t));
            while (tok.length && tok[tok.length - 1] !== end) {
                if (tok[tok.length - 1] === '\n') tok.pop();
                else branch.push(parse(tok, t === '('));
            }
            if (tok[tok.length - 1] !== end) throw `Missing ending bracket '${end}'`;
            tok.pop(); // pop end bracket
            if (branch.length === 2) return branch[1];
            return branch;
        }
        if (t[0] === 'key' || (t[0] === 'ref' && first)) {
            let branch = ['call', t[1]];
            while (tok.length && !'\n)]}'.includes(tok[tok.length - 1])) {
                branch.push(parse(tok));
            }
            return branch;
        }
        // atom
        return t;
    }
}

function validate() {
    // TODO
}

function compile(ast) {
    let pcode = [];
    let env = [{}];

    const builtins = {
        '.': (node) => {
            env[env.length - 1][node[0][1]] = 0;
            walk(node[1]);
            pcode.push(['st', node[0][1]]);
        },
    };

    const walk = (node) => {
        let head = node.shift();
        if (head === '(') {
            env.push({});
            node.forEach((e, i) => {
                walk(e);
                if (i < node.length - 1) pcode.push(['pp']);
            });
            for (const key in env[env.length - 1]) pcode.push(['fr', key]);
        } else if (head === 'call') {
            let fn = node.shift();
            if (fn in builtins) builtins[fn](node);
            else {
                node.forEach((e) => walk(e));
                pcode.push(['cl', fn]);
            }
        } else if (head === 'ref') {
            let found = false;
            for (let i = env.length - 1; i >= 0; i--) {
                if (node[0] in env[env.length - 1]) found = true;
            }
            if (!found) throw `Couldn't find '${node[0]}'`;
            pcode.push(['ld', node.shift()]);
        } else {
            pcode.push(['ps', node.shift()]);
        }
    };
    walk(ast);
    return pcode;
}

function interpret(pcode) {
    let stack = [];
    let env = [{}];

    const lib = {
        '+': (x, y) => x + y,
    };

    for (let ip = 0; ip < pcode.length; ip++) {
        let ins = pcode[ip].at(0);
        let arg = pcode[ip].at(1);
        switch (ins) {
            case 'ps':
                stack.push(arg);
                break;
            case 'pp':
                stack.pop();
                break;
            case 'jp':
                ip += arg;
                break;
            case 'jz':
                if (!stack.pop()) ip += arg;
                break;
            case 'cl':
                let y = stack.pop();
                let x = stack.pop();
                stack.push(lib[arg](x, y));
                break;
            case 'st':
                env[env.length - 1][arg] = stack.pop();
                break;
            case 'ld':
                stack.push(env[env.length - 1][arg]);
                break;
            case 'fr':
                delete env[env.length - 1][arg];
                break;
        }
    }
}
