// @ts-check

export default function joc(code, debug = false) {
    try {
        const tokens = lex(code);
        if (debug) console.table(tokens);
    } catch (error) {
        console.warn('[!] joc : ' + error);
    }
}

function lex(code) {
    const token = /"(?:[\\].|[^\\"])*"|(?:--.*)|[(){}\[\]\n]|[^(){}\[\]\s]+/g;
    const number = /^(0b[01]+)|(0x[a-f\d]+)|([+-]?\d*\.?\d+(e[+-]?\d+)?)$/i;

    return code
        .match(token)
        .filter((t) => t.slice(0, 2) !== '--')
        .map((t) => {
            if ('\n([{}])'.includes(t)) return t;
            if (number.test(t)) return Number(t);
            if (t.charAt(0) === '"') return t.slice(0, -1);
            if (t === 'ok' || t === 'no') return t === 'ok';
            return t;
        });
}
