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
: fact ~ n (
  ? (< 0 n) (
    * n (fact - n 1)
  ) 1
)

fact 10
```
