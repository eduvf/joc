// @ts-check

let log = console.log;

export default function joc(code) {
    log(lex(code));
    console.dir(parse(lex(code)), { depth: null });
}

function lex(code) {
    let tok = ['('];
    let pos = 1;
    let char = code.charAt(0);

    const next = () => {
        if (char === '\n') tok.push('\n');
        return (char = code.charAt(pos++));
    };

    while (char) {
        // comment
        if (char === ',') while (next()) if (char === '\n') break;

        if ('([{}])'.includes(char)) {
            // bracket
            tok.push(char);
        } else if (char === "'") {
            // string
            const from = pos - 1;
            // advance until a non-escaped quote is found
            while (!(char !== '\\' && next() === "'")) if (!char) throw `[!] Unclosed string`;
            tok.push(code.slice(from, pos - 1));
        } else if (/\S/.test(char)) {
            // reference or number
            let t = char;
            // match everything except whitespace, commas, single quotes and brackets
            while (/[^\s,'()\[\]{}]/.test(next())) t += char;
            pos -= 1; // fix offset
            // check if boolean
            if (['ok', 'no'].includes(t)) t = t === 'ok';
            // check if number
            if (/^(-?\d*\.?\d+)|(0[xb][\dA-Fa-f]+)$/.test(t)) t = Number(t);
            tok.push(t);
        }
        next();
    }
    tok.push(')');
    return tok.reverse();
}

function parse(tok, line = 1, first = false) {
    if (!tok.length) return;

    let t;
    while ((t = tok.pop()) === '\n') line++;

    if (typeof t === 'boolean') return ['bool', t];
    if (typeof t === 'number') return ['num', t];
    if (t.charAt(0) === "'") return ['str', t.slice(1)];

    if ('([{'.includes(t)) {
        let list = [];
        const end = ')]}'.charAt('([{'.indexOf(t));
        while (tok.length && tok.at(-1) !== end)
            if (tok.at(-1) !== '\n') list.push(parse(tok, line, t === '('));
            else {
                tok.pop();
                line++;
            }
        if (!tok.length || tok.at(-1) !== end) throw `[!] Missing ending bracket '${end}'`;
        if (tok.length > 0) tok.pop(); // remove end bracket
        // simplify single expressions
        if (t === '(' && list.length === 1) return list[0];
        return [t, list];
    }
    if (')]}'.includes(t)) throw `[!] Unexpected closing bracket '${t}' at line ${line}`;

    if (/^[!-@|~]/.test(t) || first) {
        let args = [];
        while (tok.length && !'\n)]}'.includes(tok.at(-1))) {
            args.push(parse(tok, line));
        }
        return ['call', t, args];
    }
    return ['ref', t];
}

function compile(branch, pcode = []) {
    let b = branch[0];
    if (['bool', 'num', 'str'].includes(b)) {
        pcode.push(['ps', b, branch[1]]);
    } else if (b === 'ref') {
        pcode.push(['ld', branch[1]]);
    }
    /**
     * TODO
     */
}
