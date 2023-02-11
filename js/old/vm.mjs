let test = [
    ['ps', 1],
    ['sv', 'r'],
    ['ps', 2],
    ['sv', 'i'],
    ['ld', 'i'],
    ['ps', 10],
    ['<=', null],
    ['jz', 9],
    ['ld', 'r'],
    ['ld', 'i'],
    ['*', null],
    ['sv', 'r'],
    ['ld', 'i'],
    ['ps', 1],
    ['+', null],
    ['sv', 'i'],
    ['jp', -13],
    ['ld', 'r'],
    ['fr', 'i'],
    ['fr', 'r'],
];

const fns = {
    '+': (x, y) => x + y,
    '*': (x, y) => x * y,
    '<=': (x, y) => x <= y,
};

function vm(bc) {
    let stack = [];
    let env = {};
    let ip = 0;

    while (ip < bc.length) {
        let ins = bc[ip][0];
        let arg = bc[ip][1];

        switch (ins) {
            case 'ps':
                stack.push(arg);
                break;
            case 'sv':
                env[arg] = stack.pop();
                break;
            case 'ld':
                stack.push(env[arg]);
                break;
            case 'fr':
                delete env[arg];
                break;
            case 'jp':
                ip += arg;
                break;
            case 'jz':
                if (!stack.pop()) ip += arg;
                break;
            default:
                let y = stack.pop();
                let x = stack.pop();
                let f = fns[ins];
                stack.push(f(x, y));
        }
        ip++;
    }
}

vm(test);
