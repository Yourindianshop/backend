const express= require('express');
const router = express.Router()
const jwt = require('jsonwebtoken');
const {generateUploadUrl,deleteObject,general,general2,login, UpdateBillCustomer, giveToken, generalwithDetails} = require('./Aws')
const jwt_code = process.env.JWT_CODE;
const {SendMail2} = require('./Mail');
const pool = require('./pool');
const multer = require('multer');
const pagelimit = 50000;

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/'); // Specify the folder where uploaded files will be stored
//     },
//     filename: (req, file, cb) => {
//         const name = file.originalname.split(".");
//         const final= name[name.length-1];
//       cb(null, Date.now() + '.' + final);
//     }
//   });
//   const upload = multer({ storage: storage });
  
// router.post("/uploadfile", upload.single('image'), (req, res) => {
//     if (!req.file) {
//         return res.json({status:'No file uploaded.'});
//     }
//     const fileName = req.file.filename;
//     res.json({status:'ok',name: fileName});
// });
// router.post("/uploadMultipleFile", upload.array("images"), (req, res) => {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).send('No files uploaded.');
//     }
//     let files = [];
//     req.files.forEach(file => {
//       files.push(file.filename);
//     });
//     res.send({status:'ok',files});
// });

router.get("/getpktinfo/:cid",(req,res)=>{
    const cid = req.params.cid
    general("SELECT COUNT(*) AS Delivered, SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) AS Dispatched, SUM(CASE WHEN status <= 2 THEN 1 ELSE 0 END) AS Locker FROM WerehouseData WHERE Cid = ?;",[cid,cid,cid],res);
})

router.get('/getCustomer',(req,res)=>{
    const query = "select * from Customer"
    general(query,[],res);
});
router.get('/getCustomer/:id',(req,res)=>{
    const {id}=req.params;
    const query = "select * from Customer where Cid = ?"
    const parray = [id];
    general(query,parray,res)
})
router.get("/getCustomerbyEmail/:email",(req,res)=>{
    const {email}=req.params;
    const parray = [email];
    const token = giveToken({email,time:Date.now()});
    const query = "select * from Customer where email = ?"
    generalwithDetails(query,parray,res,{token} );
})

// AUTHENTICATION
router.get("/forgotPass/:email",async (req,res)=>{
    const email = req.params.email;
    const query = "select * from Customer where email = ? "
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

router.post('/addUser',async (req,res)=>{
    const body = req.body;
    const query = 'insert into Customer (Name,Address,Address2,Landmark,City,Country,State,pincode,email,password,phoneNo,Status) values (?,?,?,?,?,?,?,?,?,?,?,0)'
    const params = [body.Name,body.Address,body.Address2,body.Landmark,body.City,body.Contry,body.State,body.pincode,body.email,body.password,body.phoneNo];
    general(query,params,res)
})  
router.post('/loginUser',async( req,res)=>{
    pool.query("update Customer set Time = CURRENT_TIMESTAMP where Email = ?",[req.body?.email]);
    login("select * from Customer where email= ? and isGoogle=0",req,res,1);
})
router.post('/checkUsertoken',async (req,res)=>{
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
                    general("select * from Customer where email = ?",[email],res);
                }else{
                    res.json({status:'invalid token'})
                }
            }
        });
    } catch (error) {
        res.json({status:'error',error})
    }
})
router.post('/googleLogin',async (req,res)=>{
    const {email,name}=req.body;
    const query = 'insert into Customer (Name,email,Status,isGoogle) values (?, ? , 0,1)';
    general(query,[ name,email],res);
})

// PRODUCT RELATED REQUESTS

router.get('/getproducts/:prev',async (req,res)=>{
    const {prev}=req.params;
    const query = "select * from Products  limit ? , 5 "
    general(query,[parseInt(prev)],res)
})
router.post('/makeOrder',async (req,res)=>{
    const {cid,pid,qtn,Oprice}=req.body;
    const query = "insert into Orders (Cid,Pid,Qty,Oprice) values (?,?,?,?)"
    general(query,[parseInt(cid),parseInt(pid),parseInt(qtn),parseInt(Oprice)],res)
})

// BUYING PLAN CREDENTIALS

