//*******************************************************/
// Core - 02.03.2021 - Ali Kemal KARACA
//*******************************************************/
import express from 'express'
import path from 'path'
import {Server as io} from 'socket.io'
import crypto from 'crypto'
import mssql from 'mssql'
import async from 'async'
import terminal from './terminal.js'
import fs from 'fs';
import macid from 'node-machine-id'
import client from 'socket.io-client';
import moment from 'moment'
import download from 'download-git-repo'

export class core 
{
    static instance = null;
    root_path = path.resolve(path.dirname(''));
    app = express();    

    constructor(config)
    {     
        if(typeof process.env.APP_DIR_PATH != 'undefined')
        {
            this.root_path = process.env.APP_DIR_PATH
        }  
        //MADE FOR TESTING ***********/
        if(typeof config.test != "undefined" && config.test)
        {
            this.root_path += "../../bin"
        }
        //************************* */
        if(typeof config.hostPath == "undefined")
        {
            config.hostPath = "/www"
        }
        this.app.use('/',express.static(path.join(this.root_path, config.hostPath)));
        this.config = config;        
        this.plugins = {};                
        this.listeners = Object();

        if(!core.instance)
        {
            core.instance = this;
        } 
    }
    async listen(port)
    {                
        let http = this.app.listen(port);
        this.socket = new socket(http,{cors: {origin: '*'},maxHttpBufferSize: 1e8});
        this.log = new log();                
        this.sql = new sql();
        //this.sql.connect(); TEK HAVUZDAN ÇALIŞTIĞINDA CONNECTION BİRKEZ AÇILIYOR SONRA AYNI KANALDAN SÜREKLİ İSTEKLER GÖNDERİLİYOR.
        this.auth = new auth();
        this.terminal = new terminal();
        this.util = new util();
        //PLUGIN YAPISI ******************************/
        fs.readdirSync(this.root_path + '/plugins').forEach(async file => 
        {   
            if(path.extname(file).toLowerCase() == '.js')
            {
                try 
                {
                    let tmpPath = "../../.."
                    //MADE FOR TESTING ***********/
                    if(typeof this.config.test != 'undefined' && this.config.test)
                    {
                        tmpPath = '../test'
                    }
                    //************************* */
                    import(tmpPath + '/plugins/' + file).then(module =>
                    {
                        Object.keys(module).forEach(element => 
                        {
                            this.plugins[element] = module[element];
                        });
                    })
                } catch (error) {}
            }
        });
        //*******************************************/
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
export class socket extends io
{
    constructor(http,option)
    {
        super(http,option)        
        this.core = core.instance;

        this.connEvt = this.connEvt.bind(this)
        this.on('connection',this.connEvt);   
    }
    connEvt(pSocket)
    {        
        pSocket.on('disconnect', () => 
        {
            if(typeof pSocket.userInfo != 'undefined')
            {
                core.instance.log.msg('Client disconnected','Socket',pSocket.userInfo.CODE);
            }
            else
            {
                core.instance.log.msg('Client disconnected','Socket');
            }
        });
    }    
    clients()
    {
        //SOCKET E BAĞLI KULLANICILARIN LİSTESİ
        let TmpList = [];
        for (const [key, value] of this.sockets.sockets.entries()) 
        {
            if(typeof value.userInfo == 'undefined')
            {
                TmpList.push({id: key,socket: value})
            }
            else
            {
                TmpList.push(
                    {
                        id: key,
                        username:value.userInfo.CODE,
                        sha: value.userInfo.SHA,
                        role:value.userInfo.ROLE,
                        app: value.userInfo.APP,  
                        socket: value
                    }
                )
            }
        }
        if(arguments.length > 0)
        {
            TmpList = TmpList.filter(x => x.app === arguments[0])
        }
        return TmpList
    }
    getUser()
    {
        //İKİ FARKLI PARAMETRE GELEBİLİR SHA YADA USERNAME
        return this.clients().filter(x => x.sha == arguments[0] || x.username == arguments[0]);
    }
}
export class sql 
{
    constructor()
    {
        this.core = core.instance; 
        
        this.connEvt = this.connEvt.bind(this)
        core.instance.socket.on('connection',this.connEvt); 
    }
    connEvt(pSocket)
    {
        pSocket.on('sql',async (pQuery,pCallback) =>
        {
            if(pSocket.authState().id != 0)
            {
                pCallback({auth_err:pSocket.authState()})
                return;
            }
            
            pCallback(await this.execute(pQuery));
        });
    }    
    async connect()
    {
        this.pool = new mssql.ConnectionPool(this.connection());
        this.pool = await this.pool.connect(err =>
        {            
            if(err != null)
            {
                core.instance.emit('onSqlConnected',false)
                core.instance.log.msg("Error errCode : 105 - " + err ,"Sql");
            }
            else
            {
                core.instance.emit('onSqlConnected',true)
            }
        })
    }
    connection()
    {
        if(arguments.length > 0)
        {
            return {
                server: arguments[0].server,
                database: arguments[0].database,
                user: arguments[0].uid, 
                password: arguments[0].pwd, 
                connectionTimeout: typeof arguments[0].connectionTimeout == 'undefined' ? 180000 : arguments[0].connectionTimeout,
                requestTimeout: typeof arguments[0].requestTimeout == 'undefined' ? 180000 : arguments[0].requestTimeout,
                options: 
                {
                    trustedConnection: arguments[0].trustedConnection,
                    trustServerCertificate: true
                }              
            };
        }

        return {
            server: this.core.config.server,
            database: this.core.config.database,
            user: this.core.config.uid, 
            password: this.core.config.pwd, 
            connectionTimeout: typeof this.core.config.connectionTimeout == 'undefined' ? 180000 : this.core.config.connectionTimeout,
            requestTimeout: typeof this.core.config.requestTimeout == 'undefined' ? 180000 : this.core.config.requestTimeout,
            options: 
            {
                trustedConnection: this.core.config.trustedConnection,
                trustServerCertificate: true
            }              
        };
    }
    try()
    {
        return new Promise(resolve =>
        {
            let TmpConfig = this.connection();
            
            if(arguments.length > 0 && typeof arguments[0] == 'object')
            {
                TmpConfig = this.connection(arguments[0])
            }

            TmpConfig.database = "master"

            mssql.connect(TmpConfig, async err =>
            {
                if(err != null)
                {
                    core.instance.log.msg("Could not connect to sql server !","Sql")
                    resolve({status : 1, msg : "Could not connect to sql server !"})
                }
                else
                {
                    let TmpDb = this.connection().database;

                    if(arguments.length > 0 && typeof arguments[0] == 'object')
                    {
                        TmpDb = this.connection(arguments[0]).database;
                    }

                    let TmpQuery = 
                    {
                        query: "SELECT name FROM sysdatabases WHERE ('[' + name + ']' = @DB OR name = @DB)",
                        param: ["DB:string|25"],
                        value: [TmpDb]
                    }

                    if((await this.execute(TmpQuery)).result.recordset.length == 0)
                    {
                        core.instance.log.msg("The database could not be accessed. The database may not have been created. Please check !","Sql");
                        resolve({status : 2, msg : "The database could not be accessed. The database may not have been created. Please check !"})
                    }
                    else
                    {
                        core.instance.log.msg("Connection to database successful.","Sql");
                        resolve({status : 0, msg : "Connection to database successful."})
                    }
                }
            })
        })
    }
    executeSinglePool(pQuery)
    {
        return new Promise(resolve =>
        {
            try
            {
                //TRANSACTION - 25.07.2021
                if(Array.isArray(pQuery))
                {
                    const transaction = new mssql.Transaction(this.pool);
                    return transaction.begin(err => 
                    {    
                        if (err) 
                        {
                            var tmperr = { err : 'Error errCode : 101 - ' + err} 
                            resolve({tag : pQuery.tag,result : tmperr});
                            core.instance.log.msg("Error errCode : 101 - " + err ,"Sql");
                        }
                        return async.eachSeries(pQuery, async (query, callback) => 
                        {             
                            const request = new mssql.Request(transaction);                         
                            request.inputBuild = this.inputBuild;
                            request.inputBuild(query);
                            return request.query(query.query);
                        },async (err2) => 
                        {
                            if (err2) 
                            {
                                transaction.rollback(() => 
                                {
                                    var tmperr = { err : 'Error errCode : 102 - ' + err2} 
                                    resolve({tag : pQuery.tag,result : tmperr});
                                    core.instance.log.msg("Error errCode : 102 - " + err2 ,"Sql");
                                });
                            } 
                            else 
                            {
                                transaction.commit(() => 
                                {
                                    resolve({tag : pQuery.tag,result : []});
                                });
                            }
                        });
                    });
                }
                // NON QUERY
                else
                {
                    const request = this.pool.request();           
                    request.inputBuild = this.inputBuild;
                    request.inputBuild(pQuery)
                    request.query(pQuery.query,(err,result) => 
                    {
                        if(err == null)
                        {
                            resolve({tag : pQuery.tag,result : result});
                        }
                        else
                        {
                            var tmperr = { err : 'Error errCode : 103 - ' + err} 
                            resolve({tag : pQuery.tag,result : tmperr});
                            core.instance.log.msg("Error errCode : 103 - " + err ,"Sql");
                        }
                    });
                }
            }
            catch(err)
            {
                var tmperr = { err : 'Error errCode : 105 - ' + err} 
                resolve({tag : pQuery.tag,result : tmperr});
                core.instance.log.msg("Error errCode : 105 - " + err ,"Sql");
            }
        });
    }
    execute(pQuery)
    {
        return new Promise(resolve =>
        {
            try
            {   
                //Sorgudan gelen database adı config set ediliyor.
                let TmpConfig = this.connection();
                if (typeof pQuery.db != "undefined") 
                {
                    TmpConfig = this.connection(pQuery.db);    
                }
                if(typeof pQuery.timeout != 'undefined')
                {
                    TmpConfig = {...TmpConfig}
                    TmpConfig.connectionTimeout = pQuery.timeout
                    TmpConfig.requestTimeout = pQuery.timeout
                }                
                const pool = new mssql.ConnectionPool(TmpConfig, err => 
                {
                    if(err == null)
                    {
                        //TRANSACTION - 25.07.2021
                        if(Array.isArray(pQuery))
                        {
                            const transaction = new mssql.Transaction(pool);
                            return transaction.begin(err => 
                            {    
                                if (err) 
                                {
                                    var tmperr = { err : 'Error errCode : 101 - ' + err} 
                                    resolve({tag : pQuery.tag,result : tmperr});
                                    core.instance.log.msg("Error errCode : 101 - " + err ,"Sql");
                                    pool.close();
                                }
                                return async.eachSeries(pQuery, async (query, callback) => 
                                {             
                                    const request = new mssql.Request(transaction);                         
                                    request.inputBuild = this.inputBuild;
                                    request.inputBuild(query);
                                    return request.query(query.query);
                                },async (err2) => 
                                {
                                    if (err2) 
                                    {
                                      await transaction.rollback(() => 
                                      {
                                        pool.close();
                                        var tmperr = { err : 'Error errCode : 102 - ' + err2} 
                                        resolve({tag : pQuery.tag,result : tmperr});
                                        core.instance.log.msg("Error errCode : 102 - " + err2 ,"Sql");
                                      });
                                    } 
                                    else 
                                    {
                                      await transaction.commit(() => 
                                      {
                                        pool.close();
                                        resolve({tag : pQuery.tag,result : []});
                                      });
                                    }
                                });
                            });
                        }
                        // NON QUERY
                        else
                        {
                            const request = pool.request();           
                            request.inputBuild = this.inputBuild;
                            request.inputBuild(pQuery)
                            request.query(pQuery.query,(err,result) => 
                            {
                                if(err == null)
                                {
                                    resolve({tag : pQuery.tag,result : result});
                                }
                                else
                                {
                                    var tmperr = { err : 'Error errCode : 103 - ' + err} 
                                    resolve({tag : pQuery.tag,result : tmperr});
                                    core.instance.log.msg("Error errCode : 103 - " + err ,"Sql");
                                }
                                pool.close();
                            });
                        }
                    }
                    else
                    {
                        var tmperr = { err : 'Error errCode : 104 - ' + err} 
                        resolve({tag : pQuery.tag,result : tmperr});
                        core.instance.log.msg("Error errCode : 104 - " + err ,"Sql");
                    }
                });
            }
            catch(err)
            {
                var tmperr = { err : 'Error errCode : 105 - ' + err} 
                resolve({tag : pQuery.tag,result : tmperr});
                core.instance.log.msg("Error errCode : 105 - " + err ,"Sql");
            }
        });
    }
    async createDb(pDbName)
    {
        return new Promise(async resolve =>
        {
            if(typeof pDbName == 'undefined')
            {
                core.instance.log.msg("Database could not be created ! Missing parameter.","Sql")
                resolve({msg:"Database could not be created ! Missing parameter."})
                return
            }
    
            // CREATE DATABASE
            let TmpRead = core.instance.util.readFile("/setup/dbscr/DB.sql");
            TmpRead = TmpRead.toString().split("{FOLDER_NAME}").join(config.db_path);
            TmpRead = TmpRead.toString().split("{DBNAME}").join(pDbName)
            console.log(TmpRead)
            let TmpResult = await this.execute({db : "master", query : TmpRead});
            
            if(typeof TmpResult.result.err == 'undefined')
            {
                core.instance.log.msg("Database creation successful.","Sql");
                // CREATE TABLE OR VIEW OR FUNCTION VS...
                TmpRead = core.instance.util.readFile("/setup/dbscr/CONTENT.sql");
                TmpRead = TmpRead.toString().split("{DBNAME}").join(pDbName)
    
                TmpResult = await this.execute({db : pDbName, query : TmpRead});
                if(typeof TmpResult.result.err == 'undefined')
                {
                    core.instance.log.msg("Database content creation successful.","Sql");
                    resolve({msg:""})
                }
                else
                {
                    core.instance.log.msg("Database content could not be created !","Sql");
                    resolve({msg:"Database content could not be created !"})
                }
            }
            else
            {
                core.instance.log.msg("Database could not be created !","Sql");
                resolve({msg:"Database could not be created !"})
            }
        });
    }
    inputBuild(pQuery)
    {
        if(typeof pQuery.param != 'undefined')
        {
            for(let i = 0;i < pQuery.param.length;i++)
            {
                let pType = null;
                if(pQuery.param[i].split(":").length > 1)
                {
                    pType = pQuery.param[i].split(":")[1].split("|");
                }
                else
                {
                    pType = pQuery.type[i].split("|");   
                }
                
                if(pType[0] == "string")
                {
                    this.input(pQuery.param[i].split(":")[0],mssql.NVarChar(pType[1]),pQuery.value[i]);    
                }
                else if(pType[0] == "int")
                {
                    this.input(pQuery.param[i].split(":")[0],mssql.Int,pQuery.value[i]);    
                }
                else if(pType[0] == "float")
                {
                    this.input(pQuery.param[i].split(":")[0],mssql.Float,pQuery.value[i]);    
                }
                else if(pType[0] == "date")
                {
                    // let from = pQuery.value[i]; 
                    // let numbers = from.match(/\d+/g); 

                    // let yyyy = 0
                    // let mm = 0
                    // let dd = 0

                    // if(numbers[0].length > 2)
                    // {
                    //     yyyy = numbers[0];
                    //     mm = numbers[1];
                    //     dd = numbers[2];
                    // }
                    // else if(numbers[2].length > 2)
                    // {
                    //     yyyy = numbers[2];
                    //     mm = numbers[1];
                    //     dd = numbers[0];
                    // }
                    
                    // let date = moment(yyyy + "-" + mm + "-" + dd).utcOffset(0, true);
                    this.input(pQuery.param[i].split(":")[0],mssql.Date,new Date(moment(pQuery.value[i]).utcOffset(0, true)));
                }
                else if(pType[0] == "datetime")
                {                    
                    let from = pQuery.value[i]; 
                    let numbers = from.match(/\d+/g); 
                    
                    let yyyy = 0
                    let mm = 0
                    let dd = 0
                    let hh = 0
                    let mmm = 0
                    let ss = 0
                    let sss = 0
                    
                    if(numbers[0].length > 2)
                    {
                        yyyy = numbers[0];
                        mm = numbers[1];
                        dd = numbers[2];
                        hh = numbers[3];
                        mmm = numbers[4];
                        ss = typeof numbers[5] == 'undefined' ? "00" : numbers[5]
                        sss = typeof numbers[6] == 'undefined' ? "000" : numbers[6]
                    }
                    else if(numbers[2].length > 2)
                    {
                        yyyy = numbers[2];
                        mm = numbers[1];
                        dd = numbers[0];
                        hh = numbers[3];
                        mmm = numbers[4];
                        ss = typeof numbers[5] == 'undefined' ? "00" : numbers[5]
                        sss = typeof numbers[6] == 'undefined' ? "000" : numbers[6]
                    }
                    var date = moment(yyyy + "-" + mm + "-" + dd + "T" + hh + ":" + mmm + ":" + ss + "." + sss).utcOffset(0, true);
                    this.input(pQuery.param[i].split(":")[0],mssql.DateTime,new Date(date));
                    // let tmpQuery = {...pQuery};
                    // tmpQuery.query = tmpQuery.query.replace('@'+ pQuery.param[i].split(":")[0],"'" + date.format("YYYY-MM-DD HH:mm") + "'");
                    // tmpQuery.query = tmpQuery.query.replace('@'+ pQuery.param[i].split(":")[0],"'" + date.format("YYYY-MM-DD HH:mm") + "'");
                    // tmpQuery.query = tmpQuery.query.replace('@'+ pQuery.param[i].split(":")[0],"'" + date.format("YYYY-MM-DD HH:mm") + "'");
                    // pQuery = {...pQuery}
                }
                else if(pType[0] == "bit")
                {
                    this.input(pQuery.param[i].split(":")[0],mssql.Bit,pQuery.value[i]);    
                }
            }
        }
    }
}
export class auth
{
    constructor()
    {
        this.connEvt = this.connEvt.bind(this)
        core.instance.socket.on('connection',this.connEvt);
    }
    connEvt(pSocket)
    {
        pSocket.authState = function() 
        {
            if(typeof this.userInfo == 'undefined')
            {
                core.instance.log.msg('Authorization error 403 access denied','Login');
                return {id: 1, err: 'Authorization error 403 access denied'};
            }
            else
            {
                if(typeof arguments[0] != 'undefined')
                {
                    if(this.userInfo.ROLE != arguments[0])
                    {
                        core.instance.log.msg('Unauthorized user denied','Login');
                        return {id: 2, err: 'Unauthorized user denied'};
                    }
                }
            }
            return {id: 0, err: 'Successful'};
        };

        pSocket.on('login',async (pParam,pCallback) =>
        {    
            let TmpResult = [];            
            let TmpApp = '';

            if(pParam.length == 2)
            {
                TmpApp = pParam[1];
                TmpResult = await this.login(pParam[0]);
                
                if(TmpResult.length == 0)
                {
                    core.instance.log.msg('Invalid token access denied !',"Login");
                    pSocket.emit('general',{id:"M002",data:"Invalid token access denied !"});
                }
            }
            else if(pParam.length == 3)
            {
                TmpApp = pParam[2];
                TmpResult = await this.login(pParam[0],pParam[1]);
                
                if(TmpResult.length == 0)
                {
                    core.instance.log.msg('Invalid username or password !',"Login");
                    pSocket.emit('general',{id:"M002",data:"Invalid username or password !"});
                }
            }            
            
            if(TmpResult.length > 0)
            {
                //SOCKETIN DAHA ÖNCEDEN LOGIN OLUP OLMADIĞI KONTROL EDİLİYOR.
                if(typeof pSocket.userInfo != 'undefined')
                {
                    core.instance.log.msg('Already logined.',"Login",pSocket.userInfo.CODE);
                    pSocket.emit('general',{id:"M002",data:"Already logined."});
                }
                else
                {
                    //KULLANICI BAŞKA BİR CİHAZDAN DAHA ÖNCE LOGİN OLMUŞSA KONTROL EDİLİYOR VE DİĞER CİHAZDAKİ KULLANICI DISCONNECT EDİLİYOR.
                    let TmpUserList = await core.instance.socket.getUser(TmpResult[0].SHA);
                    
                    for (let i = 0; i < TmpUserList.length; i++) 
                    {
                        TmpUserList[i].socket.emit('general',{id:"M004",data:"already logged in on another device"})
                        //TmpUserList[i].socket.disconnect(true);
                    }
                    //***********************************************************************************************************************/
                    //LOGIN OLAN KULLANICININ BİLGİLERİ DB DEN GETİRİLİYOR.
                    pSocket.userInfo = [];
                    if(TmpResult.length > 0)
                    {
                        TmpResult[0].APP = TmpApp;
                        pSocket.userInfo = TmpResult[0];
                    }               
                    core.instance.log.msg('Logined user.',"Login",TmpResult[0].CODE);
                    pSocket.emit('general',{id:"M003",data:"Logined user."});
                }
            }
            else
            {
                TmpResult = [];
            }
            core.instance.emit('Logined',{result:TmpResult,socket:pSocket});
            pCallback(TmpResult);
        });
        pSocket.on('getUserList',async (pCallback) =>
        {    
            let TmpResult = [];
            TmpResult = await this.getUserList();
            pCallback(TmpResult);
        });
        pSocket.on('refreshToken',async (pParam) =>
        {
            this.refreshToken(pParam[0])
        });
    }
    login()
    {
        return new Promise(async resolve =>
        {
            let TmpQuery = {};
            // SHA CODE YA DA KULLANICI ADI BOŞ GELİRSE...
            if(arguments[0] == '' || arguments[0] == null)
            {
                resolve([]); 
            }
            //ONLY SHA CODE
            if(arguments.length == 1)
            {
                TmpQuery =
                {
                    query:  "SELECT * FROM USERS WHERE SHA = (SELECT [dbo].[FN_LOGIN] (@SHA,NULL))",
                    param:  ['SHA:string|200'],
                    value:  [arguments[0]]
                }
            }
            //USER AND PWD 
            else if (arguments.length == 2)
            {
                TmpQuery =
                {
                    query:  "SELECT * FROM USERS WHERE SHA = (SELECT [dbo].[FN_LOGIN] (@USER,@PWD))",
                    param:  ['USER:string|25','PWD:string|50'],
                    value:  [arguments[0],core.instance.util.toBase64(arguments[1])]
                }
            }

            let TmpData = await core.instance.sql.execute(TmpQuery)
            if(typeof TmpData.result.err == 'undefined')
            {
                if(TmpData.result.recordset.length > 0)
                {
                    resolve(TmpData.result.recordset);
                }
                else
                {
                    resolve([]);
                }
            }
            else
            {
                resolve([]); 
            }
        });
    }
    getUserList()
    {
        return new Promise(async resolve =>
        {
            let TmpQuery =
            {
                query:  "SELECT CODE,NAME,CARDID,(SELECT CAST( CAST( PWD as XML ).value('.','varbinary(max)') AS varchar(max) )) AS PWD,ROLE FROM USERS WHERE STATUS = 1",
            }

            let TmpData = await core.instance.sql.execute(TmpQuery)
            if(typeof TmpData.result.err == 'undefined')
            {
                if(TmpData.result.recordset.length > 0)
                {
                    resolve(TmpData.result.recordset);
                }
                else
                {
                    resolve([]);
                }
            }
            else
            {
                resolve([]); 
            }
        });
    }
    async refreshToken(pGuid)
    {
        let TmpQuery =
        {
            query:  "EXEC [dbo].[PRD_USERS_UPDATE] " + 
                    "@GUID = @PGUID, " + 
                    "@SHA = @PSHA ",
            param:  ['PGUID:string|50','PSHA:string|200'],
            value:  [pGuid,crypto.createHash('sha256').update(pGuid + "-" + new Date()).digest('hex')]
        }
        await core.instance.sql.execute(TmpQuery)
    }
}
export class log
{
    constructor()
    {

    }
    msg()
    {
        let BufferDate = new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0');
        let TmpTime = new Date().getHours().toString().padStart(2,'0') + ":" + new Date().getMinutes().toString().padStart(2,'0') + ":" + new Date().getSeconds().toString().padStart(2,'0')
        let TmpMsg = "";
        let TmpTag = ""; //Socket,System,Sql,Terminal ...
        let TmpUser = "";
        let TmpObj = [];

        if(typeof arguments[0] != 'undefined')
        {
            TmpMsg = arguments[0]
        }
        if(typeof arguments[1] != 'undefined')
        {
            TmpTag = arguments[1]
        }
        if(typeof arguments[2] != 'undefined')
        {
            TmpUser = arguments[2]
        }        

        try
        {
            if(typeof core.instance.config.debug != 'undefined' && core.instance.config.debug)
            {
                if(!fs.existsSync(core.instance.root_path +"/log/"))
                {
                    fs.mkdirSync(core.instance.root_path +"/log/");
                }
    
                if(fs.existsSync(core.instance.root_path +"/log/" + BufferDate + ".json"))
                {
                    let TmpRead = core.instance.util.readFile("/log/" + BufferDate + ".json");
                    TmpObj = JSON.parse(TmpRead);
                }
    
                TmpObj.push({Time:TmpTime,Tag:TmpTag,User:TmpUser,Msg:TmpMsg});
            
                core.instance.util.writeFile("/log/" + BufferDate + ".json",JSON.stringify(TmpObj,null, '\t'));
            }
            
            core.instance.socket.emit('terminal',TmpMsg);
        }
        catch(err)
        {
            console.log(err)
        }                

        console.log(TmpMsg + " - " + TmpTag + " - " + TmpUser);
    }
    readLog()
    {
        let TmpFileName = ""
        let TmpObj = {};
        
        if(typeof arguments[0] != 'undefined' && arguments[0] != "")
        {
            console.log(arguments[0])
            TmpFileName = arguments[0]
        }
        else
        {
            TmpFileName = new Date().getFullYear().toString() + (new Date().getMonth() + 1).toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0');
        }
        if(typeof arguments[1] != 'undefined')
        {
            TmpObj = arguments[1]
        }

        try
        {
            let TmpRead = core.instance.util.readFile("/log/" + TmpFileName + ".json");
            let TmpData = JSON.parse(TmpRead);

            if(typeof TmpObj.Tag != 'undefined')
            {
                TmpData = TmpData.filter((x) => {return x.Tag === TmpObj.Tag})
            }
            if(typeof TmpObj.User != 'undefined')
            {
                TmpData = TmpData.filter((x) => {return x.User === TmpObj.User})
            }
            
            TmpRead = JSON.stringify(TmpData,null,"\t");
            core.instance.socket.emit('terminal',TmpRead);
            console.log(TmpRead);
        }
        catch(err)
        {
            console.log(err)
        }
    }
}
export class util 
{
    constructor()
    {
        this.connEvt = this.connEvt.bind(this);
        core.instance.socket.on('connection',this.connEvt)
    }
    connEvt(pSocket)
    {        
        pSocket.on('util',async (pParam,pCallback) =>
        {
            if(pSocket.authState().id != 0)
            {
                pCallback({auth_err:pSocket.authState()})
                return;
            }

            if(pParam.cmd == 'folder_list')
            {
                pCallback(this.folder_list(pParam.prm))
            }
            else if(pParam.cmd == 'read_file')
            {
                pCallback(this.readFile(pParam.prm))
            }
            else if(pParam.cmd == 'write_file')
            {
                pCallback(this.writeFile(pParam.prm.path,pParam.prm.data))
            }
            else if(pParam.cmd == 'write_log')
            {
                pCallback(this.writeLog(pParam.prm.path,pParam.prm.data))
            }
        })
    }
    folder_list(pPath)
    {
        try
        {
            return fs.readdirSync(core.instance.root_path + '\\' + pPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
        }
        catch (err) 
        {
            return [];
        }
    }
    readFile(pPath)
    {
        try
        {
            return fs.readFileSync(core.instance.root_path + pPath,{encoding:'utf8'});
        }
        catch (err) 
        {
            return "";
        }
    }
    writeFile(pPath,pData)
    {
        try
        {
            fs.writeFileSync(core.instance.root_path + pPath,pData,{encoding:'utf8'});
            return true;
        }
        catch (err) 
        {
            return false;
        }
    }
    writeLog(pPath,pData)
    {
        try
        {
            let tmpPath = core.instance.root_path + pPath
            let tmpFolderPath = tmpPath.toString().substring(0,tmpPath.toString().lastIndexOf("\\"))
            
            if (!fs.existsSync(tmpFolderPath))
            {
                fs.mkdirSync(tmpFolderPath);
            }

            fs.appendFileSync(tmpPath, pData)            
            return true
        }
        catch (err) 
        {
            return false;
        }
    }
    toBase64(pText)
    {
        return new Buffer(pText).toString('base64')
    }   
}
//* SAYI İÇERİSİNDEKİ ORAN. ÖRN: 10 SAYISININ YÜZDE 18 İ 1.8. */
Number.prototype.rateInc = function(pRate,pDigit)
{
    if(typeof pRate != 'undefined')
    {
        if(typeof pDigit != 'undefined')
            return (this * (pRate / 100)).toFixed(pDigit)
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
            return (this * ((pRate / 100) + 1)).toFixed(pDigit)
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
            return (this / ((pRate / 100) + 1)).toFixed(pDigit)
        else
            return this / ((pRate / 100) + 1)
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
            return ((pNum / (this - pNum)) * 100).toFixed(pDigit)
        }
        else
        {
            return (pNum / (this - pNum)) * 100
        }                 
    }
    return 0
}