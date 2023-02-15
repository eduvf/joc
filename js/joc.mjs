// @ts-check

// TODO:
// format()
// log
// check()

export default function joc(code, debug) {
    try {
        const tok = lex(code);
        if (debug) console.log(tok);

        brackets(tok);

        const ast = parse(tok);
        if (debug) console.dir(ast, { depth: null });
    } catch (error) {
        console.warn('[!] ' + error);
    }
}

function lex(code) {
    const token = /'(?:[\\].|[^\\'])*'|[(){}\[\]\n]|[^\s()]+/g;
    const number = /^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/;
    const key = /^[!-@|~]/;

    return code.match(token).map((t) => {
        if (t === '\n') return ['\n'];
        if ('([{}])'.includes(t)) return [t];
        if (t.charAt(0) === "'") return ['str', t.slice(1, -1)];
        if (number.test(t)) return ['num', Number(t)];
        if (t === 'ok') return ['bool', true];
        if (t === 'no') return ['bool', false];
        return [key.test(t) ? 'key' : 'ref', t];
    });
}

function brackets(tok) {
    let counter = [0, 0, 0]; // round, square, curly
    for (const t of tok) {
        if ('([{'.includes(t[0])) counter['([{'.indexOf(t[0])]++;
        if (')]}'.includes(t[0])) counter[')]}'.indexOf(t[0])]--;
    }
    if (!counter.every((n) => n === 0)) throw 'Brackets mismatch';
}

function parse(tok, head = true, end = false, tree = [['list']]) {
    while (tok.length > 0) {
        if (end && '\n)'.includes(tok[0][0])) break;

        const t = tok.shift();
        if (t[0] === '\n') continue;
        if (')]}'.includes(t[0])) break;
        if ('([{'.includes(t[0]))
            return parse(tok, false, end, tree.concat([parse(tok)]));
        if (head || t[0] === 'key') {
            const branch = parse(tok, false, true, [t]);
            return parse(tok, true, end, tree.concat([branch]));
        }
        head = false;
        tree.push(t);
    }
    return tree;
}

const lib = {
    '+': (...xs) => xs.reduce((a, b) => a + b),
    '-': (...xs) => xs.reduce((a, b) => a - b, 0),
    '*': (...xs) => xs.reduce((a, b) => a * b),
    '/': (...xs) => xs.reduce((a, b) => a / b),
    '%': (...xs) => xs.reduce((a, b) => a % b),
    '::': (...xs) => [...xs],
    '->': (x) => x,
};

function get(sym, env, i = env.length - 1) {
    if (sym in env.i) return env.i.sym;
    return i > 0 ? get(sym, env, i - 1) : null;
}

function compile() {
    const traverse = (node) => {
        if (node[0] === 'list') {
            traverse(node.slice(1));
        }
    };
}
