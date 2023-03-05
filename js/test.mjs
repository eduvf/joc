import joc from './joc.mjs';

let t0 = `
+ 5 (5)
hi 0
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

[1 2 3]
`;

let t3 = `
^ (
    . two 2
    + 1 - two * 3 / 4 5
    ; two
)
; two
? (- 1 1) 'oops' (no) 'almost' 'yeah'
`;

joc(t1, true);
