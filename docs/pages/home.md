---
layout: default
permalink: index.html

title: home
header:
    title: joc
    subtitle: an&nbsp;all-in-one programming&nbsp;language
    desc: '<i>e.g. factorial of a number:</i><br><b><code>: f ~ n * .. 1 n</code></b>'
---

> **WIP**

# joc

**joc** ([/ˈʒɔk/](https://en.wiktionary.org/wiki/joc) _lit. game_) is a programming language that combines ideas from different programming paradigms into a minimal framework for creative programming. It allows you to experiment different ways to solve a problem, while having tools to visualize and hear the result. _At the moment, this is just an ongoing personal project, so don't use it for anything serious yet!_

_joc_ has drawn inspiration from [Lua](<https://en.wikipedia.org/wiki/Lua_(programming_language)>), [Lisp](<https://en.wikipedia.org/wiki/Lisp_(programming_language)>) and [APL](<https://en.wikipedia.org/wiki/APL_(programming_language)>), just to name a few, and has some neat features that will ~~hopefully~~ make your life easier. These are:

-   concise and consistent syntax
-   built-in multimedia tools
-   extensible functionality

## overview

In order to illustrate **joc** expressiveness, let's take a look at three ways to calculate the [factorial](https://en.wikipedia.org/wiki/Factorial) of a number. We'll have to multiply all numbers from 1 to N (e.g. the factorial of 5 is 1 \* 2 \* 3 \* 4 \* 5 = 120).

### iterative

```joc
: factorial ~ n (
  : result 1
  @ (.. 1 + n 1) i (
    . result * result i
  )
  result
)
```

### recursive

```joc
: factorial ~ n (
  ? (< 0 n) (
    * n (factorial - n 1
  ) 1
)
```

### functional

```joc
: factorial ~ n * .. 1 n
```
