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

        const r = interpret(ast);
        if (debug) console.log('--> ' + r);
    } catch (error) {
        console.warn('[!] ' + error);
    }
}

function lex(code) {
    const token = /'(?:[\\].|[^\\'])*'|[(){}\[\]\n]|[^\s()]+/g;
    const number = /^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/;

    return code.match(token).map((t) => {
        if (t === '\n') return '\n';
        if ('([{}])'.includes(t)) return t;
        if (number.test(t)) return { lit: Number(t) };
        if (t.charAt(0) === "'") return { lit: t.slice(1, -1) };
        if (t === 'ok' || t === 'no') return { lit: t === 'ok' };
        return { ref: t };
    });
}

function brackets(tok) {
    let counter = [0, 0, 0]; // round, square, curly
    for (const t of tok) {
        if ('([{'.includes(t)) counter['([{'.indexOf(t)]++;
        if (')]}'.includes(t)) counter[')]}'.indexOf(t)]--;
    }
    if (!counter.every((n) => n === 0)) throw 'Brackets mismatch';
}

function parse(tok, head = true, end = false, tree = []) {
    while (tok.length > 0) {
        if (end && '\n)]}'.includes(tok[0])) break;

        const t = tok.shift();
        if (t === '\n') continue;
        if (')]}'.includes(t)) break;
        if ('([{'.includes(t)) {
            let branch = [parse(tok)];
            if (branch.length === 1) branch = branch[0];
            return parse(tok, false, end, tree.concat(branch));
        }
        if (head || /^[!-@|~]/.test(t.ref)) {
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
    '*': (...xs) => xs.reduce((a, b) => a * b),
    '%': (...xs) => xs.reduce((a, b) => a % b),
    '-': (...xs) => (xs.length !== 1 ? xs.reduce((a, b) => a - b) : -xs[0]),
    '/': (...xs) => (xs.length !== 1 ? xs.reduce((a, b) => a / b) : 1 / xs[0]),
    ';': (x) => (console.log(x), x),
    '::': (...xs) => [...xs],
    '->': (x) => x,
};

const core = {
    '.': ([_, ref, val], env) => {
        const name = ref.ref;
        if (!name) throw "Couldn't get reference for '.'";
        env[env.length - 1][name] = interpret(val, env);
    },
    '~': () => {},
    '?': ([_, ...ifthen], env) => {
        let r = null;
        while (ifthen.length)
            if ((r = interpret(ifthen.shift(), env)))
                return ifthen.length ? interpret(ifthen.shift(), env) : r;
            else ifthen.shift();
        return r;
    },
    '^': ([_, ...xs], env) => {
        env.push({});
        const r = interpret(xs, env);
        env.pop();
        return r;
    },
};

function get(sym, env, i = env.length - 1) {
    if (sym in env[i]) return env[i][sym];
    return i > 0 ? get(sym, env, i - 1) : null;
}

function interpret(node, env = [lib]) {
    if (Array.isArray(node)) {
        if (!node.length) return null;
        const head = node[0];
        if (head.ref in core) return core[head.ref](node, env);
        const list = node.map((x) => interpret(x, env));
        if (list[0] instanceof Function) {
            const [fn, ...args] = list;
            return fn(...args);
        }
        return list[list.length - 1];
    }
    if (node.ref) return get(node.ref, env);
    return node.lit;
}
