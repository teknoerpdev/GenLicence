import { isProxy } from 'is-proxy';
//********* USE JSSTORE  *****************/
//import {Connection} from 'jsstore';
//import { jsworker } from './jsworker.js';
//****************************************/
import moment from 'moment';

export class core
{        
    static instance = null;

    constructor(pIo)
    {   
        if(!core.instance)
        {
            core.instance = this;
        }
        
        try
        {
            this.socket = pIo;
        }
        catch (error) {}

        if(typeof this.socket == 'undefined')
        {
            console.log("socket not defined")
            return;
        }
        
        this.offline = false;
        this.listeners = Object();        
        this.sql = new sql();
        this.local = new local();
        this.auth = new auth();
        this.util = new util();                

        this.ioEvents();        
    }    
    ioEvents()
    {
        this.socket.on('connect',() => 
        {
            this.emit('connect',()=>{})
        });
        this.socket.on('connect_error',(error) => 
        {
            this.emit('connect_error',()=>{})
        });
        this.socket.on('error', (error) => 
        {
            this.emit('connect_error',()=>{})
        });
        this.socket.on('disconnect', () => 
        {
            this.emit('disconnect',()=>{})
        });
    }
    //#region  "EVENT"
    on(pEvt, pCallback) 
    {
        if (!this.listeners.hasOwnProperty(pEvt))
        this.listeners[pEvt] = Array();

        this.listeners[pEvt].push(pCallback); 
    }
    emit(pEvt, pParams)
    {
        if (pEvt in this.listeners) 
        {
            let callbacks = this.listeners[pEvt];
            for (var x in callbacks)
            {
                callbacks[x](pParams);
            }
        } 
    }
    //#endregion
}
export class sql 
{
    constructor()
    {
        this.query = "";        
    }
    try()
    {
        return new Promise(resolve => 
        {
            core.instance.socket.emit('terminal','-try',(pResult) => 
            {
                resolve(pResult);
            });
        });
    }
    createDb()
    {
        return new Promise(resolve => 
        {
            core.instance.socket.emit('terminal','-createDb ' + arguments[0],(pResult) => 
            {
                resolve(pResult);
            });
        });        
    }
    execute()
    {    
        return new Promise(async resolve => 
        {
            core.instance.emit('onExecuting');
            
            let TmpQuery = ""
            if(typeof arguments[0] == 'undefined')
            {
                TmpQuery = this.query
            }
            else
            {
                TmpQuery = arguments[0];
            }
            
            //LOCALDB İÇİN YAPILDI. ALI KEMAL KARACA 28.02.2022
            if(core.instance.offline)
            {
                core.instance.emit('onExecuted');
                resolve(await core.instance.local.execute(TmpQuery));                
            }
            else
            {
                //PARAMETRE UNDEFINED CONTROL
                if(typeof(TmpQuery.value) != 'undefined')
                {
                    for (let i = 0; i < TmpQuery.value.length; i++) 
                    {
                        if(typeof TmpQuery.value[i] == 'undefined')
                        {
                            core.instance.emit('onExecuted');
                            resolve({result : {err: "Parametre değerlerinde problem oluştu ! "}})
                        }
                    }
                }
                core.instance.socket.emit('sql',TmpQuery,(data) =>
                {
                    core.instance.emit('onExecuted');
                    if(typeof data.auth_err == 'undefined')
                    {
                        resolve(data); 
                    }
                    else
                    {
                        //BURADA HATA SAYFASINA YÖNLENDİRME ÇALIŞACAK. /edit r.k İNŞALLAH :)
                        console.log(data.auth_err);
                        resolve([]);
                    }
                });
            }
        });
    }
}
export class local
{
    constructor()
    {
        const getWorkerPath = () => 
        {
            if (process.env.NODE_ENV === 'development') 
            {
                return require("file-loader?name=scripts/[name].[hash].js!jsstore/dist/jsstore.worker.js");
            }
            else 
            {
                return require("file-loader?name=scripts/[name].[hash].js!jsstore/dist/jsstore.worker.min.js");
            }
        };
        if(typeof Connection != 'undefined')
        {
            this.conn = new Connection(new Worker(getWorkerPath().default));
        }
    }
    async init(pDb)
    {
        return new Promise(async resolve => 
        {
            if(typeof this.conn != 'undefined')
            {
                let tmpResult = await this.conn.initDb(pDb)
                
                if(tmpResult)
                {
                    console.log('Database created and connection is opened')
                    resolve(true)
                }
                else
                {
                    console.log('Connection is opened')
                    resolve(true)
                }
            }
            else
            {
                console.log('jsstore is undefined')
            }
            resolve(false)
        });
    }
    async insert(pQuery)
    {
        return new Promise(async resolve => 
        {
            if(typeof this.conn != 'undefined')
            {
                //BURAYA ONLINE SORGUSU İLE QUERY GÖNDERİLEBİLİR ONUN İÇİN LOCAL KONTROL VAR. (pQuery.local != 'undefined' ? pQuery.local : pQuery)
                let tmpResult = await this.conn.insert(typeof pQuery.local != 'undefined' ? pQuery.local : pQuery)
                if(tmpResult > 0)
                {
                    resolve({result:{state:true}})
                }
            }
            else
            {
                console.log('jsstore is undefined')
            }
            resolve({result:{state:false}})
        });
    }
    async select(pQuery)
    {
        return new Promise(async resolve => 
        {
            if(typeof this.conn != 'undefined')
            {
                //BURAYA ONLINE SORGUSU İLE QUERY GÖNDERİLEBİLİR ONUN İÇİN LOCAL KONTROL VAR. (pQuery.local != 'undefined' ? pQuery.local : pQuery)
                let tmpResult = await this.conn.select(typeof pQuery.local != 'undefined' ? pQuery.local : pQuery); 
                if(tmpResult.length > 0)
                {
                    resolve({result:tmpResult})
                }
            }
            else
            {
                console.log('jsstore is undefined')
            }
            resolve({result:[]})
        });
    }
    async update(pQuery)
    {
        return new Promise(async resolve => 
        {
            if(typeof this.conn != 'undefined')
            {
                //BURAYA ONLINE SORGUSU İLE QUERY GÖNDERİLEBİLİR ONUN İÇİN LOCAL KONTROL VAR. (pQuery.local != 'undefined' ? pQuery.local : pQuery)
                let tmpResult = await this.conn.update(typeof pQuery.local != 'undefined' ? pQuery.local : pQuery)
                if(tmpResult > 0)
                {
                    resolve({result:{state:true}})
                }
            }
            else
            {
                console.log('jsstore is undefined')
            }
            resolve({result:{state:false}});
        });
    }
    async remove(pQuery)
    {
        return new Promise(async resolve => 
        {
            if(typeof this.conn != 'undefined')
            {
                //BURAYA ONLINE SORGUSU İLE QUERY GÖNDERİLEBİLİR ONUN İÇİN LOCAL KONTROL VAR. (pQuery.local != 'undefined' ? pQuery.local : pQuery)
                let tmpResult = await this.conn.remove(typeof pQuery.local != 'undefined' ? pQuery.local : pQuery)
                if(tmpResult > 0)
                {
                    resolve({result:{state:true}})
                }
            }
            else
            {
                console.log('jsstore is undefined')
            }
            resolve({result:{state:false}});
        });
    }
    async execute(pQuery)
    {
        //DÜZENLEME - ALI KEMAL KARACA 23.08.2022
        return new Promise(async resolve => 
        {
            if(Array.isArray(pQuery))
            {
                let tmpQuery = pQuery
                for (let i = 0; i < tmpQuery.length; i++) 
                {
                    if(typeof tmpQuery[i].local != 'undefined')
                    {
                        let tmpLocs = Array.isArray(tmpQuery[i].local) ? tmpQuery[i].local : [tmpQuery[i].local]
                        tmpLocs.forEach(async pItem => 
                        {
                            if(pItem.type == 'insert')
                            {                                        
                                await this.insert(pItem);
                            } 
                            else if(pItem.type == 'update')
                            {                                        
                                await this.update(pItem);
                            } 
                            else if(pItem.type == 'delete')
                            {                     
                                await this.remove(pItem);
                            }      
                        });
                    }
                }
                resolve({result:{state:true}})
            }
            else
            {
                if(typeof pQuery.local != 'undefined')
                {
                    if(pQuery.local.type == 'select')
                    {
                        let tmpData = await this.select(pQuery.local)
                        let tmpResult = {result:{recordset:tmpData.result}}
                        resolve(tmpResult)
                    }
                    else if(pQuery.local.type == 'insert')
                    {
                        resolve(await this.insert(pQuery.local))
                    } 
                    else if(pQuery.local.type == 'update')
                    {
                        resolve(await this.update(pQuery.local))
                    } 
                    else if(pQuery.local.type == 'delete')
                    {
                        resolve(await this.remove(pQuery.local))
                    }                       
                }
                resolve({result:{}});
            }
        });        
    }
    clearTbl(pTblName)
    {
        return new Promise(async resolve => 
        {
            await this.conn.clear(pTblName);
            resolve()
        });
    }
    dropDb()
    {
        return new Promise(async resolve => 
        {
            this.conn.dropDb().then(async function() 
            {
                console.log('Db deleted successfully');
                resolve(true)                
            }).catch(function(error) 
            {                
                console.log(error);
                resolve(false)
            });    
        });
    }
}
export class auth 
{
    constructor()
    {
        this.data = null
    }
    login()
    {
        return new Promise(async resolve => 
        {
            let tmpData = []
            let tmpLocWhere = {}
            if(arguments.length == 2)
            {
                tmpData.push(arguments[0],arguments[1])
                tmpLocWhere = {SHA:arguments[0]}
            }
            else if(arguments.length == 3)
            {
                tmpData.push(arguments[0],arguments[1],arguments[2])
                tmpLocWhere = {CODE:arguments[0],PWD:btoa(arguments[1])}
            }
            //LOCAL DB İÇİN YAPILDI
            if(core.instance.offline)
            {
                let tmpData = await core.instance.local.select({from:"USERS",where:tmpLocWhere})

                if(tmpData.result.length > 0)
                {
                    this.data = tmpData.result[0]
                    if(typeof window != 'undefined')
                        window.sessionStorage.setItem('auth',tmpData.result[0].SHA)

                    resolve(true)
                    return
                }
                else 
                {
                    if(typeof window != 'undefined')
                        window.sessionStorage.removeItem('auth')
                    
                    this.data = null
                    resolve(false)
                    return
                }
            }
            /************************************************************************************ */
            core.instance.socket.emit('login',tmpData,async (data) =>
            {
                if(data.length > 0)
                {
                    this.data = data[0]
                    if(typeof window != 'undefined')
                        window.sessionStorage.setItem('auth',data[0].SHA)

                    resolve(true)
                }
                else 
                {
                    if(typeof window != 'undefined')
                        window.sessionStorage.removeItem('auth')
                    
                    this.data = null
                    resolve(false)
                }
            });
        })
    }
    getUserList()
    {
        return new Promise(async resolve => 
        {   
            //LOCAL DB İÇİN YAPILDI
            if(core.instance.offline)
            {
                let tmpData = await core.instance.local.select({from:"USERS"})
                if(tmpData.result.length > 0)
                {                   
                    resolve(tmpData.result)
                    return
                }
                else 
                {
                    resolve([])
                    return
                }
            }
            /************************************************************************************ */
            core.instance.socket.emit('getUserList',async (data) =>
            {
                if(data.length > 0)
                {
                    resolve(data)
                }
                else 
                {
                    resolve([])
                }
            });
        })
    }
    refreshToken(pGuid)
    {
        core.instance.socket.emit('refreshToken',[pGuid])
    }
    logout()
    {
        window.sessionStorage.removeItem('auth');
    }
}
export class util
{
    constructor()
    {
        this.core = core.instance;
        this.logPath = ""
    }
    folder_list(pPath)
    {
        return new Promise(resolve => 
        {
            this.core.socket.emit('util',{cmd:'folder_list',prm: pPath},(data) =>
            {
                resolve(data)
            });
        });
    }
    readFile(pPath)
    {
        return new Promise(resolve => 
        {
            this.core.socket.emit('util',{cmd:'read_file',prm: pPath},(data) =>
            {
                resolve(data)
            });
        });
    }
    writeFile(pPath,pData)
    {
        return new Promise(resolve => 
        {
            this.core.socket.emit('util',{cmd:'write_file',prm: {path:pPath,data:pData}},(data) =>
            {
                resolve(data)
            });
        });
    }
    waitUntil()
    {
        return new Promise(async resolve => 
        {
            setTimeout(() => 
            {
                resolve()
            }, typeof arguments[0] == 'undefined' ? 0 : arguments[0]);
        })
    }
    isElectron() 
    {
        // Renderer process
        if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
            return true;
        }
    
