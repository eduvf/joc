export function std(evaluate) {
    return {
        '+': {
            type: 'function',
            value: (arg, env, line, msg) => {
                if (arg.length > 0) {
                    let first = evaluate(arg[0], env);
                    let type = first.type;
                    arg.shift();
                    return {
                        type: type,
                        value: arg.reduce((prev, curr) => {
                            curr = evaluate(curr, env);
                            if (curr.type !== type) {
                                msg.push(`[*] Type mismatch in function at line ${line}.`);
                                msg.push(`    Expected ${type}, got ${curr.type}. `);
                            }
                            return prev + curr.value;
                        }, first.value),
                    };
                }
                return { type: 'nothing' };
            },
        },
    };
}
