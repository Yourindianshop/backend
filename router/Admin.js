const express= require('express');
const router = express.Router();
const {generateUploadUrl,general, login} = require('./Aws');
const pagelimit =5000;

//Admin Authentication
router.post("/loginAdmin",async (req,res)=>{
    login("select * from Admin where email= ?",req,res,false);
});


// MANAGER ACCESS

router.post('/addManager',async (req,res)=>{
    const {Wid,Name,email,password,phoneNo,Status}=req.body;
    const qurey = "insert into Manager (Wid,Name,email,password,phoneNo,Status) values (?,?,?,?,?,?)"
    general(qurey,[Wid,Name,email,password,phoneNo,Status],res);
})
router.delete('/removeManager/:Mid',async (req,res)=>{
    general("delete from Manager where Mid=?",[req.params.Mid],res);
})
router.delete('/rejectManager/:Mid',async (req,res)=>{
    general("update Manager set Wid=NULL where Mid=?",[req.params.Mid],res);
})
router.get('/NullManager',async (req,res)=>{
    general("SELECT * FROM Manager WHERE Wid IS NULL",[],res);
})
router.post("/assignManager",async (req,res)=>{
    const {Mid,Wid}=req.body;
    general("update Manager set Wid=? where Mid=?",[Wid,Mid],res);
})
router.get("/getManagerByWid/:wid",async (req,res)=>{
    const {wid}=req.params;
    general("select * from Manager where Wid=?",[wid],res);
})

// WAREHOUSE MANAGEMENT

router.post('/addWarehouse',async (req,res)=>{
    const {Name,Address, Address2,Landmark,City,Country,State,pincode,Capacity,Status}=req.body;
    const paras = [Name,Address,Address2,Landmark,City,Country,State,parseInt( pincode),Capacity,Status]
    const query = "insert into Warehouses (Name,Address,Address2,Landmark,City,Country,State,pincode,Capacity,Status) values (?,?,?,?,?,?,?,?,?,?)"
    general(query,paras,res);
})
router.get("/selectWarehouseAll",async (req,res)=>{
    general("select * from Warehouses order by time DESC",[],res);
})  
router.get("/changeWs/:wid/:status",async (req,res)=>{
    const {wid,status}=req.params;
    general("update Warehouses set Status=? where Wid=?",[status,wid],res);
})

// PLANS MANAGEMENT

router.post('/addPlan',async (req,res)=>{
    const {Name,status,details,Price,duration,consolidation,storage,storage_price,photo,photoPrice,package_ret,warehouse_pic,scane_copy,shippingAddress}=req.body;
    const qry = "insert into Plans (Name,status,details,Price,duration,consolidation,storage,storage_price,photo,photoPrice,package_ret,warehouse_pic,scane_copy,shippingAddress) values (?,?,?,?,? ,?,?,?,?,?,?,?,?,?)"
    general(qry,[Name,status,details,Price,duration,consolidation,storage,storage_price,photo,photoPrice,package_ret,warehouse_pic,scane_copy,shippingAddress],res)
})
router.post('/editPlan',async (req,res)=>{
    const {Name,status,details,Price,duration,consolidation,storage,storage_price,photo,photoPrice,package_ret,warehouse_pic,scane_copy,shippingAddress}=req.body;
    const qry = "update Plans set Name=?,status=?,details=?,Price=?,duration=?,consolidation=?,storage=?,storage_price=?,photo=?,photoPrice=?,package_ret=?,warehouse_pic=?,scane_copy=?,shippingAddress=? where Pid =?"
    general(qry,[Name,status,details,Price,duration,consolidation,storage,storage_price,photo,photoPrice,package_ret,warehouse_pic,scane_copy,shippingAddress,req.body.Pid],res)    
})
router.get('/onPlan/:pid',async (req,res)=>{
    general("update Plans set status=1 where Pid =?",[req.params.pid],res);
})
router.get("/offPlan/:pid",async (req,res)=>{
    general("update Plans set status=0 where Pid =?",[req.params.pid],res);
})
router.get("/adminPlans",async (req,res)=>{
    general("select * from Plans",[],res);
})

// PRODUCT SECTION MANAGEMENT

