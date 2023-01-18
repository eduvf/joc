import { lex, parse, evaluate, show } from './joc.mjs';
import { std } from './lib.mjs';

let s1 = `
+ 1. (
    + 2. 3)
`;

console.log(show(evaluate(parse(lex('(' + s1 + ')')), [std(evaluate)])));
