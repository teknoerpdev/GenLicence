import io from 'socket.io-client';
import { core } from '../bin/www/core/core.js';

let x = new core(io('http://localhost'))
//console.log(x)