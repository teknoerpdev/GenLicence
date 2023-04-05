import {core} from '../index.js'
import config from './config.js'

let gensrv = new core(config);
gensrv.listen(config.port);