        // Main process
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
            return true;
        }
    
        // Detect the user agent when the `nodeIntegration` option is set to true
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }
    
        return false;
    }
    writeLog(pMsg,pPath)
    {
        return new Promise(resolve => 
        {
            let tmpPath = this.logPath
            if(typeof pPath != 'undefined')
            {
                tmpPath = pPath
            }

            if(tmpPath != "")
            {
                this.core.socket.emit('util',{cmd:'write_log',prm: {path:tmpPath,data:moment(new Date()).format("YYYY-MM-DD HH:mm:ss SSS") + " - " + pMsg + "\n"}},(data) =>
                {
                    resolve(data)
                });
            }
            else
            {
                resolve(false)
            }
        });
    }
}
export class dataset
{    
    constructor(pName)
    {
        this.listeners = Object();
        this.sql = core.instance.sql;    

        if(typeof pName == 'undefined')
            this.name = pName;
        else
            this.name = 'dataset'
        
        this.dts = [];
    }
    //#region  "EVENT"
    on(pEvt,pCallback) 
    {
        for(let i = 0;i < this.length; i++)
        {
            let tmpName = this.get(i).name;
            if(typeof this.listeners[tmpName] == 'undefined')
            {
                this.listeners[tmpName] = {}
            }

            if (!this.listeners[tmpName].hasOwnProperty(pEvt))
            {
                this.listeners[tmpName][pEvt] = Array();
                this.listeners[tmpName][pEvt].push(pCallback); 
            }
        }
    }
    emit(pEvt,pName,pParams)
    {
        let tmpListener = this.listeners[pName]
        
        if (typeof tmpListener != 'undefined' && pEvt in tmpListener) 
        {
            let callbacks = this.listeners[pName][pEvt];
            for (var x in callbacks)
            {
                callbacks[x](pName,pParams);
            }
        } 
    }
    //#endregion
    get length()
    {
        return this.dts.length;
    }
    get()
    {
        //PARAMETRE OLARAK INDEX YADA TABLO ADI.
        if(arguments.length > 0 && typeof arguments[0] == 'string')
        {
            return this.dts.find(x => x.name == arguments[0])
        }
        else if (arguments.length > 0 && typeof arguments[0] == 'number')
        {
            return this.dts[arguments[0]]
        }

        return
    }
    async add(pTable)
    {
        if(typeof pTable != 'undefined')
        {
            let tmpDt = null
            if(typeof pTable == 'string')
            {
                tmpDt = new datatable(pTable)
            }
            else if(typeof pTable == 'object')
            {
                tmpDt = pTable;
            }
            
            tmpDt.on('onNew',async (e)=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onNew',tmpDt.name,e)
            })
            tmpDt.on('onAddRow',async (e)=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onAddRow',tmpDt.name,e)
            })
            tmpDt.on('onEdit',async (e)=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onEdit',tmpDt.name,e)
            })
            tmpDt.on('onRefresh',async ()=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onRefresh',tmpDt.name)
            })
            tmpDt.on('onClear',async ()=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onClear',tmpDt.name)
            })
            tmpDt.on('onDelete',async ()=>
            {
                await core.instance.util.waitUntil(0)
                this.emit('onDelete',tmpDt.name)
            })
            
            this.remove(tmpDt.name)
            this.dts.push(tmpDt)

        }
    }
    update()
    {
        return new Promise(async resolve => 
        {
            let tmpQuerys = [];

            for (let i = 0; i < this.length; i++) 
            {
                let tmp = this.get(i).toCommands();
                tmp.forEach(e => 
                {
                    tmpQuerys.push(e)    
                });
            }
            
            let tmpResult = await this.sql.execute(tmpQuerys)
            if(typeof tmpResult.result.err == 'undefined')
            {             
                tmpQuerys.forEach(x =>
                {
                    if(x.rowData.stat == 'editing' || x.rowData.stat == 'newing')
                    {
                        Object.setPrototypeOf(x.rowData,{stat:''})
                    }
                })        

                // for (let i = 0; i < this.length; i++) 
                // {
                //     let tmp = this.get(i);
                //     tmp.forEach(e => 
                //     {      
                //         Object.setPrototypeOf(e,{stat:''})   
                //     });
                // }

                resolve(0)
            }
            else
            {
                console.log(tmpResult.result.err)
                tmpQuerys.forEach(x =>
                {
                    if(x.rowData.stat == 'editing' || x.rowData.stat == 'newing')
                    {
                        Object.setPrototypeOf(x.rowData,{stat:''})
                    }
                })  
                resolve(1)
            } 
        });
    }
    async delete()
    {
        for (let i = 0; i < this.length; i++) 
        {
            await this.get(i).delete()
        }
    }
    remove(pName)
    {
        
        //EĞER PARAMETRE BOŞ GÖNDERİLİRSE TÜM DATASET TEMİZLENİYOR.
        if(typeof pName != 'undefined')
        {
            for (let i = 0; i < this.dts.length; i++) 
            {
                if(this.dts[i].name == pName)
                {
                    this.listeners[pName] = {}
                    this.dts.splice(i,1);
                }
            }
        }
        else
        {
            this.dts.splice(0,this.dts.length);
        }
    }
}
export class datatable
{    
    constructor()
    {        
        this.selectCmd;
        this.insertCmd;
        this.updateCmd;
        this.deleteCmd;

        this._deleteList = [];
        this._groupList = [];
        //EDİT SIRASINDA DEĞİŞTİĞİNİ ALGILAMAMASINI İSTEDİĞİN KOLON LİSTESİ.
        this.noColumnEdit = []
        this.listeners = Object();
        this.sql = core.instance.sql;        

        if(arguments.length == 1 && typeof arguments[0] == 'string')
        {
            this.name = arguments[0];
        }
        else if(arguments.length == 1 && arguments[0] instanceof sql)
        {
            this.sql = arguments[0];
        }
        else if(arguments.length == 2 && typeof arguments[0] == 'string' && arguments[1] instanceof sql)
        {
            this.name = arguments[0];
            this.sql = arguments[1];
        }
        else
        {
            this.name = '';
        }
    }  
    static uuidv4() 
    {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        ).toString().toUpperCase();
    }   
    //#region  "EVENT"
    on(pEvt, pCallback) 
    {
        if (!this.listeners.hasOwnProperty(pEvt))
            this.listeners[pEvt] = Array();
            this.listeners[pEvt].push(pCallback); 
    }
    emit(pEvt, pParams)
    {
        if (pEvt in this.listeners) 
        {
            let callbacks = this.listeners[pEvt];
            for (var x in callbacks)
            {
                callbacks[x](pParams);
            }
        } 
    }
    //#endregion
    push(pItem,pIsNew)
    {            
        if(!isProxy(pItem))
        {
            pItem = new Proxy(pItem, 
            {
                get: function(target, prop, receiver) 
                {
                    return target[prop];
                },
                set: (function(target, prop, receiver) 
                {            
                    if(target[prop] != receiver)
                    {
                        target[prop] = receiver
    
                        if(typeof this.noColumnEdit.find(x => x == prop) == 'undefined')
                        {
                            this.emit('onEdit',{data:{[prop]:receiver},rowIndex:this.findIndex(x => x === pItem),rowData:pItem});
                            
                            //EĞER EDİT EDİLDİĞİNDE STATE DURUMUNUN DEĞİŞMEMESİNİ İSTEDİĞİN KOLON VARSA BURDA KONTROL EDİLİYOR
                            if(target.stat != 'new')
                            {
                                //EDİT EDİLMİŞ KOLON VARSA BURDA editColumn DEĞİŞKENİNE SET EDİLİYOR.
                                let tmpColumn = []
                                if(typeof target.editColumn != 'undefined')
                                {
                                    tmpColumn = [...target.editColumn];
                                }
                                tmpColumn.push(prop)
                                Object.setPrototypeOf(target,{stat:'edit',editColumn:tmpColumn})   
                            }
                        }
                    }
                    //return target[prop];
                    return true;
                }).bind(this)
            });
        }
        
        if(typeof pIsNew == 'undefined' || pIsNew)
        {
            Object.setPrototypeOf(pItem,{stat:'new'})
            this.emit('onNew',pItem)
        }
        this.emit('onAddRow',pItem);
        super.push(pItem)
    }
    getIndexByKey(pKey)
    {
        let tmpArr = [];
        for (let i = 0; i < this.length; i++) 
        {
            tmpArr.push(Object.assign({}, this[i]))
        }
        for (let i = 0; i < tmpArr.length; i++) 
        {
            if(JSON.stringify(tmpArr[i]) == JSON.stringify(Object.assign({}, pKey)))
            {
                return i
            }
        }
    }
    removeAt()
    {
        let tmpIndex = -1;
        if(arguments.length > 0 && typeof arguments[0] == 'object')
        {
            tmpIndex = this.getIndexByKey(arguments[0]);
        }
        else if(arguments.length > 0 && typeof arguments[0] == 'number')
        {
            tmpIndex = arguments[0]
        }

        if(tmpIndex > -1)
        {
            this._deleteList.push(this[tmpIndex]); 
            this.splice(tmpIndex,1);
            this.emit('onDelete');
        }
    }
    clear()
    {
        this.splice(0,this.length);
        this._deleteList.splice(0,this._deleteList.length);
        this.emit('onClear')
    }
    refresh()
    {
        return new Promise(async resolve => 
        {
            if(typeof this.selectCmd != 'undefined')
            {
                let tmpQuery = JSON.parse(JSON.stringify(this.selectCmd))
                //LOCAL DB İÇİN YAPILDI. WHERE ŞARTINDA {index} ŞEKLİNDE DEĞER ATAMASI... ALI KEMAL KARACA - 22.08.2022 
                if(typeof tmpQuery.local != 'undefined' && typeof tmpQuery.local.where != 'undefined' && typeof tmpQuery.param != 'undefined')
                {
                    let tmpLocStr = JSON.stringify(tmpQuery.local.where)
                    for (let i = 0; i < tmpQuery.param.length; i++) 
                    {
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                        tmpLocStr = tmpLocStr.replace("{" + i + "}",tmpQuery.value[i])
                    }
                    tmpQuery.local.where = JSON.parse(tmpLocStr)
                }                
                
                let TmpData = await this.sql.execute(tmpQuery)
                
                if(typeof TmpData.result.err == 'undefined') 
                {
                    if(typeof TmpData.result.recordset != 'undefined')
                    {
                        this.clear();
                        for (let i = 0; i < TmpData.result.recordset.length; i++) 
                        {                    
                            this.push(TmpData.result.recordset[i],false)   
                        }                                            
                        this.emit('onRefresh')
                    }
                }
                else
                {
                    console.log(TmpData.result.err)
                }                
            }
            resolve();
        });
    }
    toCommands()
    {
        let tmpStat = ['new','edit']
        let tmpQueryList = [];

        if(typeof arguments[0] != 'undefined' && arguments[0] != '')
        {
            tmpStat = arguments[0].split(',')
        }

        for (let i = 0; i < this.length; i++) 
        {
            if(typeof this[i].stat != 'undefined' && typeof tmpStat.find(x => x == this[i].stat))
            {
                let tmpQuery = undefined;

                if(this[i].stat == 'new')
                {
                    tmpQuery = JSON.parse(JSON.stringify(this.insertCmd))
                    Object.setPrototypeOf(this[i],{stat:'newing'})
                    //LOCALDB İÇİN YAPILDI. ALI KEMAL KARACA 28.02.2022
                    if(core.instance.offline && typeof tmpQuery.local != 'undefined' && typeof tmpQuery.local.values != 'undefined' && tmpQuery.local.values.length > 0)
                    {                        
                        for (let x = 0; x < Object.keys(tmpQuery.local.values[0]).length; x++) 
                        {
                            let tmpKey = Object.keys(tmpQuery.local.values[0])[x]
                            let tmpMap = Object.values(tmpQuery.local.values[0])[x]
                            
                            if(typeof tmpMap.map != 'undefined')
                            {
                                if(typeof tmpMap.type != 'undefined' && tmpMap.type == 'date_time')
                                {
                                    tmpQuery.local.values[0][tmpKey] = new Date(this[i][tmpMap.map])
                                }
                                else
                                {
                                    tmpQuery.local.values[0][tmpKey] = this[i][tmpMap.map]  
                                }
                            }
                            else
                            {
                                tmpQuery.local.values[0][tmpKey] = tmpMap
                            }
                        }
                    }
                }
                else if(this[i].stat == 'edit')
                {
                    tmpQuery = JSON.parse(JSON.stringify(this.updateCmd))
                    Object.setPrototypeOf(this[i],{stat:'editing'})
                    //LOCALDB İÇİN YAPILDI. ALI KEMAL KARACA 28.02.2022
                    if(core.instance.offline && typeof tmpQuery.local != 'undefined' && typeof tmpQuery.local.set != 'undefined')
                    {
                        //SET
                        for (let x = 0; x < Object.keys(tmpQuery.local.set).length; x++) 
                        {                            
                            let tmpKey = Object.keys(tmpQuery.local.set)[x]
                            let tmpMap = Object.values(tmpQuery.local.set)[x]
                            
                            if(typeof tmpMap.map != 'undefined')
                            {
                                if(typeof tmpMap.type != 'undefined' && tmpMap.type == 'date_time')
                                {
                                    tmpQuery.local.set[tmpKey] = new Date(this[i][tmpMap.map])
                                }
                                else
                                {
                                    tmpQuery.local.set[tmpKey] = this[i][tmpMap.map]
                                }                                
                            }
                            else
                            {
                                tmpQuery.local.set[tmpKey] = tmpMap
                            }
                        }
                        
                    }
                    //LOCALDB İÇİN YAPILDI. ALI KEMAL KARACA 28.02.2022
                    if(core.instance.offline && typeof tmpQuery.local != 'undefined' && typeof tmpQuery.local.where != 'undefined')
                    {
                        //WHERE
                        for (let x = 0; x < Object.keys(tmpQuery.local.where).length; x++) 
                        {
                            let tmpKey = Object.keys(tmpQuery.local.where)[x]
                            let tmpMap = Object.values(tmpQuery.local.where)[x]

                            if(typeof tmpMap.map != 'undefined')
                            {
                                if(typeof tmpMap.type != 'undefined' && tmpMap.type == 'date_time')
                                {
                                    tmpQuery.local.where[tmpKey] = new Date(this[i][tmpMap.map])
                                }
                                else
                                {
                                    tmpQuery.local.where[tmpKey] = this[i][tmpMap.map]
                                }        
                            }
                            else
                            {
                                tmpQuery.local.where[tmpKey] = tmpMap
                            }
                        }
                    }
                }
            
                if(typeof tmpQuery != 'undefined')
                {
                    tmpQuery.value = [];
                } 
                
                if(typeof tmpQuery != 'undefined')
                {
                    if(typeof tmpQuery.param == 'undefined')
                    {
                        continue;
                    }
                    for (let m = 0; m < tmpQuery.param.length; m++) 
                    {         
                        if(typeof tmpQuery.dataprm == 'undefined')
                        {
                            tmpQuery.value.push(this[i][tmpQuery.param[m].split(':')[0]]);
                        }
                        else
                        {
                            tmpQuery.value.push(this[i][tmpQuery.dataprm[m]]);
                        }                                                       
                    }
                }
                if(typeof tmpQuery != 'undefined' && typeof tmpQuery.value != 'undefined' && tmpQuery.value.length > 0)
                {       
                    tmpQuery.rowData = this[i]
                    tmpQueryList.push(tmpQuery)
                }
            }
        }

        return tmpQueryList;
    }
    update()
    {
        return new Promise(async resolve => 
        {
            let tmpQuerys = undefined;
            
            if(typeof arguments[0] == 'undefined' || arguments[0] == '')
            {
                tmpQuerys = this.toCommands();
            }
            else
            {
                tmpQuerys = this.toCommands(arguments[0]);
            }                        

            let tmpResult = await this.sql.execute(tmpQuerys)
            if(typeof tmpResult.result.err == 'undefined')
            {     
                tmpQuerys.forEach(x =>
                {
                    if(x.rowData.stat == 'editing' || x.rowData.stat == 'newing')
                    {
                        Object.setPrototypeOf(x.rowData,{stat:''})
                    }
                })
                // for (let i = 0; i < this.length; i++) 
                // {
                //     Object.setPrototypeOf(this[i],{stat:''})
                // }
                resolve(0)
            }
            else
            {
                console.log(tmpResult.result.err)
                tmpQuerys.forEach(x =>
                {
                    if(x.rowData.stat == 'newing')
                    {
                        Object.setPrototypeOf(x.rowData,{stat:'new'})
                    }
                    else if(x.rowData.stat == 'editing')
                    {
                        Object.setPrototypeOf(x.rowData,{stat:'edit'})
                    }
                })
                resolve(1)
            } 
        });
    }
    delete()
    {
        return new Promise(async resolve => 
        {
            let tmpQueryList = [];
            for (let i = 0; i < this._deleteList.length; i++) 
            {
                if(typeof this.deleteCmd != 'undefined')
                {                    
                    let tmpQuery = undefined;
                    tmpQuery = JSON.parse(JSON.stringify(this.deleteCmd)) //{...this.deleteCmd}
                    
                    //LOCALDB İÇİN YAPILDI. ALI KEMAL KARACA 28.02.2022 - DÜZENLEME : 23.08.2022
                    if(typeof tmpQuery.local != 'undefined')
                    {
                        let tmpLocs = Array.isArray(tmpQuery.local) ? tmpQuery.local : [tmpQuery.local]
                        tmpLocs.forEach(pItem => 
                        {
                            if(pItem.type == 'update')
                            {
                                if(typeof pItem.set != 'undefined')
                                {
                                    //SET
                                    for (let x = 0; x < Object.keys(pItem.set).length; x++) 
                                    {                                        
                                        let tmpKey = Object.keys(pItem.set)[x]
                                        let tmpMap = Object.values(pItem.set)[x]
                                        if(typeof tmpMap.map != 'undefined')
                                        {
                                            pItem.set[tmpKey] = this._deleteList[i][tmpMap.map]
                                        }
                                        else
                                        {
                                            pItem.set[tmpKey] = tmpMap
                                        }
                                    }                            
                                }
                                if(typeof pItem.where != 'undefined')
                                {
                                    //WHERE
                                    for (let x = 0; x < Object.keys(pItem.where).length; x++) 
                                    {
                                        let tmpKey = Object.keys(pItem.where)[x]
                                        let tmpMap = Object.values(pItem.where)[x]
                                        if(typeof tmpMap.map != 'undefined')
                                        {
                                            pItem.where[tmpKey] = this._deleteList[i][tmpMap.map]
                                        }
                                        else
                                        {
                                            pItem.where[tmpKey] = tmpMap
                                        }
                                    }
                                }
                            }
                            if(pItem.type == 'delete')
                            {
                                if(typeof pItem.where != 'undefined')
                                {
                                    //WHERE
                                    for (let x = 0; x < Object.keys(pItem.where).length; x++) 
                                    {
                                        let tmpKey = Object.keys(pItem.where)[x]
                                        let tmpMap = Object.values(pItem.where)[x]
                                        if(typeof tmpMap.map != 'undefined')
                                        {
                                            pItem.where[tmpKey] = this._deleteList[i][tmpMap.map]
                                        }
                                        else
                                        {
                                            pItem.where[tmpKey] = tmpMap
                                        }                                        
                                    }
                                }
                            }
                        });
                    }
                    tmpQuery.value = [];

                    if(typeof tmpQuery.param == 'undefined')
                    {
                        continue;
                    }

                    for (let m = 0; m < tmpQuery.param.length; m++) 
                    {
                        if(typeof tmpQuery.dataprm == 'undefined')
                        {
                            tmpQuery.value.push(this._deleteList[i][tmpQuery.param[m].split(':')[0]]);
                        }
                        else
                        {
                            tmpQuery.value.push(this._deleteList[i][tmpQuery.dataprm[m]]);
                        }
                    }
                    tmpQueryList.push(tmpQuery)                                        
                }
            }
            
            if(tmpQueryList.length > 0)
            {
                let tmpDeleteData = await this.sql.execute(tmpQueryList)

                if(typeof tmpDeleteData.result.err == 'undefined')
                {
                    this._deleteList.splice(0,this._deleteList.length);
                    resolve(0)
                }
                else
                {
                    console.log(tmpDeleteData.result.err)
                    resolve(1)
                }   
            }            
            resolve(1);
        });
    }
    toArray()
    {
        let tmpArr = [];
        for (let i = 0; i < this.length; i++) 
        {
            tmpArr.push(this[i])                                    
        }
        return tmpArr;
    }
    toColumnArr(pColumn)
    {
        let tmpArr = []
        this.toArray().forEach(e =>
        {
            tmpArr.push(e[pColumn])
        })
        return tmpArr
    }
    import(pData)
    {
        for (let i = 0; i < pData.length; i++) 
        {
            this.push(pData[i],false);
        }
    }
    columns()
    {
        let tmpObj = {}
        if(this.length > 0)
        {
            for (let i = 0; i < Object.keys(this[0]).length; i++) 
            {
                let tmp = new Object(); 
                tmp[Object.keys(this[0])[i]] = {notNull:false};
                Object.assign(tmpObj,tmp)
            }
        }
        return tmpObj;
    }   
    groupBy(pKey)
    {
        if(typeof pKey == 'string')
        {
            pKey = pKey.split(',')
        }

        let helper = {};
        let tmpGrpData = this.reduce(function(r,o)
        {
            let key = '';
            for (let i = 0; i < pKey.length; i++) 
            {
                if(i < pKey.length - 1)
                {
                    key += o[pKey[i]] + '-'
                }
                else
                {
                    key += o[pKey[i]]
                }                
            }

            if(!helper[key]) 
            {
                helper[key] = Object.assign({}, o);
                r.push(helper[key]);                
            }
            else 
            {
                helper[key] = o;
            }
            return r;
        },[])
        
        //let tmpDt = new datatable();
        let tmpDt = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        tmpDt.clear()
        tmpDt.import(tmpGrpData)
        return tmpDt
    }
    where()
    {
        if(arguments.length > 0)
        {
            let tmpData = this.toArray();
            
            if(Object.keys(arguments[0]).length > 0)
            {
                let tmpOp = '='
                let tmpKey = Object.keys(arguments[0])[0]
                let tmpValue = Object.values(arguments[0])[0]
                if(typeof tmpValue === 'object')
                {
                    tmpOp = Object.keys(tmpValue)[0]
                    tmpValue = Object.values(tmpValue)[0]
                }
                
                if(tmpOp == '=')
                {
                    tmpData = tmpData.filter(x => x[tmpKey] === tmpValue)
                }
                else if(tmpOp == '<>')
                {
                    tmpData = tmpData.filter(x => x[tmpKey] !== tmpValue)
                }
                else if(tmpOp == '>')
                {
                    tmpData = tmpData.filter(x => x[tmpKey] > tmpValue)
                }
                else if(tmpOp == '<')
                {
                    tmpData = tmpData.filter(x => x[tmpKey] < tmpValue)
                }
                else if(tmpOp == 'IN' || tmpOp == 'in')
                {
                    let tmpArr = []
                    tmpValue.forEach(e => 
                    {
                        tmpData.filter(x => x[tmpKey] == e).forEach(m => 
                        {
                            tmpArr.push(m)
                        });
                    });
                    tmpData = tmpArr
                }
                else if(tmpOp == 'NIN' || tmpOp == 'nin')
                {
                    let tmpArr = []
                    tmpData.forEach(e => 
                    {
                        if(tmpValue.filter(x => x == e[tmpKey]).length == 0)
                        {
                            tmpArr.push(e)
                        }
                    });
                    tmpData = tmpArr
                }
            }
            
            let tmpDt = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
            tmpDt.splice(0,tmpDt.length);
            tmpDt.import(tmpData)
            
            return tmpDt;
        }
    }
    sum()
    {
        let tmpVal = 0;
        if(arguments.length > 0)
        {            
            tmpVal = this.reduce((a,b) =>
            {
                return {[arguments[0]] : Number(a[arguments[0]]) + Number(b[arguments[0]])}
            },{[arguments[0]]:0})[arguments[0]]

            if(arguments.length == 2)
            {
                tmpVal = parseFloat(tmpVal).toFixed(arguments[1]);
            }
        }

        return tmpVal;
    }
    max()
    {
        let tmpVal = 0;
        if(arguments.length > 0)
        {       
            if(this.length > 0)
            {
                tmpVal = this.reduce((a,b) =>(b[arguments[0]] > a[arguments[0]] ? b : a))[arguments[0]]
            }     
            return tmpVal;
        }
    }
}
export class param extends datatable
{
    constructor()
    {
        super()  
        this.meta = null;

        if(arguments.length > 0)
        {            
            this.meta = arguments[0]
        }

    }
    add()
    {
        if(arguments.length == 1 && typeof arguments[0] == 'object')
        {
            if(this.filter({ID:arguments[0].ID}).length > 0)
            {
                this.filter({ID:arguments[0].ID}).setValue(arguments[0].VALUE)
            }
            else
            {
                let tmpItem =
                {
                    TYPE:typeof arguments[0].TYPE == 'undefined' ? -1 : arguments[0].TYPE,
                    ID:typeof arguments[0].ID == 'undefined' ? '' : arguments[0].ID,
                    VALUE:typeof arguments[0].VALUE == 'undefined' ? '' : typeof arguments[0].VALUE == 'object' ? JSON.stringify(arguments[0].VALUE) : arguments[0].VALUE,
                    SPECIAL:typeof arguments[0].SPECIAL == 'undefined' ? '' : arguments[0].SPECIAL,
                    USERS:typeof arguments[0].USERS == 'undefined' ? '' : arguments[0].USERS,
                    PAGE:typeof arguments[0].PAGE == 'undefined' ? '' : arguments[0].PAGE,
                    ELEMENT:typeof arguments[0].ELEMENT == 'undefined' ? '' : arguments[0].ELEMENT,
                    APP:typeof arguments[0].APP == 'undefined' ? '' : arguments[0].APP,
                }
                this.push(tmpItem)    
            }
        }
    }
    load()
    {
        return new Promise(async resolve => 
        {
            if(arguments.length == 1 && typeof arguments[0] == 'object')
            {
                this.selectCmd = 
                {
                    query : "SELECT * FROM PARAM WHERE ((APP = @APP) OR (@APP = '')) AND ((USERS = @USERS) OR (@USERS = '')) AND ((ID = @ID) OR (@ID = '')) " ,
                    param : ['APP:string|50','USERS:string|50','ID:string|50'],
                    value : [
                                typeof arguments[0].APP == 'undefined' ? '' : arguments[0].APP,
                                typeof arguments[0].USERS == 'undefined' ? '' : arguments[0].USERS,
                                typeof arguments[0].ID == 'undefined' ? '' : arguments[0].ID,
                            ]
                } 
                await this.refresh();
            }
            resolve(this);
        });
    }
    save()
    {
        return new Promise(async resolve => 
        {
            this.insertCmd = 
            {
                query : "EXEC [dbo].[PRD_PARAM_INSERT] " + 
                        "@TYPE = @PTYPE, " + 
                        "@ID = @PID, " + 
                        "@VALUE = @PVALUE, " + 
                        "@SPECIAL = @PSPECIAL, " + 
                        "@USERS = @PUSERS, " + 
                        "@PAGE = @PPAGE, " + 
                        "@ELEMENT = @PELEMENT, " + 
                        "@APP = @PAPP ", 
                param : ['PTYPE:int','PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
                dataprm : ['TYPE','ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
            } 

            this.updateCmd = 
            {
                query : "EXEC [dbo].[PRD_PARAM_UPDATE] " + 
                        "@GUID = @PGUID, " + 
                        "@TYPE = @PTYPE, " + 
                        "@ID = @PID, " + 
                        "@VALUE = @PVALUE, " + 
                        "@SPECIAL = @PSPECIAL, " + 
                        "@USERS = @PUSERS, " + 
                        "@PAGE = @PPAGE, " + 
                        "@ELEMENT = @PELEMENT, " + 
                        "@APP = @PAPP ", 
                param : ['PGUID:string|50','PTYPE:int','PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
                dataprm : ['GUID','TYPE','ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
            } 
            await this.update(); 
            resolve();
        });
    }
    filter()
    {
        //BURAYA KESİN BAKILACAK
        if(arguments.length == 1 && typeof arguments[0] == 'object')
        {
            let tmpData = this.toArray();
            let tmpMeta = [...this.meta];
            //PARAMETRENİN META DATASI FİLİTRELENİYOR.
            if(this.meta != null && this.meta.length > 0)
            {
                for (let i = 0; i < Object.keys(arguments[0]).length; i++) 
                {
                    let tmpKey = Object.keys(arguments[0])[i]
                    let tmpValue = Object.values(arguments[0])[i]

                    if(tmpKey != "USERS")
                    {
                        tmpMeta = tmpMeta.filter(x => x[tmpKey] === tmpValue)
                    }
                }
            }
            //DATA FİLİTRELENİYOR.
            if(this.length > 0)
            {
                for (let i = 0; i < Object.keys(arguments[0]).length; i++) 
                {
                    let tmpKey = Object.keys(arguments[0])[i]
                    let tmpValue = Object.values(arguments[0])[i]
                    tmpData = tmpData.filter(x => x[tmpKey] === tmpValue)
                }                
            }

            let tmpPrm = new param(tmpMeta)
            tmpPrm.import(tmpData)
            return tmpPrm;
        }
        return this;
    }
    getValue()
    {                     
        // DB İÇERİSİNDEKİ PARAMETRE DEĞERİ GERİ DÖNDÜRÜLÜYOR.
        if(this.length > 0)
        {
            // EĞER PARAMETRE OLARAK HİÇBİRŞEY GELMEDİYSE SIFIRINCI SATIRI.
            if(arguments.length == 0)
            {
                return JSON.parse(JSON.stringify(this[0].VALUE))
            }
            // EĞER PARAMETRE GELMİŞ İSE VE GELEN VERİ NUMBER İSE VERİLEN SATIR I DÖNDÜR.
            else if(arguments.length == 1 && typeof arguments[0] == 'number')
            {
                try 
                {
                    return JSON.parse(JSON.stringify(this[arguments[0]].VALUE))
                } catch (error) 
                {
                    console.log('error param.toValue() : ' + error)
                }
            }                    
        }
        // DB İÇERİSİNDE KAYIT YOKSA META İÇERİSİNDEKİ DEĞER DÖNDÜRÜLÜYOR.
        else if(this.length == 0 && this.meta != null && this.meta.length > 0 && typeof this.meta[0].VALUE != 'undefined')
        {               
            return JSON.parse(JSON.stringify(this.meta[0].VALUE))
        }

        return undefined;
    }
    setValue()
    {
        // BU FONKSİYON 1 VEYA 2 PARAMETRE ALABİLİR. BİR PARAMETRE ALIRSA SIFIRINCI SATIRA PARAMETRE DEĞERİ SET EDİLİR. İKİ PARAMETRE ALIRSA BİRİNCİ PARAMETRE SATIR İKİNCİ PARAMETRE SET EDİLECEK DEĞERDİR.
        if(this.length > 0)
        {
            // EĞER PARAMETRE OLARAK HİÇBİRŞEY GELMEDİYSE SIFIRINCI SATIRA SET EDİLİYOR
            if(arguments.length == 1)
            {
                this[0].VALUE = typeof arguments[0] == 'object' ? JSON.stringify(arguments[0]) : arguments[0];
            }
            // EĞER PARAMETRE GELMİŞ İSE VE GELEN VERİ NUMBER İSE VERİLEN SATIR I DÖNDÜR.
            else if(arguments.length == 2 && typeof arguments[0] == 'number')
            {
                try 
                {
                    this[arguments[0]].VALUE = typeof arguments[0] == 'object' ? JSON.stringify(arguments[0]) : arguments[0];
                } catch (error) 
                {
                    console.log('error param.toValue() : ' + error)
                }
            }
        }
    }

}
export class access extends datatable
{
    constructor()
    {
        super()

        this.meta = null;

        if(arguments.length > 0)
        {
            this.meta = arguments[0]
        }
    }
    add()
    {
        if(arguments.length == 1 && typeof arguments[0] == 'object')
        {
            let tmpItem =
            {   
                ID:typeof arguments[0].ID == 'undefined' ? '' : arguments[0].ID,             
                VALUE:typeof arguments[0].VALUE == 'undefined' ? '' : JSON.stringify(arguments[0].VALUE),
                SPECIAL:typeof arguments[0].SPECIAL == 'undefined' ? '' : arguments[0].SPECIAL,
                USERS:typeof arguments[0].USERS == 'undefined' ? '' : arguments[0].USERS,
                PAGE:typeof arguments[0].PAGE == 'undefined' ? '' : arguments[0].PAGE,
                ELEMENT:typeof arguments[0].ELEMENT == 'undefined' ? '' : arguments[0].ELEMENT,
                APP:typeof arguments[0].APP == 'undefined' ? '' : arguments[0].APP,
            }
            this.push(tmpItem)
        }
    }
    load()
    {
        return new Promise(async resolve => 
        {
            if(arguments.length == 1 && typeof arguments[0] == 'object')
            {
                this.selectCmd = 
                {
                    query : "SELECT * FROM ACCESS WHERE ((APP = @APP) OR (@APP = ''))" ,
                    param : ['APP:string|50'],
                    value : [
                                typeof arguments[0].APP == 'undefined' ? '' : arguments[0].APP,
                            ]
                } 
                await this.refresh();
            }
            resolve(this);
        });
    }
    save()
    {
        return new Promise(async resolve => 
        {
            this.insertCmd = 
            {
                query : "EXEC [dbo].[PRD_ACCESS_INSERT] " + 
                        "@ID = @PID, " + 
                        "@VALUE = @PVALUE, " + 
                        "@SPECIAL = @PSPECIAL, " + 
                        "@USERS = @PUSERS, " + 
                        "@PAGE = @PPAGE, " + 
                        "@ELEMENT = @PELEMENT, " + 
                        "@APP = @PAPP ", 
                param : ['PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
                dataprm : ['ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
            } 

            this.updateCmd = 
            {
                query : "EXEC [dbo].[PRD_ACCESS_UPDATE] " + 
                        "@GUID = @PGUID, " + 
                        "@ID = @PID, " + 
                        "@VALUE = @PVALUE, " + 
                        "@SPECIAL = @PSPECIAL, " + 
                        "@USERS = @PUSERS, " + 
                        "@PAGE = @PPAGE, " + 
                        "@ELEMENT = @PELEMENT, " + 
                        "@APP = @PAPP ", 
                param : ['PGUID:string|50','PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
                dataprm : ['GUID','ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
            } 
            await this.update(); 
            resolve();
        });
    }
    filter()
    {
        if(arguments.length == 1 && typeof arguments[0] == 'object')
        {
            let tmpData = this.toArray();
            let tmpMeta = [...this.meta];
            //PARAMETRENİN META DATASI FİLİTRELENİYOR.
            if(this.meta != null && this.meta.length > 0)
            {
                for (let i = 0; i < Object.keys(arguments[0]).length; i++) 
                {
                    let tmpKey = Object.keys(arguments[0])[i]
                    let tmpValue = Object.values(arguments[0])[i]

                    if(tmpKey != "USERS")
                    {
                        tmpMeta = tmpMeta.filter(x => x[tmpKey] === tmpValue)
                    }
                }
            }
            //DATA FİLİTRELENİYOR.
            if(this.length > 0)
            {
                for (let i = 0; i < Object.keys(arguments[0]).length; i++) 
                {
                    let tmpKey = Object.keys(arguments[0])[i]
                    let tmpValue = Object.values(arguments[0])[i]
                    tmpData = tmpData.filter(x => x[tmpKey] === tmpValue)
                }                
            }

            let tmpAcs = new access(tmpMeta)
            tmpAcs.import(tmpData)
            return tmpAcs;
        }
        return this;
    }
    getValue()
    {
        // DB İÇERİSİNDEKİ PARAMETRE DEĞERİ GERİ DÖNDÜRÜLÜYOR.
        if(this.length > 0)
        {
            // EĞER PARAMETRE OLARAK HİÇBİRŞEY GELMEDİYSE SIFIRINCI SATIRI.
            if(arguments.length == 0)
            {
                return JSON.parse(JSON.parse(JSON.stringify(this[0].VALUE)))
            }
            // EĞER PARAMETRE GELMİŞ İSE VE GELEN VERİ NUMBER İSE VERİLEN SATIR I DÖNDÜR.
            else if(arguments.length == 1 && typeof arguments[0] == 'number')
            {
                try 
                {
                    return JSON.parse(JSON.stringify(this[arguments[0]].VALUE))
                } catch (error) 
                {
                    console.log('error param.toValue() : ' + error)
                }
            }                    
        }
         // DB İÇERİSİNDE KAYIT YOKSA META İÇERİSİNDEKİ DEĞER DÖNDÜRÜLÜYOR.
         else if(this.length == 0 && this.meta != null && this.meta.length > 0)
         {
            return JSON.parse(JSON.stringify(this.meta[0].VALUE))
         }
        return '';
    }
    setValue()
    {
        // BU FONKSİYON 1 VEYA 2 PARAMETRE ALABİLİR. BİR PARAMETRE ALIRSA SIFIRINCI SATIRA PARAMETRE DEĞERİ SET EDİLİR. İKİ PARAMETRE ALIRSA BİRİNCİ PARAMETRE SATIR İKİNCİ PARAMETRE SET EDİLECEK DEĞERDİR.
        if(this.length > 0)
        {
            // EĞER PARAMETRE OLARAK HİÇBİRŞEY GELMEDİYSE SIFIRINCI SATIRA SET EDİLİYOR
            if(arguments.length == 1)
            {
                this[0].VALUE = JSON.stringify(arguments[0]);
            }
            // EĞER PARAMETRE GELMİŞ İSE VE GELEN VERİ NUMBER İSE VERİLEN SATIR I DÖNDÜR.
            else if(arguments.length == 2 && typeof arguments[0] == 'number')
            {
                try 
                {
                    this[arguments[0]].VALUE = JSON.stringify(arguments[0])
                } catch (error) 
                {
                    console.log('error param.toValue() : ' + error)
                }
            }
        }
    }
}
export class menu
{
    constructor()
    {
        this.metaMenu = null;

        if(arguments.length > 0)
        {            
            this.metaMenu = arguments[0]
        }
        this.core = core.instance;
        this.ds =  new dataset()
        this.empty = {
            GUID : '00000000-0000-0000-0000-000000000000',
            TYPE : 0,
            ID : "",
            VALUE : "",
            SPECIAL : "",
            USERS : "",
            PAGE : "",
            ELEMENT : "",
            APP : ""
        }

        this._initDs();
    }
     //#region private
     _initDs()
     {
         let tmpDt = new datatable('PARAM');
         tmpDt.selectCmd = 
         {
             query : "SELECT * FROM [dbo].[PARAM] WHERE USERS = @USER AND APP = @APP AND ID='menu'",
             param : ['USER:string|50','APP:string|50']
         }
         tmpDt.insertCmd = 
         {
             query : "EXEC [dbo].[PRD_PARAM_INSERT] " + 
                     "@TYPE = @PTYPE, " + 
                     "@ID = @PID, " + 
                     "@VALUE = @PVALUE, " + 
                     "@SPECIAL = @PSPECIAL, " + 
                     "@USERS = @PUSERS, " + 
                     "@PAGE = @PPAGE, " + 
                     "@ELEMENT = @PELEMENT, " + 
                     "@APP = @PAPP ", 
             param : ['PTYPE:int','PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
             dataprm : ['TYPE','ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
         } 
         tmpDt.updateCmd = 
         {
             query : "EXEC [dbo].[PRD_PARAM_UPDATE] " + 
                     "@GUID = @PGUID, " + 
                     "@TYPE = @PTYPE, " + 
                     "@ID = @PID, " + 
                     "@VALUE = @PVALUE, " + 
                     "@SPECIAL = @PSPECIAL, " + 
                     "@USERS = @PUSERS, " + 
                     "@PAGE = @PPAGE, " + 
                     "@ELEMENT = @PELEMENT, " + 
                     "@APP = @PAPP ", 
             param : ['PGUID:string|50','PTYPE:int','PID:string|100','PVALUE:string|max','PSPECIAL:string|150','PUSERS:string|25','PPAGE:string|25','PELEMENT:string|250','PAPP:string|50'],
             dataprm : ['GUID','TYPE','ID','VALUE','SPECIAL','USERS','PAGE','ELEMENT','APP']
         } 
         this.ds.add(tmpDt);
     }
     //#region
     dt()
     {
         if(arguments.length > 0)
         {
             return this.ds.get(arguments[0])
         }
 
         return this.ds.get(0)
     }
     async addEmpty()
     {
         if(typeof this.dt('PARAM') == 'undefined')
         {
             return;
         }
         let tmp = {};
         if(arguments.length > 0)
         {
             tmp = {...arguments[0]}
         }
         else
         {
             tmp = {...this.empty}
         }
         if(typeof arguments[1] == 'undefined' || arguments[1] == true)
         {
             tmp.GUID = datatable.uuidv4()
         }
         this.dt('PARAM').push(tmp,arguments[1])
         
     }
     clearAll()
     {
         for(let i = 0; i < this.ds.length; i++)
         {
             this.dt(i).clear()
         }
     }
     save()
     {
         return new Promise(async resolve => 
         {
             this.ds.delete()
             resolve(await this.ds.update()); 
         });
     }
     load()
     {
         //PARAMETRE OLARAK OBJE GÖNDERİLİR YADA PARAMETRE BOŞ İSE TÜMÜ GETİRİLİR.
         return new Promise(async resolve =>
         {
             let tmpPrm = {USER:"",APP:""}
             if(arguments.length > 0)
             {
                 tmpPrm.USER = typeof arguments[0].USER == 'undefined' ? '' : arguments[0].USER;
                 tmpPrm.APP = typeof arguments[0].APP == 'undefined' ? '' : arguments[0].APP;
             }
 
             this.ds.get('PARAM').selectCmd.value = Object.values(tmpPrm);
 
             await this.ds.get('PARAM').refresh();

             if(this.ds.get('PARAM').length > 0)
             {
                resolve(JSON.parse(this.ds.get('PARAM')[0].VALUE));
             }
             else
             {
                resolve(this.metaMenu)
             }             
         });
     }
}
Object.setPrototypeOf(datatable.prototype,Array.prototype);
//* DİZİ İÇİN GROUP BY */
Array.prototype.toGroupBy = function(pKey)
{
    return this.reduce(function(rv, x) 
    {
        (rv[x[pKey]] = rv[x[pKey]] || []).push(x);
        return rv;
    }, {});
}
//* DİZİ İÇİN ALT ELEMANLARDA ARATMA İŞLEMİ - ALI KEMAL KARACA - 24.08.2022 */
Array.prototype.findSub = function(pFilters,pFindSub)
{
    if(typeof pFilters == 'object')
    {
        let tmpKey = Object.keys(pFilters)[0];
        let tmpVal = Object.values(pFilters)[0];
    
        for (let i = 0; i < this.length; i++) 
        {
            if(this[i][tmpKey] == tmpVal)
            {
                return this[i]
            }
            else if(Array.isArray(this[i][pFindSub]))
            {
                let tmpData = this[i][pFindSub].findSub(pFilters,pFindSub)
                if (typeof tmpData != 'undefined')
                {
                    return tmpData
                }
            }
        }
    }
}
//* SAYI İÇERİSİNDEKİ ORAN. ÖRN: 10 SAYISININ YÜZDE 18 İ 1.8. */
Number.prototype.rateInc = function(pRate,pDigit)
{
    if(typeof pRate != 'undefined')
    {
        if(typeof pDigit != 'undefined')
            return Number((this * (pRate / 100)).toFixed(pDigit))
        else
            return this * (pRate / 100)
    }
    return 0
}
//* SAYI İÇERİSİNDEKİ DAHİLİ ORANI. ÖRN: 10 SAYISININ YÜZDE 18 İN DAHİLİ SONUCU 11.8. */
Number.prototype.rateExc = function(pRate,pDigit)
{
    if(typeof pRate != 'undefined')
    {
        if(typeof pDigit != 'undefined')
            return Number((this * ((pRate / 100) + 1)).toFixed(pDigit))
        else
            return this * ((pRate / 100) + 1)
    }
    return 0
}
//* SAYI İÇERİSİNDEKİ ORANIN ÇIKARILMIŞ SONUCU. ÖRN: 11.8 SAYISININ YÜZDE 18 ÇIKARILMIŞ SONUCU 10. */
Number.prototype.rateInNum = function(pRate,pDigit)
{
    if(typeof pRate != 'undefined')
    {
        if(typeof pDigit != 'undefined')
            return Number((this / ((pRate / 100) + 1)).toFixed(pDigit))
        else
            return this / ((pRate / 100) + 1)
    }
    return 0
}
//* B SAYISININ A SAYISINA DAHİLİ ORANI ÖRN: 1.8 SAYISININ, 11.8 SAYISIN İÇERİSİNDEKİ ORANI %18 */
Number.prototype.rate2In = function(pNum,pDigit)
{
    if(typeof pNum != 'undefined')
    {
        if(typeof pDigit != 'undefined')
        {
            return Number(((pNum / (this - pNum)) * 100).toFixed(pDigit))
        }
        else
        {
            return (pNum / (this - pNum)) * 100
        }                 
    }
    return 0
}
//* B SAYISININ A SAYISINA ORANI ÖRN: 1.8 SAYISININ, 11.8 SAYISIN İÇERİSİNDEKİ ORANI %18 */
Number.prototype.rate2Num = function(pNum,pDigit)
{
    if(typeof pNum != 'undefined')
    {
        if(typeof pDigit != 'undefined')
        {
            return Number(((pNum / this) * 100).toFixed(pDigit))
        }
        else
        {
            return (pNum / this) * 100
        }                 
    }
    return 0
}
//* STRING DEĞERİN SONUNA YADA BAŞINA BOŞLUK ATAR pLen = KARAKTER BOŞLUK SAYISI pType = s (BAŞINA) e (SONUNA) */
String.prototype.space = function(pLen,pType)
{
    let tmpData = this
    if(tmpData.length > pLen)
    {
        tmpData = tmpData.toString().substring(0,pLen);
    }
    if(typeof pType == 'undefined')
    {
        return tmpData.toString().padEnd(pLen,' ');
    }
    if(pType == "e")
    {
        return tmpData.toString().padEnd(pLen,' ');
    }
    else if(pType == "s")
    {
        return tmpData.toString().padStart(pLen,' ');
    }
}
//* FORMAT CURRENCY */
Number.prototype.currency = function()
{
    return new Intl.NumberFormat(localStorage.getItem('lang') == null ? 'en' : localStorage.getItem('lang'), { style: 'currency', currency: typeof Number.money.code == 'undefined' ? 'EUR' : Number.money.code }).format(this)
}
//* FORMAT DECIMAL */
Number.prototype.decimal = function()
{    
    return new Intl.NumberFormat(localStorage.getItem('lang') == null ? 'en' : localStorage.getItem('lang'), { style: 'decimal',minimumIntegerDigits: 2,minimumFractionDigits: 2,maximumFractionDigits: 3}).format(this)
}