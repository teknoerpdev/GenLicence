import { core } from 'gensrv'
import {datatable} from '../core/core.js'
import {io} from 'socket.io-client'
import express from 'express'
import CryptoJS from "crypto-js";

class mainLicence 
{
    constructor()
    {   
        this.core = core.instance
        this.auth = new auth()
        this.licence = new licence()
        this.crypto = new crypto()

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

            if(!userInfo || userInfo.err || (userInfo && !userInfo.length))
            {
                return res.status(404).send(await result.errorResult("Invalid Login"))
            }

            const encryptPass = await this.auth.generateToken(req.body)

            if(!encryptPass || encryptPass.err)
            {
                return res.status(404).send(await result.errorResult("Failed to Create Token"))
            }

            return res.status(200).send(await result.successResult("success",{accessToken: encryptPass}))
        })

        this.core.app.post('/licenceCheck', async (req, res) => 
        {
            if(!req || !req.body || !req.body.macId)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            const licence = await this.licence.licenceCheck(req.body.macId)

            if(!licence || licence.err || (licence && !licence.length))
            {
                return res.status(404).send(await result.errorResult("Licence Not Found"))
            }
        })

        this.core.app.post('/getLicence', async (req, res) => 
        {
            if(!req || !req.body)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            if(!req.headers['authorization'])
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }

            if(typeof req.body.appName == 'undefined')
            {
                return res.status(404).send(await result.errorResult("appName is required"))
            }

            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]
                
                const login = await this.auth.loginCheck(token)

                if(!login || !login.length || login.err)
                {
                    return res.status(404).send(await result.errorResult("Invalid Token"))
                }

                req.body["login"] = login[0].CODE

                const getLicence = await this.licence.getLicence(req.body)
                
                if(!getLicence || typeof (getLicence.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Licence not found ",{ err: getLicence.err}))
                }

                return res.status(200).send(await result.successResult("success",getLicence))
            }
        })

        this.core.app.post('/getCompany', async (req, res) => 
        {
            if(!req || !req.body)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            if(!req.headers['authorization'])
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }

            if(typeof req.body.taxNumber == 'undefined')
            {
                return res.status(404).send(await result.errorResult("taxNumber is required"))
            }

            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]
                
                const login = await this.auth.loginCheck(token)

                if(!login || !login.length || login.err)
                {
                    return res.status(404).send(await result.errorResult("Invalid Token"))
                }

                req.body["login"] = login[0].CODE

                const getCompany = await this.licence.getCompany(req.body)
                
                if(!getCompany || typeof (getCompany.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Company not found ",{ err: getCompany.err}))
                }

                return res.status(200).send(await result.successResult("success",getCompany))
            }
        })

        this.core.app.post('/companySave', async (req, res) => 
        {
            if(!req || !req.body)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            if(!req.headers['authorization'])
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }

            const paramsToCheck = 
            {
                "title": req.body.title,
                "taxNumber": req.body.taxNumber, 
                "adress": req.body.adress, 
                "mail": req.body.mail, 
                "phone": req.body.phone
            }

            const checkResult = this.checkParams(paramsToCheck)

            if(!checkResult.success)
            {
                return res.status(404).send(await result.errorResult(checkResult.message))
            }

            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]
                
                const login = await this.auth.loginCheck(token)

                if(!login || !login.length || login.err)
                {
                    return res.status(404).send(await result.errorResult("Invalid Token"))
                }

                req.body["login"] = login[0].CODE

                const companySave = await this.licence.companySave(req.body)
                
                if(!companySave || typeof (companySave.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Company could not be registered",{ err: companySave.err}))
                }

                if(typeof companySave[0].MSG != 'undefined')
                {
                    return res.status(404).send(await result.errorResult(companySave[0].MSG))
                }

                return res.status(200).send(await result.successResult("Company has been successfully created"))
            }
        })

        this.core.app.post('/licenceSave', async (req, res) => 
        {
            if(!req || !req.body)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            if(!req.headers['authorization'])
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }

            const paramsToCheck = 
            {
                "title": req.body.title,
                "taxNumber": req.body.taxNumber,
                "adress": req.body.adress, 
                "mail": req.body.mail, 
                "phone": req.body.phone,
                "packet": req.body.packet, 
                "startDate": req.body.startDate, 
                "endDate": req.body.endDate, 
                "seller": req.body.seller
            }

            const checkResult = this.checkParams(paramsToCheck)

            if(!checkResult.success)
            {
                return res.status(404).send(await result.errorResult(checkResult.message))
            }

            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]
                
                const login = await this.auth.loginCheck(token)

                if(!login || !login.length || login.err)
                {
                    return res.status(404).send(await result.errorResult("Invalid Token"))
                }

                req.body["login"] = login[0].CODE
                req.body["installKey"] = await this.generateInstallKey()

                const licenceSave = await this.licence.licenceSave(req.body)

                console.log(licenceSave)

                if(!licenceSave || licenceSave.err)
                {
                    return res.status(404).send(await result.errorResult("Licence could not be registered",{ err: licenceSave.err}))
                }

                return res.status(200).send(await result.successResult("Licence has been successfully created"))
            }
        })

        this.core.app.post('/companyUpdate', async (req, res) => 
        {
            if(!req || !req.body)
            {
                return res.status(404).send(await result.errorResult("Missing Parameters"))
            }

            if(!req.headers['authorization'])
            {
                return res.status(404).send(await result.errorResult("Token Not Found"))
            }

            const paramsToCheck = 
            {
                "title": req.body.title,
                "taxNumber": req.body.taxNumber, 
                "adress": req.body.adress, 
                "mail": req.body.mail, 
                "phone": req.body.phone
            }

            const checkResult = this.checkParams(paramsToCheck)

            if(!checkResult.success)
            {
                return res.status(404).send(await result.errorResult(checkResult.message))
            }

            const tokenHeader = req.headers['authorization']

            if(typeof tokenHeader !== 'undefined')
            {
                const token = tokenHeader.split(' ')[1]
                
                const login = await this.auth.loginCheck(token)

                if(!login || !login.length || login.err)
                {
                    return res.status(404).send(await result.errorResult("Invalid Token"))
                }

                req.body["login"] = login[0].CODE

                const companyUpdate = await this.licence.companyUpdate(req.body)
                
                if(!companyUpdate || typeof (companyUpdate.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Company could not be registered",{ err: companyUpdate.err}))
                }

                return res.status(200).send(await result.successResult("Company has been successfully updated"))
            }
        })
    }
    checkParams(pParams)
    {
        for (const param in pParams) 
        {
            if (!pParams[param] || pParams[param].trim() === '') 
            {
                return { success: false, message: `${param} is required` };
            }
        }
        
        return { success: true };
    }
    async generateInstallKey()
    {
        let key = ""

        const keyList = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","Y","Z","X",
        "0","1","2","3","4","5","6","7","8","9"];

        for(let i = 0; i < 15; i++)
        {
            let random = Math.floor(Math.random()*35);
            key += keyList[random];
        }

        return key
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
                query: `SELECT SHA FROM USERS WHERE SHA = (SELECT [dbo].[FN_LOGIN] (@USER,@PASS))`,
                param: ["USER:string|25","PASS:string|50"],
                value: [pData.login,this.core.util.toBase64(pData.pass)]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset
    }
    async generateToken(pData)
    {
        const encryptPass = await this.crypto.encrypt(pData.pass)

        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE USERS SET SHA = @PASS WHERE CODE = @USER`,
                param: ["PASS:string|50","USER:string|25"],
                value: [encryptPass,pData.login]
            }
        )
        return typeof data.result.err != 'undefined' ? data.result : encryptPass
    }
    async loginCheck(pToken)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `SELECT CODE FROM USERS WHERE SHA = @SHA`,
                param: ["SHA:string|200"],
                value: [pToken]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset
    }
}
class licence
{
    constructor()
    {
        this.core = core.instance
    }
    async licenceCheck(pMacId)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `SELECT MAC_ID FROM LICENSES WHERE MAC_ID = @MAC_ID`,
                param: ["MAC_ID:string|100"],
                value: [pMacId]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset
    }
    async licenceSave(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `EXEC [dbo].[licenceSave] 
                        @USER = @USER, 
                        @TAX_NUMBER = @TAX_NUMBER, 
                        @TITLE = @TITLE, 
                        @ADRESS = @ADRESS, 
                        @MAIL = @MAIL, 
                        @PHONE = @PHONE, 
                        @PACKET_ID = @PACKET_ID, 
                        @INSTALL_KEY = @INSTALL_KEY, 
                        @START_DATE = @START_DATE, 
                        @END_DATE = @END_DATE, 
                        @SELLER = @SELLER `,
                param: ['USER:string|50','TITLE:string|200','TAX_NUMBER:string|50','ADRESS:string|max','MAIL:string|50','PHONE:string|50',
                        'PACKET_ID:int','INSTALL_KEY:string|15','START_DATE:datetime','END_DATE:datetime','SELLER:string|50'],
                value: [pBody.login,pBody.title,pBody.taxNumber,pBody.adress,pBody.mail,pBody.phone,pBody.packet,pBody.installKey,pBody.startDate,pBody.endDate,pBody.seller]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.rowsAffected
    }
    async companySave(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `IF EXISTS ( SELECT TAX_NUMBER FROM [dbo].[COMPANIES] WHERE TAX_NUMBER = @TAX_NUMBER) BEGIN
                            SELECT @TAX_NUMBER + ' tax already exists' AS MSG 
                        END
                        ELSE BEGIN
                            INSERT INTO [dbo].[COMPANIES] (
                            [CUSER], [LUSER], [TAX_NUMBER], [TITLE], [ADRESS], [MAIL], [PHONE]
                            ) VALUES (
                            @USER, @USER, @TAX_NUMBER, @TITLE, @ADRESS, @MAIL, @PHONE
                            ) 
                        END `,
                param: ['USER:string|50','TAX_NUMBER:string|50','TITLE:string|200','ADRESS:string|max','MAIL:string|50','PHONE:string|50'],
                value: [pBody.login,pBody.taxNumber,pBody.title,pBody.adress,pBody.mail,pBody.phone]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset
    }
    async macIdUpdate(pMacId)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `SELECT MAC_ID FROM LICENSES WHERE COMP_TAX = @COMP_TAX AND `,
                param: ["MAC_ID:string|100"],
                value: [pMacId]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset
    }
    async getLicence(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `SELECT 
                        COMP_TAX, PACKET, MAC_ID
                        START_DATE, END_DATE, SELLER,
                        APP, P.NAME AS PACKET_NAME,
                        MENU, USER_COUNT
                        FROM [GenLicence].[dbo].[LICENSES] AS LCS
                        INNER JOIN PACKETS AS P ON LCS.PACKET = P.ID
                        WHERE ((APP = @APP) OR (@APP = '')) `,
                param: ["APP:string|100"],
                value: [pBody.appName]
            }
        )
            console.log(data)
        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset 
    }
    async getCompany(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `SELECT 
                        TAX_NUMBER,
                        TITLE,
                        ADRESS,
                        MAIL,
                        PHONE
                        FROM [GenLicence].[dbo].[COMPANIES]
                        WHERE ((TAX_NUMBER = '') OR ('' = '')) `,
                param: ["APP:string|100"],
                value: [pBody.taxNumber]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset 
    }
    async companyUpdate(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE [GenLicence].[dbo].[COMPANIES]
                        SET TITLE = @TITLE, 
                        ADRESS = @ADRESS, 
                        MAIL = @MAIL,
                        PHONE = @PHONE
                        WHERE TAX_NUMBER = @TAX_NUMBER`,
                param: ['TAX_NUMBER:string|50','TITLE:string|200','ADRESS:string|max','MAIL:string|50','PHONE:string|50'],
                value: [pBody.taxNumber,pBody.title,pBody.adress,pBody.mail,pBody.phone]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordsets
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
    static async successResult(pMessage, pBody = {})
    {
        return {
            "success" : true,
            "message" : pMessage,
            "statusCode" : 200,
            "body": pBody
        }
    }
    static async errorResult(pMessage, pBody = {})
    {
        return {
            "success" : false,
            "message" : pMessage,
            "statusCode" : 404,
            "body": pBody
        }
    }
}
export const _mainLicence = new mainLicence()