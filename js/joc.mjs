// @ts-check

export default function joc(code, debug) {
    const tok = lex(code);
    console.log(tok);

    const ast = parse(tok);
    console.dir(ast, { depth: null });
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

function parse(tok) {
    const walk = (first = true, endln = false, tree = []) => {
        if (tok.length === 0) return tree;
        if (endln && tok[0][0] === '\n') return tree;

        const t = tok.shift();
        if (t[0] === '\n') return walk(first, endln, tree);
        if (t[0] === '(') return walk(false, endln, tree.concat([walk(false, false)]));
        if (t[0] === ')') return tree;
        if (t[0] === 'key' || first) return walk(true, endln, tree.concat([walk(false, true, [t])]));

        return walk(false, endln, [...tree, t]);
    };
    return walk();

    //*/
    /*
    const walk = (first = true, tree = []) => {
        if (tok.length === 0) return tree;

        const t = tok.shift();
        if (t[0] === '\n') return walk(first, tree);
        if (t[0] === ')') return tree;
        if (t[0] === '(') {
            let branch = ['list'];
            while (tok.length && tok[0][0] !== ')') {
                if (tok[0][0] === '\n') tok.shift();
                else branch.push(walk(true));
            }
            return walk(first, tree.concat(branch));
        }
        if (t[0] === 'key' || (t[0] === 'ref' && first)) {
            let branch = ['call', t];
            while (tok.length && !'\n)'.includes(tok[0][0])) {
                branch.push(walk(false));
            }
            return walk(first, [...tree, branch]);
        }
        return t;
    };
    return walk();
    //*/
}

/*
export default function joc(code, debug) {
    try {
        const tok = lex('(' + code + ')');
        if (debug) console.dir(tok, { depth: null });

        const ast = parse(tok.reverse());
        if (debug) console.dir(ast, { depth: null });
    } catch (error) {
        console.log('[!] ' + error);
    }
}

function lex(code) {
    let tok = [];
    let pos = 1;
    let char = code.charAt(0);
    const next = () => (char = code.charAt(pos++));

    while (char) {
        // comment
        if (char === ',') while (next() && char !== '\n');
        // new line
        if (char === '\n') tok.push('\n');
        // brackets
        else if ('([{'.includes(char)) tok.push('(');
        else if (')]}'.includes(char)) tok.push(')');
        else if (char === "'") {
            // string
            let s = '';
            while (!(s.charAt(-1) !== '\\' && next() === "'"))
                if (!char) throw 'Unclosed string';
                else s += char;
            tok.push(['str', s]);
        } else if (/\S/.test(char)) {
            // number, boolean or symbol
            let t = char;
            while (/[^\s,'()\[\]{}]/.test(next())) t += char;
            pos -= 1; // fix offset
            if (/^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/.test(t)) tok.push(['num', Number(t)]);
            else if (['ok', 'no'].includes(t)) tok.push(['bool', t === 'ok']);
            else tok.push([/^[!-@|~]/.test(t) ? 'key' : 'ref', t]);
        }
        next();
    }
    return tok;
}

function parse(tok, first = false) {
    let t; // get token
    while ((t = tok.pop())) {
        // ignore extra new lines
        if (t === '\n') continue;
        if (t === ')') throw 'Unexpected bracket';
        // check for expressions
        if (t === '(') {
            let branch = ['begin'];
            while (tok.length && tok.at(-1) !== ')')
                if (tok.at(-1) === '\n') tok.pop();
                else branch.push(parse(tok, true));
            if (tok.at(-1) !== ')') throw 'Missing ending bracket';
            tok.pop(); // pop end bracket
            if (branch.length === 2) return branch[1];
            return branch;
        }
        if (t[0] === 'key' || (t[0] === 'ref' && first)) {
            let branch = ['call', t[1]];
            while (tok.length && !'\n)'.includes(tok.at(-1))) branch.push(parse(tok));
            return branch;
        }
        // atom
        return t;
    }
}
//*/
