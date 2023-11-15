
const aws = require('aws-sdk');
const pool = require('../router/pool');
const jwt = require('jsonwebtoken');
const path = require('path');
const { MultipleMail } = require('./Mail');

const jwt_code = process.env.JWT_CODE;

async function generateUploadUrl(filetype){
    // const region = process.env.REGION;
    // const secretkey = process.env.SECRET_ACCESS_KEY;
    // const accesskey = process.env.ACCESS_KEY;
    // const bucketName = process.env.BUCKET; 
    // const s3 = new aws.S3({
    //     region,
    //     accessKeyId:accesskey,
    //     secretAccessKey:secretkey,
    //     signatureVersion:'v4',
    // });
    // const imageName =((Date.now().toString())+'.'+filetype).toString();
    // const params = ({
    //     Bucket: bucketName,
    //     Key: imageName,
    //     Expires: 60
    // })
    // const uploadURL = await s3.getSignedUrlPromise('putObject',params);
    
    // return uploadURL;
}
async function deleteObject(filename){
    const params1= ({
        Bucket: bucketName,
        Key: filename
    })
    s3.deleteObject(params1, (err, data) => {
        if (err) {
            console.log(err)
            return false
        }else{
            return true
        }
    })
}
function general(query,paray,res){
    try {
        pool.query(query,paray,(err,result)=>{
            if(err){
                res.json({status:"Invalid Data error",err});
            }else{
                res.json({status:"ok",result});
            }
        })
    } catch (error) {
        res.json({status:"error"});
    }
}
async function generalwithDetails(query,paray,res,det){
    try {
        pool.query(query,paray,(err,result)=>{
            if(err){
                res.json({status:"Invalid Data error",err});
            }else{
                res.json({status:"ok",result,det});
            }
        })
    } catch (error) {
        res.json({status:"error"});
    }
}
async function general2(query,paray){
    try {
        pool.query(query,paray,(err,result)=>{
            if(err){
                return {status:"Invalid Data error",err};
            }else{
                return {status:"ok",result};
            }
        })
    } catch (error) {
        return {status:"error"};
    }
}
async function updateRenew(){
    const qury = "UPDATE PlansCustomer SET 	renewIn = renewIn - 1  WHERE renewIn > 0"
    try {
        pool.query(qury,[],(err,result)=>{
            if(err){
                return false
            }else{
                return true
            }
        })
    } catch (error) {
        return false
    }
}
async function updatefreeStorage(){
    const qury = "UPDATE PlansCustomer SET freeStorage = freeStorage - 1  WHERE freeStorage > 0"
    try {
        pool.query(qury,[],(err,result)=>{
            if(err){
                return false
            }else{
                return true
            }
        })
    } catch (error) {
        return false
    }
}
async function UpdateBillCustomer(){
    try {
        const qury = `
            UPDATE billAccount b 
            SET amount = amount + (
                SELECT IF(pc.freeStorage = 0, IF(pc.renewIn = 0, p0.storage_price, p.storage_price), 0)
                FROM WerehouseData wd
                JOIN PlansCustomer pc ON wd.Cid = pc.Cid AND wd.Wid = pc.Wid
                LEFT JOIN Plans p ON pc.Pid = p.Pid
                LEFT JOIN Plans p0 ON p0.Price = 0
                WHERE wd.Did = b.Did
            ) where status=0
        `;
        pool.query(qury,[],(err,result)=>{
            if(err){
                return ({status:"Invalid Data error",err});
            }else{
                return ({status:"ok",result});
            }
        })
    } catch (error) {
        res.json({status:"error"});
    }
}
async function sendEmailForEndingPlan(){
    try {
        const query = "select email from Customer where Cid in (select Cid from PlansCustomer where renewIn<5 and renewIn>=1 )";
        pool.query(query,[],async (err,result)=>{
            if(err){
                return false;
            }else{
                if(result.length!=0){
                    const emailValues = result.map(obj => obj.email);
                    const html ="<h1>This Mail is from YourIndianShop</h1><p>Your Plan is Expire in Few Days Please Check Portal</p><a href='https://yourindianshop.com'>yourindianshop.com</a>";
                    const dt = await MultipleMail(emailValues,html,"Alert Mail");
                    if(dt){
                        return dt;
                    }else{
                        return false;
                    }
                }else{
                    return true;
                }
            }
        })
    } catch (error) {
        res.json({status:"error"});
    }
}
async function sendEmailForExpiredPlan(){
    try {
        const query = "SELECT email FROM Customer WHERE Cid IN (SELECT Cid FROM PlansCustomer WHERE renewIn = 0 AND (startDate + INTERVAL planDays DAY) < NOW());";
        pool.query(query,[],async (err,result)=>{
            if(err){
                return false;
            }else{
                if(result.length!=0){
                    const emailValues = result.map(obj => obj.email);
                    const html ="<h1>This Mail is from YourIndianShop</h1><p>Your Plan is Expired Please Recharge Your Plan On Portal </p><a href='https://yourindianshop.com'>yourindianshop.com</a>";
                    const dt = await MultipleMail(emailValues,html,"Alert Mail");
                    if(dt){
                        return dt;
                    }else{
                        return false;
                    }
                }else{
                    return true;
                }
            }
        })
    } catch (error) {
        res.json({status:"error"});
    }
}
async function AtInterval(){
    // this code is run in everyday at 12 am midnight
    await updateRenew();
    await UpdateBillCustomer();
    await updatefreeStorage();
    await sendEmailForEndingPlan();
    await sendEmailForExpiredPlan();
}
function login(query,req,res,isuser){
    const {email,password}=req.body;
    pool.query(query,[email],async (err,result)=>{
        if(err){
            res.json({status:'error',err});
        }else{
            if( result?.length==0){
                res.json({status:' invalid credentials...'});
            }else{
                const passw = result[0].password.toString();
                if(passw==password){
                    const token = jwt.sign({email:email,time:Date.now()}, jwt_code)
                    const users = result[0];
                    if(isuser){
                        pool.query("update Customer set Time = CURRENT_TIMESTAMP where Email = ?",[email],async (err,result)=>{})
                    }
                    res.send({status:'ok',token,user:users})
                }else{
                    res.json({status:'invalid credentials'})
                }
            }
        }
    })
}
function giveToken(obj){
    return jwt.sign(obj, jwt_code);
}
const code = process.env.API_CODE;
async function mid(req,res,next){
    const {token}=req.headers;
    if(token==code){
        try {
            next();
          } catch (err) {
            console.log(err);
            res.send({status:'unOthorized request...'});
          }
    }else{
        // res.send({status:'unOthorized request...'});
        res.sendFile(path.join(__dirname, '../build', 'index.html'));
    }
}
module.exports = {giveToken,generalwithDetails,generateUploadUrl,deleteObject,general,general2,AtInterval,mid,login,UpdateBillCustomer,sendEmailForExpiredPlan};


// router.delete('/deleteFile/',async (req,res)=>{
//     try {
//         const {filename}=req.headers;
//         const isdelete= await deleteObject(filename);
//         if(isdelete){
//             res.json({status:'ok'})
//         }
//         res.json({status:'not deleted'})
//     } catch (error) {
//         res.json({error});
//     }
// })