const express= require('express');
const router = express.Router()
const {general,login, sendEmailForExpiredPlan} = require('./Aws')
const jwt = require('jsonwebtoken');
const  emailjs = require('@emailjs/browser');
const {SendMail2,MultipleMail }= require('./Mail');
const jwt_code = process.env.JWT_CODE;

//AUTHENTICATION

router.post('/loginManager',async( req,res)=>{
    login("select * from Manager where email= ? and Wid is not NULL",req,res,0);
})

router.post('/checkManagertoken',async (req,res)=>{
    try {
        const {token}=req.body;
        jwt.verify(token, jwt_code, (err, decoded) => {
            if (err) {
                res.json({status:'invalid token'})
            } else {
                const valid = 259200000;
                const time = decoded.time;
                const curtime = Date.now()-valid;
                if(time>curtime){
                    const email = decoded.email;
                    general("select * from Manager where email = ?",[email],res);
                }else{
                    res.json({status:'invalid token'})
                }
            }
        });
    } catch (error) {
        res.json({status:'error',error})
    }
})
router.get('/getCustomerByRid/:Rid',async (req,res)=>{
  general("select Cid, email from Customer where Cid in ( select Cid from PAR where Rid=? )",[req.params.Rid],res);  
});
router.get('/getCustomerBySid/:Did',async (req,res)=>{
  general("select Cid, email from Customer where Cid in ( select Cid from WerehouseData where Did in (select Did from DispachReq where Sid=? ) )",[req.params.Did],res);  
});

// PRODUCT ACCEPTANCE REQUEST MANAGEMENT

router.get('/getPAR/:wid',async (req,res)=>{
    general("SELECT PAR.*, Customer.email AS email FROM PAR INNER JOIN Customer ON PAR.Cid = Customer.Cid WHERE PAR.Wid = ? ORDER BY PAR.time DESC;",[req.params.wid],res);
})
router.get("/getPARP/:wid",async (req,res)=>{
    query_string = "SELECT PAR.*, Customer.email as email,PlansCustomer.RenewIn as RenewIn FROM PAR JOIN PlansCustomer ON PAR.Wid = PlansCustomer.Wid AND PAR.Cid = PlansCustomer.Cid JOIN Customer ON PAR.Cid = Customer.Cid WHERE PAR.Wid = ? ORDER BY CASE WHEN PlansCustomer.RenewIn = -1 THEN 1 ELSE 0 END, CASE WHEN PlansCustomer.RenewIn = -1 THEN NULL ELSE PlansCustomer.RenewIn END ASC;"
    general(query_string,[req.params.wid],res);
})
router.get('/verifyPAR/:rid', async (req,res)=>{
    general("update PAR set Verify = 2 where Rid=?",[req.params.rid],res)
})
router.get("/submitPAR/:rid",async (req,res)=>{
    general("update PAR set Verify = 1 where Rid=?",[req.params.rid],res)
})
router.delete('/rejectPAR/:rid',async (req,res)=>{
    general("delete from PAR where rid = ?",[req.params.rid],res);
})
router.get("/getCustomerManager/:wid",async (req,res)=>{  
    const query = "select * from Customer where Cid in (select Cid from PlansCustomer where Wid = ?)";
    general(query,[parseInt(req.params.wid)],res);
})

// WAREHOUSE DATA MANAGEMENT

router.post('/addWareHouseData',async (req,res)=>{
    const {Wid,height,width,length,Weight,Cid,Rid,photos,LokerId}=req.body;
    const qry = "insert into WerehouseData (Wid,height,width,length,Weight,Cid,Rid,photos,LokerId) values (?,?,?,?,?,?,?,?,?)"
    const params = [Wid,height,width,length,Weight,Cid,Rid,JSON.stringify(photos),LokerId ];
    general(qry,params,res);
})
router.post("/addWdPayment",async (req,res)=>{
    const {Rid,note}=req.body;
    general('INSERT INTO billAccount (Did, title) SELECT Did, ? FROM WerehouseData WHERE Rid = ? LIMIT 1;',[note,Rid],res);
})
router.get('/getWareHouseData/:wid',async (req,res)=>{
    const {wid}=req.params;
    general("select * from WerehouseData  where Wid= ? ",[parseInt(wid)],res);
})  


