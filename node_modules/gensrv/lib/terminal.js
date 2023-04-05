import readline from 'readline'
import {core} from './core.js'

export default class terminal
{
    constructor()
    {
        this.rl = readline.createInterface(
        {
            input: process.stdin,
            output: process.stdout
        });
        this.rl.on('line', (input) => 
        {
            this.command(input);
        });

        this.connEvt = this.connEvt.bind(this)
        core.instance.socket.on('connection',this.connEvt); 
    }
    connEvt(pSocket)
    {
        pSocket.on('terminal',async (pParam,pCallback) =>
        {
            if(pParam == '-try' || pParam.split(' ')[0] == '-createDb' || pSocket.authState('Administrator').id == 0)
            {
                if(typeof pCallback != 'undefined')
                {
                    pCallback(await this.command(pParam))
                }
                else
                {
                    this.command(pParam)
                }
            }
        }) 
    }
    async command(pInput)
    {
        let TmpInput = pInput.split(' ')[0];
        
        if(TmpInput == "-try")
        {
            return await core.instance.sql.try()
        }
        else if(TmpInput == "-log")
        {
            if(pInput.split(' ').length > 1)
            {
                let TmpFileName = ""
                let TmpObj = {};

                if(pInput.split(' ')[1] != '')
                {
                    TmpFileName = pInput.split(' ')[1];
                }
                if(typeof pInput.split(' ')[2] != 'undefined' && pInput.split(' ')[2] != '')
                {
                    try
                    {
                        TmpObj = JSON.parse(pInput.split(' ')[2])                   
                    } catch(err) {}
                }
                core.instance.log.readLog(TmpFileName,TmpObj);
            }
            else
            {
                core.instance.log.readLog();
            }
        }
        else if(TmpInput == "-createDb")
        {
            if(pInput.split(' ').length > 1)
            {
                return await core.instance.sql.createDb(pInput.split(' ')[1]);
            }
        }
        else
        {
            core.instance.log.msg('Invalid command !',"Terminal");
        }
    }
}