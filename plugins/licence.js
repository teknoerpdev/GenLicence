import { core } from 'gensrv'
import {datatable} from '../core/core.js'
import {io} from 'socket.io-client'
import express from 'express'
import CryptoJS from "crypto-js";

class licence 
{
    constructor()
    {   
        this.core = core.instance
        this.auth = new auth()

        this.core.app.use(express.json()); 
        this.restRun()
    }
    async restRun()
    {
        this.core.app.post('/login', async (req, res) => 
        {
            if(!req || !req.body || !req.body.login || !req.body.pass)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            const userInfo = await this.auth.login(req.body)

            if(!userInfo || (userInfo && !userInfo.length))
            {
                return res.status(404).send(await result.errorResult("Invalid Login"))
            }

            const encryptPass = await this.auth.generateToken(req.body)

            return res.status(200).send(await result.successResult("success",{accessToken : encryptPass}))
        })

        this.core.app.post('/licenceCheck', async (req, res) => 
        {
            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]

            }
            else
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }
        })

        this.core.app.get('/licenceSave',(req, res) => 
        {
            
        })
    }
}
class auth
{
    constructor()
    {
        this.core = core.instance
        this.crypto = new crypto()
    }
    async login(pData)
    {
        const data = await this.core.sql.execute
        (
            {
                query: "SELECT SHA FROM USERS WHERE SHA = (SELECT [dbo].[FN_LOGIN] (@USER,@PASS))",
                param: ["USER:string|25","PASS:string|50"],
                value: [pData.login,this.core.util.toBase64(pData.pass)]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result.err : data.result.recordset
    }
    async generateToken(pData)
    {
        const encryptPass = await this.crypto.encrypt(pData.pass)

        const data = await this.core.sql.execute
        (
            {
                query: "UPDATE USERS SET SHA = @PASS WHERE CODE = @USER",
                param: ["PASS:string|50","USER:string|25"],
                value: [encryptPass,pData.login]
            }
        )
        return typeof data.result.err != 'undefined' ? data.result.err : encryptPass
    }
    async loginCheck(pToken)
    {
        const data = await this.core.sql.execute
        (
            {
                query: "SELECT SHA FROM USERS WHERE SHA = @SHA",
                param: ["SHA:string|200"],
                value: [pToken]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result.err : data.result.recordset
    }
}
class crypto
{
    constructor()
    {
        this.CRYPTO_KEY = "TEKNOERP_GENSRV"
    }
    async encrypt(pData)
    {
        return CryptoJS.AES.encrypt(pData, this.CRYPTO_KEY).toString();
    }
    async decrypt(pData)
    {
        return CryptoJS.AES.decrypt(pData, this.CRYPTO_KEY).toString();
    }
}
class result
{
    static async successResult(pMessage,pBody)
    {
        return {
            "success" : true,
            "message" : pMessage,
            "statusCode" : 200,
            "body": pBody
        }
    }
    static async errorResult(pMessage)
    {
        return {
            "success" : false,
            "message" : pMessage,
            "statusCode" : 404,
            "body": {}
        }
    }
}
export const _licence = new licence()