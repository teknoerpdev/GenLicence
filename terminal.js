import io from 'socket.io-client';
import readline from 'readline';

let socket = new io('http://localhost')

let rl = readline.createInterface(
{
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => 
{
    if(input.split(' ')[0] == '-login')
    {
        let TmpParam = [];
        if(typeof input.split(' ')[3] == 'undefined')
            TmpParam.push(input.split(' ')[1],input.split(' ')[2])
        else
            TmpParam.push(input.split(' ')[1],input.split(' ')[2],input.split(' ')[3])
        
        socket.emit('login',TmpParam,(pResult) => 
        {
            
        });
    }
    else
    {
        socket.emit('terminal',input);   
    }    
});
socket.on('terminal',(pData) =>
{
    console.log(pData)
})
socket.on('disconnect',()=>
{
    socket.connect();
})