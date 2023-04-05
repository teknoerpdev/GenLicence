import {core, datatable}  from '../bin/core/core.js'
import {io} from 'socket.io-client'
import moment from 'moment'
import crypto from 'crypto'
function uuidv4() 
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) 
    {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16).toUpperCase();
    });
}   
async function run()
{
    let tmpcore = new core(io('http://localhost',{timeout:100000}));
    await tmpcore.auth.login('ATest','1','POS')
    
    let x = await tmpcore.sql.execute
    (
        {
            query:"SELECT * FROM ITEMS",
            connection:
            {
                server: "192.168.1.75",
                database: "NANCY",
                user: "piqpos", 
                password: "1122334455", 
                connectionTimeout: 15000,
                requestTimeout: 15000,
                options: 
                {
                    trustedConnection: false,
                    trustServerCertificate: true
                }              
            }
        }
    )
    console.log(x)
    // let tmpDt = new datatable()
    // tmpDt.insertCmd = 
    // {
    //     query : "EXEC [dbo].[PRD_POS_SALE_INSERT_TEST] @CUSER = 'ALOOO', @AMOUNT = @PAMOUNT, @FAMOUNT = @PFAMOUNT, @VAT = @PVAT, @TOTAL = @PTOTAL, @DISCOUNT = @PDISCOUNT, @LOYALTY = @PLOYALTY,@POS = @PPOS,@PROMO_TYPE = @PPROMO_TYPE", 
    //     param : ['PAMOUNT:float','PFAMOUNT:float','PVAT:float','PTOTAL:float','PDISCOUNT:float','PLOYALTY:float','PPOS:string|50','PPROMO_TYPE:int'],
    //     dataprm : ['AMOUNT','FAMOUNT','VAT','TOTAL','DISCOUNT','LOYALTY','POS','PROMO_TYPE']
    // } 

    // let myFn = (p) =>
    // {
    //     return setTimeout(() => 
    //     {
    //         console.log(p)
    //     }, 2000);
    // }
    

    // setTimeout(async() => 
    // {
    //     let m0 = myFn(100)

    //     tmpDt.push({AMOUNT:1,FAMOUNT:1,VAT:0,TOTAL:2,DISCOUNT:0,LOYALTY:0,POS:'00000000-0000-0000-0000-000000000000',PROMO_TYPE:0})
    //     let x = await tmpDt.update()

    //     if (x == 0)
    //     {
    //         console.log(10)
    //         clearTimeout(m0)
    //     }
        
    // }, 1000);
    
    // setTimeout(async() => 
    // {
    //     let m1 = myFn(101)

    //     tmpDt.push({AMOUNT:1,FAMOUNT:1,VAT:0,TOTAL:2,DISCOUNT:0,LOYALTY:0,POS:'00000000-0000-0000-0000-000000000000',PROMO_TYPE:1})
    //     let x = await tmpDt.update()
    //     if (x == 0)
    //     {
    //         console.log(11)
    //         clearTimeout(m1)
    //     }
    // }, 1000);

    // setTimeout(async() => 
    // {
    //     let m2 = myFn(102)

    //     tmpDt.push({AMOUNT:1,FAMOUNT:1,VAT:0,TOTAL:2,DISCOUNT:0,LOYALTY:0,POS:'00000000-0000-0000-0000-000000000000',PROMO_TYPE:0})
    //     let x = await tmpDt.update()
    //     if (x == 0)
    //     {
    //         console.log(12)
    //         clearTimeout(m2)
    //     }
    // }, 1000);
    
}

run()