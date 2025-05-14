const mongoose = require("mongoose");
const mailSender = require('../utils/mailSender')
const otpTemplate = require('../mail/templates/emailVerificationTemplate')

const otpSchema = new mongoose.Schema({

    email:{
        type:String,
        required: true
    },
    otp:{
        type: Number,
        required: true
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        expires: 5*60,
    }

});


async function sendVerificationEmail(email, otp){

    try {

        const mailResponse=await mailSender(email,"Verification email from StudyNotion",otpTemplate(otp));
        console.log("Email sent successfully:",mailResponse);
    
        
    } catch (error) {
        console.log("Error occured while sending mails:",error);
        throw error;

    }
}

otpSchema.pre("save", async function (next) {

    await sendVerificationEmail(this.email,this.otp);
    next();
})

module.exports = mongoose.model("Otp", otpSchema);