router.post('/addproduct',async (req,res)=>{
    const {Name,Details,Price, Images,Available,Oid}=req.body;
    const query = "insert into Products (Name,Details,Price,Images,Available,Oid) values (?,?,?,?,?,?)"
    const params = [Name,Details,parseInt(Price),JSON.stringify(Images),parseInt(Available),Oid]
    general(query,params,res)
})
router.get('/unlistProduct/:pid',async (req,res)=>{
    const {pid}=req.params;
    const query = "update Products set Unlist=1 where Pid=?"
    general(query,[parseInt(pid)],res)
})
router.get('/listProduct/:pid',async (req,res)=>{
    const {pid}=req.params;
    const query = "update Products set Unlist=0 where Pid=?"
    general(query,[parseInt(pid)],res)
})

//PAR Related Request

router.get('/getPARA',async (req,res)=>{
    const {pg}=req.query;
    general("SELECT PAR.*, Customer.email as email FROM PAR JOIN Customer ON PAR.Cid = Customer.Cid ORDER BY PAR.time ASC LIMIT ? OFFSET ?;",[pagelimit,parseInt((pg-1)*pagelimit)],res)
})
router.get('/getPARAll/:cid',async (req,res)=>{
    const {pg}=req.query;
    general("select * from PAR where Cid = ?  ORDER BY time ASC LIMIT ? OFFSET ?",[req.params.cid,pagelimit,parseInt((pg-1)*pagelimit)],res)
})

//Dispach Request Admin 

router.get('/dispachreqAdmin',async (req,res)=>{
    general("select * from DispachReq  order by Time",[],res);
})
router.get('/dispachreqAdmin/:cid',async (req,res)=>{
    general("select * from DispachReq where Did in (select Did from WerehouseData where Cid = ?) order by Time",[req.params.cid],res);
})

//Wallete 

router.get("/getTransaction",async (req,res)=>{
    general("SELECT WalletTransaction.*, Customer.email as email FROM WalletTransaction JOIN Customer ON WalletTransaction.Cid = Customer.Cid ORDER BY WalletTransaction.time DESC;",[],res);
})
router.get("/getTransaction/:cid",async (req,res)=>{
    general("select * from WalletTransaction where Cid=?  order by time DESC ",[req.params.cid],res);
})

// Country Details
router.get("/getCounty",async (req,res)=>{
    general("select * from Contries where Status=1",[],res);
})
router.post('/addCountry',async (req,res)=>{
    const {name,price}=req.body;
    general("insert into Contries (Name,Price) values (?,?)",[name,price],res);
})
router.post("/editCountry",async (req,res)=>{
    const {name,price,cid}=req.body;
    general("update  Contries set Name=?, Price=? where Cno =?",[name,price,cid],res);
})

// MANAGE LANDING PAGE

router.post("/updateLp",async (req,res)=>{
    const {ud}=req.body;
    general("update LandingPhoto set Details=? where Pid=1",[ud],res);
});
router.get("/lp",async (req,res)=>{
    general("select * from LandingPhoto where Pid=1",[],res);
})

// Manage Coupens
router.get("/getAllCoupens",async (req,res)=>{
    general("select * from Coupens order by date DESC",[],res);
})
router.get("/getCouponsForCustomer",async (req,res)=>{
    general("select * from Coupens where isOn=1 and  DATEDIFF(CURRENT_DATE, date) <= days;",[],res);
    // general("select * from Coupens where isOn=1",[],res);
})
router.get("/getCoupons/:cid",async (req,res)=>{
    general("select * from Coupens where Cid = ?",[req.params.cid],res);
})
router.get("/deleteCoupen/:cid",async (req,res)=>{
    general("delete from Coupens where Cid = ?",[req.params.cid],res);
})
router.get("/setCouponsStatus/:cid/:status",async (req,res)=>{
    general("update Coupens set isOn = ? where Cid= ?",[req.params.status,req.params.cid],res);
})
router.get("/CoupenByCode/:code",async (req,res)=>{
    general("select * from Coupens where isOn=1 and code = ?  and  DATEDIFF(CURRENT_DATE, date) <= days;",[req.params.code],res)
})
router.post("/addCoupen",async (req,res)=>{
    const {name,amount,isPercentage,days,maxamount, img,minamount,coupencode}=req.body;
    general("insert into Coupens (Name,amount,isPercentage,days,maxamount,img,minamount,code) values (?,?,?,?,?,?,?,?) " ,[name,amount,isPercentage,days,maxamount,img,minamount,coupencode],res)
})


module.exports=router;