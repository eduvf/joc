import { joc } from './joc.mjs';
import { lib } from './lib.mjs';

let s1 = `
+ 1 2 3
`;

joc('(' + s1 + ')', lib());
