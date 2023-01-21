import { joc } from './joc.mjs';

let s1 = `
: x 2 y 3 z 4
: curr <> x y z ?? 0 1
`;

let s2 = `
: w 6 h 5
; : curr <> w h ?? 0 1
; . curr <-> -1 0 1 curr
; . curr <|> -1 0 1 curr
,; . curr + curr
,; . curr =| 3 4 curr
'done'
`;

let s3 = `
: w 64 h 32
: curr <> w h ?? 0 1
: next ~ c =| 3 4 + <-> -1 0 1 <|> -1 0 1 c
win w h (
    bg 0
    @# y x curr ? ^ pix x y 0xfff
    . curr (next curr)
    zzz .1
)
`;

joc('(' + s2 + ')');
