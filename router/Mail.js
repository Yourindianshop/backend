const nodemailer = require('nodemailer');
const email = process.env.EMAIL
const pass = process.env.EPASS


const SendMail2 = async (reciver,html,subject)=>{
  try {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
            user: email,
            pass: pass,
        },
        
    });
    console.log(email+" "+pass);
    let info = await transporter.sendMail({
        from: email,
        to: reciver,
        subject: subject,
        html: html,
    });
    return info;
  } catch (error) {
      return false;
  }
} 
const MultipleMail = async (recivers,html,subject)=>{
  try {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
            user: email,
            pass: pass,
        },
    });
    let info = await transporter.sendMail({
        from: `YourIndianShop <${email}>`,
        to: recivers,
        subject: subject,
        html: html,
    });
    return info;
  } catch (error) {
      console.log(error);
      return false;
  }
}
module.exports= {SendMail2,MultipleMail};