// WAREHOUSE RELATED REQUEST

router.get("/getWareSinglehouse/:wid",async (req,res)=>{
    general("select * from Warehouses where Wid=?",[req.params.wid],res);
})

// DISPACH REQUEST

router.get('/dispachreq/:wid',async (req,res)=>{
    general("select * from DispachReq where Did in (select Did from WerehouseData where Wid=?) order by Time DESC",[req.params.wid],res);
})
router.get("/getDispachRelData/:Did",async (req,res)=>{
    const query ="select * from PAR p,WerehouseData w,Customer c where w.Rid=p.Rid and w.Cid=c.Cid and Did = ? ";
    general(query,[req.params.Did],res);
})
router.get("/Dispatch/:Sid",async (req,res)=>{
    const query = "update DispachReq set Status=2 where Sid=?";
    general(query,[req.params.Sid],res);
})

// asisted Purchase Section;

router.get('/getAPRManager',async (req,res)=>{
    general("SELECT a.*, c.email as email FROM AssistedPurchase a JOIN Customer c ON a.Cid = c.Cid and a.isCustomer=1 ORDER BY a.time DESC;",[],res);
});

// country related request
router.get("/getPriceCountry/:name",async (req,res)=>{
    general("select Price from Contries where Name = ?",[req.params.name],res);
})

// customer Related request
router.get("/getCusWhUsingSid/:sid",async (req,res)=>{
    general("select Cid, Wid from WerehouseData where Did in (select Did from DispachReq where Sid = ?)",[req.params.sid],res);
})
// make packet
router.post("/addPacket",async (req,res)=>{
    const {sid,cid,wid,length,width,height,wight,payment}=req.body;
    general("insert into packages (Sid,Cid,Wid,length,width,height,wight,payment) values (?,?,?,?,?,?,?,?)",[sid,cid,wid,length,width,height,wight ,payment],res);
})  
router.post("/addMulPacket",async (req,res)=>{
    const {sid,cid,wid,dt}=req.body;
    const pd = JSON.parse(dt);
    let qryval = " ";
    pd.forEach((b,index)=>{
        if(pd.length==1 || index == pd.length-1){
            qryval += `(${sid},${cid},${wid},${b[0]},${b[1]},${b[2]},${b[3]},${Math.round(b[4])}) `
        }else{
            qryval += `(${sid},${cid},${wid},${b[0]},${b[1]},${b[2]},${b[3]},${Math.round(b[4])}), `
        }
    })
    // console.log(qryval);
    general(`insert into packages (Sid,Cid,Wid,length,height,width,wight,payment) values ${qryval}`,[],res);
}) 
router.get("/getPkts/:wid",async (req,res)=>{
    general("SELECT packages.*, Customer.email FROM packages JOIN Customer ON packages.Cid = Customer.Cid WHERE packages.Wid = ? ORDER BY packages.time DESC;",[req.params.wid],res)
})
router.get("/dispatchPacket/:pid",async (req,res)=>{
    general("update packages set Status=1 where Pid=? ",[req.params.pid],res);
})
router.get("/SetDispatchInDispachReq/:pid", async (req,res)=>{
    general("update DispachReq set Status=1 where Sid in ( select Sid from packages where Pid=? )",[req.params.pid],res);
})
router.get("/updateWdstatusOnPid/:pid/:status",async (req,res)=>{
    general("update WerehouseData set status=? where Did in ( select Did from DispachReq where Sid in ( select Sid from packages where Pid= ? )  )",[req.params.status,req.params.pid],res);
})

router.post('/sendMail',async (req,res)=>{
    const {email,subject,html}=req.body;
    try {
        const dt = await SendMail2(email,html,subject);
        dt?res.json({status:"ok"}):res.json({status:'not sended'});
    } catch (error) {
        res.json({status:"not sended"});
    }
})

// router.get("/sendMail",async (req,res)=>{
//     const dt = await sendEmailForExpiredPlan();
//     res.json({status:'ok',dt})
// })
module.exports= router;