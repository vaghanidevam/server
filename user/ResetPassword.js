const User = require("../user/user");
const jwt=require("jsonwebtoken");
const mailSender = require("../utils/mailSender");
const becrypt = require("bcrypt")
const crypto=require("crypto");
// RERSET PASWWORD TOKEN 

exports.resetPasswordToken = async (req, res) => {

    try {
        const email = req.body.email;
        const user = await User.findOne({ email })
        if (!user) {
            return res.json({
                success:false,
                message:"Your email is not registered with us"
              });
        }
        //generate token
        const token=crypto.randomUUID();
        console.log(token);
        //update user by ddming token 
            const updatedDetails=await User.findOneAndUpdate({email:email},{
                token:token,
                resetPasswordExpires:Date.now() + 5*60*1000,
              },{
                new:true
              });
        //create url
        console.log("DB ENTRY CREATED");
        const url = `http://localhost:3000/update-password/${token}`
        //send mail
        await mailSender(email,"Password Reset Link",`Password Reset Link: ${url}`);

        return res.json({
            success:true,
            message:"Email sent successfully,please check email and reset password",
          });
      
    } catch (error) {
        console.log(err);
        return res.status(500).json({
          success:false,
          message:"Something went wrong while sending reset password mail"
        })
    }
}


// reset password 

exports.resetPassword = async (req, res) => {
    try {
        // data fetach
        const { password, confirmPassword, token } = req.body;
        //validation
        if(password!==confirmPassword){
            return res.json({
              success:false,
              message:"Passwords did not match,try again",
            })
          }
          const userDetails=await User.findOne({token:token});
           //if no entry -> invalid token
    if(!userDetails){
        return res.json({
          success:false,
          message:"Token invalid"
        })
      }
   //check if expired token
   if(userDetails.resetPasswordExpires<Date.now()){
    return res.json({
      success:false,
      message:"Token is expired,please regenerate your token"
    })
  }
  const hashedPassword=await bcrypt.hash(password,10);
  await User.findOneAndUpdate({token:token},{
    password:hashedPassword
  },{new:true});
      //return response
      return res.status(200).json({
        success:true,
        message:"Password reset successful",
      })


    } catch (error) {
        console.log(err); 
    console.log(err.message);
    return res.json({
      success:false,
      message:"Some error occurred while resetting the password"
    })
    }
}
