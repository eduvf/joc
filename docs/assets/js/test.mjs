import { joc } from './joc.mjs';

let s1 = `
: fact ~ n (
    ? (< 0 n) (
    * n (fact - n 1)
    ) 1
)

fact 10
`;

joc(s1);
