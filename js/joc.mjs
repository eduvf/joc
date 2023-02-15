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

function parse(tok) {
    const walk = (first = true, endln = false, tree = []) => {
        if (tok.length === 0) return tree;
        if (endln && tok[0][0] === '\n') return tree;

        const t = tok.shift();
        if (t[0] === '\n') return walk(first, endln, tree);
        if (')]}'.includes(t[0])) return tree;
        if ('([{'.includes(t[0]))
            return walk(false, endln, tree.concat([walk(false)]));
        if (first || t[0] === 'key')
            return walk(true, endln, tree.concat([walk(false, true, [t])]));

        return walk(false, endln, tree.concat([t]));
    };
    return walk();
}
