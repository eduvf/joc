import joc from './joc.mjs';

let t0 = `
+ 5 (5)
`;

let t1 = `
. i 0
@ (< i 10) (
    : i + i 1
)
; ? (= i 9) 'is' 'isn\\'t'
`;

let t2 = `
. f ~ n * .. 1 n
f 10

1 2 (-> 3 4
     -> 5 6)


(
    [{}]
)
`;

joc(t2, true);