router.get('/plans',async (req,res)=>{
    general("select * from Plans where status=1",[],res);
})
router.post('/buyplan',async (req,res)=>{
    const { cid,pid,wid,paid,renew,fs}=req.body;
    const qry = "insert into PlansCustomer (Cid,Pid,Wid, paid,renewIn,planDays,freeStorage) values (?,?,?,?,?,?,?)"
    general(qry,[cid,pid,wid,paid,renew,renew,fs],res);
})
router.post('/upgradePlan',async (req,res)=>{
    const {tid,plan}=req.body;
    const query = "update PlansCustomer set Pid=? ,paid=?, renewIn=?, planDays=? ,freeStorage=?, startDate=CURRENT_TIMESTAMP where tid = ?"
    general(query,[plan.Pid,plan.Price,plan.duration,plan.duration,plan.storage,tid],res);
})
router.get('/upadateUserStatus/:cid/:status',(req,res)=>{
    const {cid,status}=req.params;
    general("update Customer set Status = ? where Cid = ?",[status,cid],res);
})
router.get('/getPlan/:cid/:wid',async (req,res)=>{
    const {cid,wid}=req.params;
    const query = "(select * from Plans where Pid in (select Pid from PlansCustomer where Cid=? and Wid=? and renewIn != 0 )) union (select * from Plans where Price =0 )";
    general(query,[cid,wid],res);
});


// MAKE PRODUCT ACCEPTANCE REQUEST

router.post('/makePAR',async (req,res)=>{
    const {cid,wid,proof,name,desc}=req.body;
    const qry = "insert into PAR (Cid,Wid,proof,productName,Description) values (?,?,?,?,?)"
    general(qry,[cid,wid,proof,name,desc],res);
})
router.get('/getPAR/:cid/:wid',async (req,res)=>{
    const {cid,wid}=req.params;
    general("select * from PAR where Cid = ? and wid = ? order by time DESC",[parseInt(cid),parseInt(wid)],res)
})
router.get("/getPc/:cid/:wid", async (req,res)=>{
    const {cid,wid}=req.params;
    general("select * from PlansCustomer where Cid=? and Wid=? ",[parseInt(cid),parseInt(wid)],res);
})

// WAREHOUSE RELATED REQUESTS

router.get('/Warehouses',async (req,res)=>{
    general("select * from Warehouses where Status=1",[],res);
})
router.get('/selectWarehouse/:cid',async (req,res)=>{
   general("select * from Warehouses where Status=1 and Wid not in (select Wid from PlansCustomer where Cid = ?)",[req.params.cid],res); 
})
router.get('/Warehouse/:cid',async (req,res)=>{
   general("select * from Warehouses where Status=1 and Wid in (select Wid from PlansCustomer where Cid = ?)",[req.params.cid],res); 
})
router.get('/WarehousesbyId/:id',async (req,res)=>{
    const {id}=req.params;
    general("select * from Warehouses where Wid = ?",[id],res)
})
router.get('/Warehouses/:country',async (req,res)=>{
    const {country}=req.params;
    general("select * from Warehouses where Country = ?",[country],res)
})
router.get('/Warehouses/:country/:state',async (req,res)=>{
    const {country,state}=req.params;
    general("select * from Warehouses where Country = ? and State= ?",[country,state],res)
})

//Add WAREHOUSEDATA RELATED QUERYS

router.get('/getWareHouseData/:wid/:cid',async (req,res)=>{
    const {wid,cid}=req.params;
    general("select * from WerehouseData, PAR  where  WerehouseData.Rid=PAR.Rid and WerehouseData.Wid=?  and WerehouseData.Cid=? and WerehouseData.status not in (3,4)",[parseInt(wid),parseInt(cid)],res);
})
router.get("/getPastDispatchedWHdata/:wid/:cid",async (req,res)=>{
    general("select * from WerehouseData, PAR  where  WerehouseData.Rid=PAR.Rid and WerehouseData.Wid=?  and WerehouseData.Cid=? and WerehouseData.status=3",[parseInt(wid),parseInt(cid)],res);
})
router.get("/getPastReturnedWHdata/:wid/:cid",async (req,res)=>{
    general("select * from WerehouseData, PAR  where  WerehouseData.Rid=PAR.Rid and WerehouseData.Wid=?  and WerehouseData.Cid=? and WerehouseData.status=4",[parseInt(wid),parseInt(cid)],res);
})
router.get("/checkDispcah/:Did",async  (req,res)=>{
    const {Did}=req.params;
    general("select count(*) as num from DispachReq where Did=?",[Did],res);
})
router.get('/checkReturn/:Did',async (req,res)=>{
    const {Did}=req.params;
    general("select count(*) as num from returnReq where Did=?",[Did],res);
})
router.get('/getWareDataonReq/:rid',async (req,res)=>{
    const {rid}=req.params;
    general("select *  from WerehouseData where Rid=?",[rid],res);
})
router.get('/wdcountforprice/:wid/:cid',async (req,res)=>{
    const {wid,cid}=req.params;
    general("select count(*) as count from WerehouseData where Wid=? and Cid=? and status = 0",[parseInt(wid),parseInt(cid)],res)
}) 
router.get("/updateWdstatus/:Did/:status",async (req,res)=>{
    const {Did,status}=req.params;
    general("update WerehouseData set status=? where Did = ?",[status,Did],res);
})
router.get("/updateMulWdstatus/:status/:dids",async (req,res)=>{
    const {status,dids}=req.params;
    general(`update WerehouseData set status=? where Did in ${dids}`,[status],res);
})

