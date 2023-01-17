---
layout: default
permalink: index.html

title: home
header:
    title: joc
    subtitle: an&nbsp;all-in-one programming&nbsp;language
    desc: Take a <a href="#example">look</a>!
---

# joc

> Work In Progress

## example

```joc
: w 64 h 32
: curr <> w h ?? 0 1
: next ~ c =| (+ <-> -1 0 1 <|> -1 0 1 c) 3 4
win w h
    bg 0
    @ x y curr ? ^ pix x y col 0xfff
    . curr next curr
    zzz 1
```
