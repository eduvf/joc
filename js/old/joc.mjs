let log = console.log;

export default function joc(code, debug, output) {
    if (output) log = output;
    try {
        let tok = Array.from(lex('(' + code + ')')).reverse();
        if (debug) console.dir(tok, { depth: null });

        let ast = parse(tok);
        if (debug) console.dir(ast, { depth: null });
    } catch (error) {
        log(error);
    }
}

export function* lex(code) {
    let line = 1;
    let pos = 0;

    let char = code.charAt(0);
    const next = () => (char = code.charAt(++pos));

    while (char) {
        const c = char;

        if (c === ',') {
            // comment
            while (next() && char !== '\n');
        } else if (c === '\n') {
            // new line
            yield { type: c, line: ++line };
            next();
        } else if ('([{}])'.includes(c)) {
            // bracket
            yield { type: c, line: line };
            next();
        } else if (c === "'") {
            // string
            const from = pos + 1;
            const fromLine = line;
            let prev = c;
            // advance until a non-escaped quote is found
            while (next() && !(prev !== '\\' && char === c)) {
                if (char === '\n') line++;
                prev = char;
            }
            if (!char) {
                throw `[!] Unclosed string starting at line ${fromLine}`;
            }
            yield { type: 'str', val: code.slice(from, pos), line: fromLine };
            next(); // skip ending quote
        } else if (/\S/.test(c)) {
            // word, key or number
            const from = pos;
            // match everything except whitespace, commas, single quotes and brackets
            while (/[^\s,'()\[\]{}]/.test(next()));
            const t = code.slice(from, pos);
            if (/^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/.test(t)) {
                // number
                yield { type: 'num', val: Number(t), line: line };
            } else if (/^[!-@|~]/.test(t)) {
                // key
                yield { type: 'key', val: t, line: line };
            } else {
                // word
                yield { type: 'word', val: t, line: line };
            }
        } else {
            // ignore everything else
            next();
        }
    }
}

export function parse(tok, first) {
    let t;
    // get token (or undefined if 'tok' is empty)
    while ((t = tok.pop())) {
        // ignore extra lines
        if (t.type === '\n') continue;

        // keys (anywhere) and words (starting a line) create
        // expressions that run until the end of the line or
        // the next closing bracket
        if (t.type === 'key' || (first && t.type === 'word')) {
            let list = [];
            while (tok.length > 0 && !'\n)]}'.includes(tok.at(-1).type)) {
                list.push(parse(tok));
            }
            return { type: 'call', fn: t.val, arg: list, line: t.line };
        } else if ('([{'.includes(t.type)) {
            let list = [];
            const end = ')]}'.charAt('([{'.indexOf(t.type));
            while (tok.length > 0 && tok.at(-1).type !== end) {
                tok.at(-1).type === '\n'
                    ? tok.pop() // ignore extra new lines
                    : list.push(parse(tok, t.type === '('));
            }
            if (tok.length > 0 && tok.at(-1).type !== end) {
                log(`[!] Missing ending bracket '${end}' for list starting at line ${t.line}`);
                return;
            }
            if (tok.length > 0) tok.pop(); // remove end bracket
            // simplify single expressions
            if (t.type === '(' && list.length === 1) return list[0];
            return { type: t.type, val: list, line: t.line };
        } else if ('}])'.includes(t.type)) {
            log(`[!] Unexpected closing bracket '${t.type}' at line ${t.line}`);
            return;
        }
        return t;
    }
}

export function validate(node, env = [{}]) {
    if (node.type === 'word') {
        // search from inner to outer scope
        for (let i = env.length; i >= 0; i--) {
            if (node.val in env[i]) return env[i][node.val];
        }
        throw `[!] Cannot find a value for '${node.val}' at line ${node.line}`;
    }
}