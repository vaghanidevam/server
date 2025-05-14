const nodemailer =  require("nodemailer");


const mailSender = async(email, tilte, body)=>{
    try {
        let transpoter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth:{
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })
                       
         let info = await transpoter.sendMail({
            from: 'studynotion',
            to: `${email}`,
            subject: `${tilte}`,
            html: `${body}`,
         })

         console.log(info);
         return info;

    } catch (error) {
        console.log(error);
    }
}


module.exports = mailSender;