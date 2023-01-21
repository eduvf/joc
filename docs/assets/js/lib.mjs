//@ts-check

/**
 * file: lib.mjs
 * repo: github.com/eduvf/joc
 */

//--------------------------------------------------------------

export function lib(interpret, log) {
    const std = {
        // print
        ';': (arg, env, line) => {
            arg = arg.map((a) => interpret(a, env));
            arg.map(log);
            return arg;
        },
        // add
        '+': (arg, env, line) => {
            arg = arg.map((a) => interpret(a, env));
            let type = typeof arg.at(0);
            return arg.reduce((prev, curr) => {
                if (typeof curr !== type) log(`[*] Type mismatch at line ${line}`);
                return prev + curr;
            }, 0);
        },
    };
    return [std];
}
