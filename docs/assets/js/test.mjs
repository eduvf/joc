import joc from './joc.mjs';

let s1 = `
: fact ~ n (
    ? (< 0 n) (
    * n (fact - n 1)
    ) 1
)

fact 10
`;

let s2 = `
: i 0 i2 0
@ (< i 10) (
    . i + i 1
    . i2 * i i
    ; i i2
)
`;

let s3 = `
+ 5 5
`;

let s4 = `
: fib ~ n (
    ? (< n 2) n + (fib - n 1) (fib - n 2)
)

@ (.. 1 10) i v (
    ; i v (fib i)
    ++ i
)
`;

joc(s4);
