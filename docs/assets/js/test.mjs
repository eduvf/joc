import { joc } from './joc.mjs';

let s1 = `
; + 1 2 3
; 'hi'
; [1 2 3]
; [
    [1 2 3]
    [4 5 6]
    [7 8 9]
]
; [
    [
        [1 1 1]
        [2 2 2]
        [3 3 3]
    ]
    [
        [4 4 4]
        [5 5 5]
        [6 6 6]
    ]
    [
        [7 7 7]
        [8 8 8]
        [9 9 9]
    ]
]
`;

let s2 = `
: w 64 h 32
: curr <> w h ?? 0 1
: next ~ c =| 3 4 + <-> -1 0 1 <|> -1 0 1 c
win w h (
    bg 0
    @# x y curr ? ^ pix x y 0xfff
    . curr (next curr)
    zzz .1
)
`;

joc('(' + s1 + ')');
