const express = require('express');
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");

const clientId = process.env.RPCLEINT_ID;
const secId = process.env.RPSECRET_ID;
var instance = new Razorpay({ key_id: clientId, key_secret: secId });



router.get('/getRazorpayOrder/:amount/:currency/:reciept',async (req,res)=>{

    var options = {
        amount: req.params.amount,  
        currency: req.params.currency,
        receipt: req.params.reciept
    };
    try {
        instance.orders.create(options,function(err,order){
            res.json({order});
        })
    } catch (error) {
        res.json({status:"something went wrong"});
    }
})
router.get("/order/validate/:oid/:pid/:sign", async (req, res) => {
    const { oid, pid, sign } =req.params;
    // console.log("hi",oid,pid,sign);
    const sha = crypto.createHmac("sha256",secId);
    //order_id + "|" + razorpay_payment_id
    sha.update(`${oid}|${pid}`);
    const digest = sha.digest("hex");
    // console.log('digest');
    if (digest !== sign) {
      return res.status(400).json({ msg: "Transaction is not legit!" });
    }
  
    res.json({
      msg: "success",
      orderId: oid,
      paymentId: pid,
    });
});

module.exports = router;