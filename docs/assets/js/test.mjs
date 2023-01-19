import { joc, evaluate } from './joc.mjs';
import { std } from './lib.mjs';

let s1 = `
+ 1 2 3
`;

joc('(' + s1 + ')', [std(evaluate)]);