// RETURN REQUSTS

router.get("/returnReq/:Did", async (req,res)=>{
    const {Did}=req.params;
    general("insert into returnReq (Did) values (?)",[Did],res);
})
router.get('/getReturnReq/:cid/:wid',async (req,res)=>{
    const query = "select * from returnReq where Did in (select Did from WerehouseData where Cid = ? and Wid=?) order by Time DESC";
    const {cid,wid}=req.params;
    general(query,[cid,wid],res);
})

// WALLETE RELATED REQUSETS

router.post('/transaction',async (req,res)=>{
    const {Cid,amount,note}=req.body;
    const query = "insert into WalletTransaction (Cid,amount,note) values (?,?,?)";
    general(query,[Cid,amount,note],res)
})
router.get('/updateWallate/:cid',async (req,res)=>{
    const query ="update Customer set Wallete = (select sum(amount) from WalletTransaction where Status=0 and Cid=?) where Cid = ?"
    general(query,[parseInt(req.params.cid),parseInt(req.params.cid)],res);
})
router.get("/transaction/:cid",async (req,res)=>{
    const {pg}=req.query ;
    general("select * from WalletTransaction where Cid = ? order by time DESC LIMIT ? OFFSET ?",[req.params.cid,pagelimit,parseInt((pg-1)*5)],res);
})
router.get("/CountTra/:cid",async (req,res)=>{
    general("select count(*) from WalletTransaction where Cid=?",[req.params.cid],res);
})

// PRODUCT RELATED REQUEST

router.get('/Products',async (req,res)=>{
    general("select * from Products where Unlist = 0 and isApproved=1",[],res);
})

// ASISTED PURCHASE REQUEST

router.post("/assistedReq",async (req,res)=>{
    const query = "insert into AssistedPurchase (Cid,Wid,Name,Brand,Description,Other,Images) values (?,?,?,?,?,?,?)"
    const {form}=req.body;
    general(query,[form.cid,form.wid,form.Name,form.Brand,form.Description,form.Other,form.Images],res);
})
router.post("/assistedReqforBC",async (req,res)=>{
    const query = "insert into AssistedPurchase (Cid,Wid,Name,Brand,Description,Other,Images,isCustomer,Country) values (?,?,?,?,?,?,?,0,?)"
    const {form}=req.body;
    general(query,[form.cid,form.wid,form.Name,form.Brand,form.Description,form.Other,form.Images,form.Country],res);
})
router.get('/getAPR/:cid',async (req,res)=>{
    general("select * from AssistedPurchase where Cid = ? order by time DESC",[req.params.cid],res);
})

// DISPACH REQUEST

router.get('/getDispachReq/:cid/:wid',async (req,res)=>{
    const query = "select * from DispachReq where Did in (select Did from WerehouseData where Cid = ? and Wid=?) order by Time DESC";
    const {cid,wid}=req.params;
    general(query,[cid,wid],res);
})
router.post("/addDispachReq",async (req,res)=>{
    const query = "Insert into DispachReq (Did,Name,Email,Address,Address2,phoneNo,City,State,Country,pincode,Dinstruct) values (?,?,?,?,?,?,?,?,?,?,?)";
    const {form}=req.body;
    general(query,[form.Did,form.fullName,form.email,form.ad,form.ad2,form.phone,form.city,form.state,form.country,form.pincode,form.Di],res);
})
router.post("/addMulDispachReq",async (req,res)=>{
    const query = "Insert into DispachReq (Did,isMul,Name,Email,Address,Address2,phoneNo,City,State,Country,pincode,Dinstruct) values (?,?,?,?,?,?,?,?,?,?,?,?)";
    const {form,dids}=req.body;
    general(query,[form.Did,dids,form.fullName,form.email,form.ad,form.ad2,form.phone,form.city,form.state,form.country,form.pincode,form.Di],res);
})

