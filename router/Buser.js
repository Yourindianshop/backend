const express= require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('./pool');
const {general, login, generalwithDetails} =require('./Aws') ;
const { SendMail2 } = require('./Mail');
const jwt_code = process.env.JWT_CODE;


// AUTHENTICATION

router.get("/getBusinessCustomer",async (req,res)=>{
    general("select * from businessCustomer",[],res);
})
router.post("/addBusinessCustomer",async (req,res)=>{
    const {email,password, name,phone}=req.body;
    general("insert into businessCustomer (email,password,Name,phone) values (?,?,?,?)",[email,password,name,phone],res);
})
router.post("/loginBusinessCustomer",async (req,res)=>{
    login("select * from businessCustomer where email= ? and isGoogle=0",req,res,0);
})
router.post('/checkBusinessUsertoken',async (req,res)=>{
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
                    general("select * from businessCustomer where email = ?",[email],res);
                }else{
                    res.json({status:'invalid token'});
                }
            }
        });
    } catch (error) {
        res.json({status:'error',error})
    }
})
router.post('/googleLogin',async (req,res)=>{
    const {email,name}=req.body;
    const query = 'insert into Customer (Name,email,isGoogle) values (?, ? ,1)';
    general(query,[ name,email],res);
})
router.get("/getbusinessCustomerbyEmail/:email",(req,res)=>{
    const {email}=req.params;
    const parray = [email];
    const token = giveToken({email,time:Date.now()});
    const query = "select * from businessCustomer where email = ?";
    generalwithDetails(query,parray,res,{token});
})
router.get("/forgotPassBC/:email",async (req,res)=>{
    const email = req.params.email;
    const query = "select * from businessCustomer where email = ? "
    try {
        pool.query(query,[email],async (err,result)=>{
            if(err){
                res.json({status:"Invalid Data error",err});
            }else{
                if(result.length!=0){
                    const password = result[0].password;
                    const subject  = "Forgot Password";
                    const html = ` <h2>Mail from YourIndianShop</h2> <p>Your Password is : <b> ${password} </b></p>`
                    const dt = await SendMail2(email,html,subject);
                    dt?res.json({status:"ok",msg:"ok"}):res.json({status:'not sended'});
                }else{
                    res.json({status:"ok",msg:'User Not Exist'});
                }
            }
        })
    } catch (error) {
        res.json({status:"not sended",error});
    }
})

// WHITE LABELING

router.post("/addBCProductRequest",async (req,res)=>{
    const {Name,Details,Price, Images,Available,Oid}=req.body;
    const query = "insert into Products (Name,Details,Price,Images,Available,Oid,isApproved,isOur) values (?,?,?,?,?,?,0,0)";
    const params = [Name,Details,parseInt(Price),JSON.stringify(Images),parseInt(Available),Oid];
    general(query,params,res);
});
router.get("/getBCProductRequest",async (req,res)=>{
    general("select * from Product where isApproved=0 and isOur=0  ",[],res);
})
router.get("/approveBCProductRequest/:pid",async (req,res)=>{
    const {pid}=req.params;
    general("update Product set isApproved=1 where Pid=?",[pid],res);
});
router.get("/getBCApprovedProduct",async (req,res)=>{
    general("select * from Product where isApproved=1 and isOur=0",[],res);
});
router.get("/getBCProductRequestByOwner/:oid",async (req,res)=>{
    general("select * from Product where  isApproved=0 and isOur=0 and isApproved=0 and Oid=?  ",[req.params.oid],res);
})
router.get("/getBCApprovedProductByOwner/:oid",async (req,res)=>{
    general("select * from Product where isApproved=1 and isOur=0 and isApproved=1 and Oid= ? ",[req.params.oid],res);
});

// router.get("/getWhiteLabelingRequest",async (req,res)=>{
//     general("select * from AssistedPurchase where isCuostome=0",[],res);
// })
router.get('/getWhiteLabelingRequest',async (req,res)=>{
    general("SELECT a.*, c.email as email ,c.Name as name, c.phone as phone FROM AssistedPurchase a JOIN businessCustomer c ON a.Cid = c.Bid and a.isCustomer=0 ORDER BY a.time DESC;",[],res);
});
router.get('/getWhiteLabelingRequestById/:bid',async (req,res)=>{
    general("SELECT a.* from AssistedPurchase a where a.isCustomer=0 and a.Cid=? ORDER BY a.time DESC;",[req.params.bid],res);
});


module.exports=router;