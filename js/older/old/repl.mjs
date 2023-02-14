import readline from 'readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.setPrompt('--> ');
rl.prompt();
rl.on('line', (line) => {
    console.log(line);
    rl.prompt();
}).on('close', () => {
    console.log('\nBye!');
    process.exit(0);
});
