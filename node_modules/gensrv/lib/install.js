import fs from 'fs-extra'

if(!fs.existsSync('../../config.js'))
{
    fs.copy('./bin/config.js', '../../config.js', (err)=>
    {
        if(err != null)
            console.log(err)
    });
}
if(!fs.existsSync('../../server.js'))
{
    fs.copy('./bin/server.js', '../../server.js', (err)=>
    {
        if(err != null)
            console.log(err)
    });
}
if(!fs.existsSync('../../package.json'))
{
    fs.copy('./bin/package.json', '../../package.json', (err)=>
    {
        if(err != null)
            console.log(err)
    });
}
fs.copy('./bin/terminal.js', '../../terminal.js', (err)=>
{
    if(err != null)
        console.log(err)
});
fs.copy('./bin/core', '../../core', (err)=>
{
    if(err != null)
        console.log(err)
});
fs.copy('./bin/plugins', '../../plugins', (err)=>
{
    if(err != null)
        console.log(err)
});