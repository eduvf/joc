import joc from './joc.mjs';

let test = `: f ~ n * .. 1 n`;

let test2 = `
: fib ~ n (
    ? (< n 2) n + (fib - n 1) (fib - n 2)
)
; ? (= (fib 8) 21) 'true' 'false'
fib 10
ok
`;

let test3 = `
+ 5 5
- 2 [2]
`;

let test4 = `
, . sum ~ x y + x y
. a 1
. b 2
+ a b
`;

joc(test4, true);
