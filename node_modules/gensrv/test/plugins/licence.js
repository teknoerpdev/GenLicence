import {core} from '../../index.js'
import macid from 'node-machine-id'
import client from 'socket.io-client';
import moment from 'moment'
import path from 'path'
import download from 'download-git-repo'
import fs from 'fs-extra'

class licence
{
    constructor()
    {
        this.socket = null;
        this.core = core.instance;
        this.macid = macid.machineIdSync();
        this.path = path.resolve(path.dirname('')) + "\\plugins\\"
        this.data = [];
        this.status = false;
        this.host = 'http://172.16.97.250:8080'   
        
        this.connEvt = this.connEvt.bind(this)
        this.core.socket.on('connection',this.connEvt)
    }
    connEvt(pSocket)
    {
        pSocket.on('lic',async (pParam,pCallback) =>
        {
            let tmpCmd = pParam.cmd
            if(tmpCmd == 'get_macid')
            {
                pCallback(this.macid);
            }
            else if(tmpCmd == 'get_lic')
            {
                pCallback(this.data);
            }
            else if(tmpCmd == 'git_download')
            {
                pCallback(await this.setup(pParam.prm))
            }
        })
    }
    get()
    {
        return new Promise(resolve =>
        {
            this.socket = new client(this.host,{'timeout':2000, 'connect timeout': 2000})
            this.socket.on('connect', () => 
            {
                this.socket.emit('licence_check',{MacId:this.macid},async (pData) =>
                {
                    if(pData.length > 0)
                    {
                        this.data = pData
                        this.status = true
                        fs.writeFileSync(this.path + "lic",JSON.stringify(pData))
                        resolve(true)
                        return;
                    }
                    else
                    {
                        this.data = pData
                        this.status = false
                        resolve(false)
                        return;
                    }
                });
            });
            //EĞER LİSANS SUNUCUYA BAĞLANAMIYORSA 
            setTimeout(async ()=>
            {
                if(this.socket.connected)
                {
                    return;
                }

                try
                {
                    let tmpData = fs.readFileSync(this.path + "lic",{encoding:'utf8'});
                    this.data = JSON.parse(tmpData)
                    this.status = true;
                    resolve(true);
                    return;
                }
                catch (err) 
                {
                    this.data = [];
                    this.status = false;
                    resolve(false);
                    return;
                }
            },5000);
        });
    }
    getUserCount()
    {
        if(this.data.length > 0)
        {
            if(typeof this.data.find(x => x.APP === arguments[0]) != 'undefined')
            {
                return this.data.find(x => x.APP === arguments[0]).USER_COUNT;
            }
        }

        return 0;
    }
    setup(pPath)
    {
        return new Promise(resolve =>
        {
            download(pPath, 'tmp', async function (err) 
            {
                if(err != null || typeof err != 'undefined')
                {
                    resolve(err);
                }

                let tmpRoot = null;
                await fs.copySync('./tmp/setup','./setup');   

                if(fs.existsSync('./tmp/www') && fs.existsSync('./www'))
                {
                    tmpRoot = await fs.readdirSync('./tmp/www')
                    for (let i = 0; i < tmpRoot.length; i++) 
                    {
                        if(tmpRoot[i] != 'plugins')
                        {
                            await fs.copySync('./tmp/www/' + tmpRoot[i],'./www/' + tmpRoot[i]); 
                        }
                    }
                }
                if(fs.existsSync('./tmp/plugins') && fs.existsSync('./plugins'))
                {
                    tmpRoot = await fs.readdirSync('./tmp/plugins')
                    for (let i = 0; i < tmpRoot.length; i++) 
                    {
                        if(tmpRoot[i] != 'admin')
                        {
                            await fs.copySync('./tmp/plugins/' + tmpRoot[i],'./plugins/' + tmpRoot[i]);                  
                        }
                    }
                }
                if(fs.existsSync('./tmp/plugins/admin') && fs.existsSync('./plugins/admin'))
                {
                    tmpRoot = await fs.readdirSync('./tmp/plugins/admin')
                    for (let i = 0; i < tmpRoot.length; i++) 
                    {
                        if(tmpRoot[i] != 'access' || tmpRoot[i] != 'param')
                        {
                            await fs.copySync('./tmp/plugins/admin/' + tmpRoot[i],'./plugins/admin/' + tmpRoot[i]);                  
                        }
                    }
                }
                if(fs.existsSync('./tmp/www/plugins/admin/access') && fs.existsSync('./www/plugins/admin/access'))
                {
                    tmpRoot = await fs.readdirSync('./tmp/www/plugins/admin/access')
                    for (let i = 0; i < tmpRoot.length; i++) 
                    {
                        await fs.copySync('./tmp/www/plugins/admin/access/' + tmpRoot[i],'./www/plugins/admin/access/' + tmpRoot[i]);                  
                    }
                }
                if(fs.existsSync('./tmp/www/plugins/admin/param') && fs.existsSync('./www/plugins/admin/param'))
                {
                    tmpRoot = await fs.readdirSync('./tmp/www/plugins/admin/param')
                    for (let i = 0; i < tmpRoot.length; i++) 
                    {
                        await fs.copySync('./tmp/www/plugins/admin/param/' + tmpRoot[i],'./www/plugins/admin/param/' + tmpRoot[i]);                  
                    }
                }
                await fs.copySync('./tmp/package.json', './package.json');

                fs.rmdir('./tmp',{recursive:true})
                
                resolve('success')
            });
            
        })
    }
}
async function main()
{
    let tmpLic = new licence()
    //let stat = await tmpLic.check();
    await tmpLic.get()
    
    tmpLic.core.on('Logined',(pResult)=>
    {
        if(typeof pResult.socket.userInfo == 'undefined' || pResult.socket.userInfo.APP == 'ADMIN')
        {
            return;
        }
        //LISANS KONTROL EDILIYOR EĞER PROBLEM VARSA KULLANICI DISCONNECT EDİLİYOR.
        if(pResult.result.length > 0)
        {
            if(tmpLic.status)
            {
                if(tmpLic.getUserCount(pResult.socket.userInfo.APP) < tmpLic.core.socket.clients(pResult.socket.userInfo.APP).length)
                {
                    tmpLic.core.log.msg('Licensed user limit exceeded','Licence');
                    pResult.socket.emit('general',{id:"M001",data:"Licensed user limit exceeded"});
                    //pResult.socket.disconnect();
                    return;
                }
                else
                {
                    tmpLic.core.log.msg('Client connected to the WebSocket','Socket');
                }
            }
            else
            {
                tmpLic.core.log.msg('Waiting for response from license server','Licence');
                pResult.socket.emit('general',{id:"M001",data:"Waiting for response from license server"});
                //pResult.socket.disconnect();
                return;
            }
        }
        //***************************************************************************/
    })
    
    return tmpLic
}

export const _licence = main()