// BILL ACOUNT RELATED REQUEST
// router.get("/cqury", async (req,res)=>{
//     await UpdateBillCustomer(res);
// })
router.get("/getBills/:cid/:wid",async (req,res)=>{
    general("select *  from billAccount where status=0 and Did in (select Did from WerehouseData where Cid=? and Wid=?)",[req.params.cid,req.params.wid],res);
})
router.get("/getPaymentHistory/:Bid",async (req,res)=>{
    general("select * from payment where Bid = ?",[req.params.Bid],res);
})
router.post("/makePayment",async (req,res)=>{
    const {Bid, amount}=req.body;
    const dt = general("insert into payment (Bid,amount) values (?,?)",[Bid,amount],res);
})
router.post("/allPayments",async (req,res)=>{
    const {bills}=req.body;
    let qryval = "";
    bills.forEach((b,index)=>{
        if(bills.length==1 || index== bills.length-1){
            qryval += `(${b.Bid},${b.amount}) `
        }else{
            qryval += `(${b.Bid},${b.amount}), `
        }
    })
    general(`insert into payment (Bid,amount) values ${qryval}`,[],res)
})

router.get("/updateAllBillAmount/:cid/:wid",async (req,res)=>{
    general("update billAccount set amount=0 where status=0 and Did in (select Did from WerehouseData where Cid=? and Wid = ?)",[req.params.cid, req.params.wid],res);
})
router.post("/updatebillAmount", async (req,res)=>{
    const {amount,Bid}=req.body;
    general("update billAccount set amount=amount-? where Bid=? ",[amount,Bid],res);
})      
router.get("/changeBillStatus/:Did",async (req,res)=>{
    general("update billAccount set status=1 where Did = ?",[req.params.Did],res);
})  
router.get("/changeAllBillStatus/:dids",async (req,res)=>{
    const {dids}=req.params;
    general(`update billAccount set status=1 where Did in ${dids}`,[],res);
})  

router.get("/getPayableAmount/:Did",async (req,res)=>{
    general("select sum(amount) as amount from billAccount where Did= ? ",[(req.params.Did)],res);
})

// PACKETS RELATED REQUEST
router.get("/packages/:cid/:wid",async (req,res)=>{
    const {cid,wid}=req.params;
    general("select * from packages where Cid = ? and Wid= ?",[cid,wid],res);
})
router.get("/getSp",async (req,res)=>{
    general("select * from ServiceProvider where status=1",[],res);
})
router.get("/addSptoPackets/:pid/:sp",async (req,res)=>{
    const {sp,pid}=req.params;
    general("update packages set Sp=? where Pid=?",[sp,pid],res);
});

//LANDING PAGE REQUEST
router.get("/landingpagePhotos",async (req,res)=>{
    general("select Details from LandingPhoto where Pid=1",[],res);
})

// AWS S3 REQUEST GENERAL REQUEST

router.get('/geturl/:filetype',async (req,res)=>{
    try {
        const {filetype}=req.params;
        const url =await generateUploadUrl(filetype);
        res.json({status:'ok',url});
    } catch (error) {
        res.json({error});
    }
});
router.post('/getMultipleUrl',async (req,res)=>{
    try {
        const {filetypes}=req.body;
        const urls = []
        await filetypes.forEach(async (t,i) => {
            const url =await generateUploadUrl(t);
            urls.push(url)
            if(i==filetypes.length-1){
                res.json({status:'ok',urls});
            }
        });
    } catch (error) {
        res.json({error});
    }
});

router.get('/sendVerifyMail/',async (req,res)=>{
    const randomNumbers = Array.from(new Array(6), () => Math.floor(Math.random() * 10));
    const OTP = randomNumbers.join('');
    const text = "Your Verification Code is \n"+OTP;
    const res2 = await SendMail("v@g.com","Verification Mail",text);
    console.log(OTP)
    if(res2){
        res.json({status:'ok',OTP});
    }else{
        res.json({status:"not send"});
    }
});


// REVIEW SECTION (Review,Star,Cid)

router.post('/addReview',async (req,res)=>{
    const {Review,Star,Cid}=req.body;
    general("insert into Review (Review,Star,Cid) values (?,?,?)",[Review,Star,Cid],res);
})
router.get("/Review",async (req,res)=>{
    general("select Review , Star , Name, Rid from Review r, Customer c where c.Cid=r.Cid;",[],res);
});


// Request for More Photos


module.exports=router;