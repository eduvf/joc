t0 = `
--(
    comment
--)

odd = n ~ (n == 0 ? no : even (n - 1))
even = n ~ (n == 0 ? ok : odd (n - 1))

even (30) ==? (30 -> even)

f = n ~ (n < 2
         ? 1
         : n * f (n - 1))

play ' (|: f# - a c'# | . a . f# | d d d .    | . . . c#
        |  d f# a c'# | . a . f# | e' - - e'b | c - . . :|)

f = n ~ (    -- new line after paren
    acc = 1
    i 1 n @ (acc *= i)
    acc
)

f = n ~
(            -- valid too
    acc = 1
    i 1 n @ (acc *= i)
    acc
)
`;
