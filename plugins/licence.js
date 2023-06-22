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

        //#region Licence
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
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["appName"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const getLicence = await this.licence.getLicence(req.body)
                
                if(!getLicence || typeof (getLicence.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Licence not found ",{ err: getLicence.err}))
                }

                return res.status(200).send(await result.successResult("success",getLicence))
            }
        })

        this.core.app.post('/licenceSave', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["title","taxNumber","adress","mail","phone","packet","startDate","endDate","seller"]
            const checkResult = this.checkParams(requiredParams,req.body)

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
                req.body["installKey"] = this.generateInstallKey()

                const licenceSave = await this.licence.licenceSave(req.body)

                if(!licenceSave || licenceSave.err)
                {
                    return res.status(404).send(await result.errorResult("Licence could not be registered",{ err: licenceSave.err}))
                }

                return res.status(200).send(await result.successResult("Licence has been successfully created"))
            }
        })

        this.core.app.post('/licenceUpdate', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["guid","taxNumber","packet","startDate","endDate","seller"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const licenceUpdate = await this.licence.licenceUpdate(req.body)

                if(!licenceUpdate || licenceUpdate.err)
                {
                    return res.status(404).send(await result.errorResult("Licence could not be registered",{ err: licenceUpdate.err}))
                }

                return res.status(200).send(await result.successResult("Licence has been successfully updated"))
            }
        })

        this.core.app.post('/macIdUpdate', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["taxNumber","installKey","macId"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const macIdUpdate = await this.licence.macIdUpdate(req.body)

                if(!macIdUpdate || macIdUpdate.err)
                {
                    return res.status(404).send(await result.errorResult("MacId could not be registered",{ err: macIdUpdate.err}))
                }

                return res.status(200).send(await result.successResult("MacId has been successfully updated"))
            }
        })

        this.core.app.post('/licenceDelete', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["guid"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const licenceDelete = await this.licence.licenceDelete(req.body)

                if(!licenceDelete || licenceDelete.err)
                {
                    return res.status(404).send(await result.errorResult("Licence could not be registered",{ err: licenceDelete.err}))
                }

                return res.status(200).send(await result.successResult("Licence has been successfully deleted"))
            }
        })
        //#endregion Licence
        
        //#region Company
        this.core.app.post('/getCompany', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["taxNumber"]
            const checkResult = this.checkParams(requiredParams,req.body)

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
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["title","taxNumber","adress","mail","phone"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                if(typeof companySave[0]?.MSG != 'undefined')
                {
                    return res.status(404).send(await result.errorResult(companySave[0].MSG))
                }

                return res.status(200).send(await result.successResult("Company has been successfully created"))
            }
        })

        this.core.app.post('/companyUpdate', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["title","taxNumber","adress","mail","phone"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

        this.core.app.post('/companyDelete', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["taxNumber"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const companyDelete = await this.licence.companyDelete(req.body)
                
                if(!companyDelete || typeof (companyDelete.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Company could not be registered",{ err: companyDelete.err}))
                }

                if(typeof companyDelete[0]?.MSG != 'undefined')
                {
                    return res.status(404).send(await result.errorResult(companyDelete[0].MSG))
                }

                return res.status(200).send(await result.successResult("Company has been successfully deleted"))
            }
        })
        //#endregion Company

        //#region Packet
        this.core.app.post('/packetSave', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["packetName","appName","menu","userCount","option"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const packetSave = await this.licence.packetSave(req.body)

                if(!packetSave || typeof (packetSave.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Packet could not be registered",{ err: packetSave.err}))
                }

                return res.status(200).send(await result.successResult("Packet has been successfully created"))
            }
        })

        this.core.app.post('/packetUpdate', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["packetName","appName","menu","userCount","option","id"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const packetUpdate = await this.licence.packetUpdate(req.body)

                if(!packetUpdate || typeof (packetUpdate.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Packet could not be registered",{ err: packetUpdate.err}))
                }

                return res.status(200).send(await result.successResult("Packet has been successfully updated"))
            }
        })

        this.core.app.post('/packetDelete', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["id"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const packetDelete = await this.licence.packetDelete(req.body)

                if(!packetDelete || typeof (packetDelete.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Packet could not be registered",{ err: packetDelete.err}))
                }

                if(typeof packetDelete[0]?.MSG != 'undefined')
                {
                    return res.status(404).send(await result.errorResult(packetDelete[0].MSG))
                }

                return res.status(200).send(await result.successResult("Packet has been successfully deleted"))
            }
        })
        //#endregion Packet

        //#region App
        this.core.app.post('/appSave', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["appName"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const appSave = await this.licence.appSave(req.body)

                if(!appSave || typeof (appSave.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("App could not be registered",{ err: packetSave.err}))
                }

                return res.status(200).send(await result.successResult("App has been successfully created"))
            }
        })

        this.core.app.post('/appUpdate', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["appName","id"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const appUpdate = await this.licence.appUpdate(req.body)

                if(!appUpdate || typeof (appUpdate.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("App could not be registered",{ err: appUpdate.err}))
                }

                return res.status(200).send(await result.successResult("App has been successfully updated"))
            }
        })

        this.core.app.post('/appDelete', async (req, res) => 
        {
            const checkReq = await this.checkRequest(req,res)

            if(checkReq) 
            {
                return checkReq
            }

            const requiredParams = ["id"]
            const checkResult = this.checkParams(requiredParams,req.body)

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

                const appDelete = await this.licence.appDelete(req.body)

                if(!appDelete || typeof (appDelete.err) != 'undefined')
                {
                    return res.status(404).send(await result.errorResult("Packet could not be registered",{ err: appDelete.err}))
                }

                if(typeof appDelete[0]?.MSG != 'undefined')
                {
                    return res.status(404).send(await result.errorResult(appDelete[0].MSG))
                }

                return res.status(200).send(await result.successResult("App has been successfully deleted"))
            }
        })
        //#endregion App
    }
    async checkRequest(pReq,pRes)
    {
        if (!pReq.body || Object.keys(pReq.body).length === 0) 
        {
            return pRes.status(404).send(await result.errorResult("Missing Parameters"));
        }

        if(!pReq.headers['authorization'])
        {
            return pRes.status(404).send(await result.errorResult("Token Not Found"))
        }
    }
    checkParams(pRequiredParams,pReqBody)
    {
        const paramsToCheck = {};

        pRequiredParams.forEach(param => {
            paramsToCheck[param] = pReqBody[param] || "";
        });

        for (const param in paramsToCheck) 
        {
            if (!paramsToCheck[param] || paramsToCheck[param].trim() === '') 
            {
                return { success: false, message: `${param} is required` };
            }
        }
        
        return { success: true };
    }
    generateInstallKey()
    {
        let key = Math.floor(100000 + Math.random() * 900000);

        if (key >= 1000000) {
            key = Math.floor(key / 10);
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
    async licenceDelete(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `DELETE [dbo].[LICENSES] WHERE GUID = @GUID `,
                param: ['GUID:string|50'],
                value: [pBody.guid]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async licenceUpdate(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE [GenLicence].[dbo].[LICENSES]
                        SET COMP_TAX = @TAX_NUMBER, 
                        PACKET = @PACKET, 
                        START_DATE = @START_DATE,
                        END_DATE = @END_DATE
                        WHERE GUID = @GUID`,
                param: ['TAX_NUMBER:string|50','PACKET:int','START_DATE:datetime','END_DATE:datetime','GUID:string|50'],
                value: [pBody.taxNumber,pBody.packet,pBody.startDate,pBody.endDate,pBody.guid]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : true
    }
    async macIdUpdate(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE [GenLicence].[dbo].[LICENSES]
                        SET MAC_ID = @MAC_ID 
                        WHERE TAX_NUMBER = @TAX_NUMBER AND INSTALL_KEY = @INSTALL_KEY`,
                param: ['TAX_NUMBER:string|50','INSTALL_KEY:string|15','MAC_ID:string|100'],
                value: [pBody.taxNumber,pBody.packet,pBody.startDate,pBody.endDate,pBody.guid]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : true
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

        return typeof data.result.err != 'undefined' ? data.result : data.result.recordset 
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

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
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

        return typeof data.result.err != 'undefined' ? data.result : true
    }
    async companyDelete(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `IF EXISTS ( SELECT COMP_TAX FROM [dbo].[LICENSES] WHERE COMP_TAX = @TAX_NUMBER) BEGIN
                            SELECT 'This company has a license record. Record cannot be deleted.' AS MSG 
                        END
                        ELSE BEGIN
                            DELETE [dbo].[COMPANIES] WHERE TAX_NUMBER = @TAX_NUMBER
                        END`,
                param: ['TAX_NUMBER:string|50'],
                value: [pBody.taxNumber]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async packetSave(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `INSERT INTO [dbo].[PACKETS] (
                            [NAME], [APP], [MENU], [USER_COUNT], [OPTION]
                        ) VALUES (
                            @NAME, @APP, @MENU, @USER_COUNT, @OPTION
                        )`,
                param: ['NAME:string|50','APP:string|50','MENU:string|max','USER_COUNT:int','OPTION:string|max'],
                value: [pBody.packetName,pBody.appName,pBody.menu,pBody.userCount,pBody.option]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async packetUpdate(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE [dbo].[PACKETS] 
                            [NAME] = @NAME, [APP] = @APP, [MENU] = @MENU, [USER_COUNT] = @USER_COUNT, [OPTION] = @OPTION
                        WHERE ID = @ID `,
                param: ['NAME:string|50','APP:string|50','MENU:string|max','USER_COUNT:int','OPTION:string|max','ID:int'],
                value: [pBody.packetName,pBody.appName,pBody.menu,pBody.userCount,pBody.option,pBody.id]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async packetDelete(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `IF EXISTS ( SELECT PACKET FROM [dbo].[LICENSES] WHERE PACKET = @ID) BEGIN
                            SELECT 'This packet has a license record. Record cannot be deleted.' AS MSG 
                        END
                        ELSE BEGIN
                            DELETE [dbo].[PACKETS] WHERE ID = @ID
                        END`,
                param: ['ID:int'],
                value: [pBody.id]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async appSave(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `INSERT INTO [dbo].[APPS] (
                            [NAME]
                        ) VALUES (
                            @NAME
                        )`,
                param: ['NAME:string|50'],
                value: [pBody.appName,]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async appUpdate(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `UPDATE [dbo].[APPS] 
                            [NAME] = @NAME
                        WHERE ID = @ID `,
                param: ['NAME:string|50','ID:int'],
                value: [pBody.appName,pBody.id]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
    }
    async appDelete(pBody)
    {
        const data = await this.core.sql.execute
        (
            {
                query: `IF EXISTS ( SELECT APP FROM [dbo].[PACKETS] WHERE APP = @ID) BEGIN
                            SELECT 'This app has a license record. Record cannot be deleted.' AS MSG 
                        END
                        ELSE BEGIN
                            DELETE [dbo].[APPS] WHERE ID = @ID
                        END`,
                param: ['ID:int'],
                value: [pBody.id]
            }
        )

        return typeof data.result.err != 'undefined' ? data.result : (typeof data.result.recordset != 'undefined' ? data.result.recordset : true)
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