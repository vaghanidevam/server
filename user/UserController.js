const User = require('./user');
const OTP = require('../otp/otp');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcryptjs'); // or 'bcrypt' if you're using it
const profile = require('../profile/profile');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender")
const {passwordUpdated} =  require('../mail/templates/passwordUpdate')


exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const checkUserPresent = await User.findOne({ email });
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
              })
        }
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        })
        console.log(otp);

        // check unique otp ot not

        let result = await OTP.findOne({ otp: otp });
        console.log("Result is Generate OTP Func")
    console.log("OTP", otp)
    console.log("Result", result)
        while (result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            })
        }

        const otpPayload  = { email, otp }
        const otpBody = await OTP.create(otpPayload)
        console.log("OTP Body", otpBody)
        return   res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
          })
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, error: error.message })
    }
}

// SIGNUP //

exports.signUp = async (req, res) => {
   
try {
  console.log("SignUp Function")
     // data fetch from req boady
    const {
        firstName,
        lastName,
        email,
        password,
        confirmpassword,
        accountType,
        contactNumber,
        otp
    } = req.body;

console.log(req.body)
    //validate data

    if (!firstName || !lastName || !email || !password || !confirmpassword || !otp || !contactNumber) {
        return res.status(403).send({
            success: false,
            message: "All Fields are required",
          })
    }

    //2 password match karo 

    if (!password === confirmpassword) {
        return res.status(400).json({
            success: false,
            message:
              "Password and Confirm Password do not match. Please try again.",
          })
    }

    //check user already exist or not 

    const existinUser = await User.findOne({ email });
    if (existinUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists. Please sign in to continue.",
          })
    }

    //find most recent otp stopred for user 
    const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    console.log(recentOtp)
  
    // validate otp 
    if( recentOtp.length === 0){
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          })
    } else if(otp !== recentOtp[0].otp){
      console.log('helo')
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
          })
    }


    //password heash
    const hashedPassword =  await becrypt.hash(password, 10);
    let approved = ""
    approved === "Instructor" ? (approved = false) : (approved = true)
    //entry crated in db 
    const profuileDetails = await profile.create({
        gender:null,
        dateOfBirth: null,
        about: null,
        contactNumber: null,
    })


    const user = await User.create({
        firstName,
        lastName,
        email,
        contactNumber,
        password: hashedPassword,
        accountType,
        approved: approved,
        additionalDetails: profuileDetails._id,
        image:`https://api.dicebear.com/9.x/initials/svg?seed=${firstName} ${lastName}`
    })
    return res.status(200).json({
        success: true,
        user,
        message: "User registered successfully",
      })
} catch (error) {
    console.error(error)
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    })
}
};


// LOGIN //

exports.login = async (req,res)=>{
    try {
        console.log("Login Function")
        //get data req
      const {email, password} =req.body;
      console.log(req.body)
        //validation
if(!email||!password){
    return res.status(400).json({
        success: false,
        message: `Please Fill up All the Required Fields`,
      })
}
        //user check
      const user = await User.findOne({email}).populate("additionalDetails");
      if(!user){
        return res.status(401).json({
            success: false,
            message: `User is not Registered with Us Please SignUp to Continue`,
          })
      }
        //generate jwt , after passwrd match

      if( await bcrypt.compare(password, user.password)){
        const payload = {
            email: user.email,
            id: user._id,
            accountType: user.accountType
        }
        var token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn:"2h"
        })
        User.token =token;
        user.password = undefined;
      }      else{
        return res.status(401).json({
          success: false,
          message: `Password is incorrect`,
        })
      }     
        //create cookie and send responce 

        const Option ={
            expires: new Date(Date.now() + 3*24*60*60+100),
            httpOnly: true
        }

     res.cookie("token", token, Option).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      })
     
    } catch (error  ) {
          // Return 500 Internal Server Error status code with error message
    return res.status(500).json({
        success: false,
        message: `Login Failure Please Try Again`,
      })
      
}
}
// chnage password 

exports.changePassword =  async (req, res)=>{
    try {
        // get data from body
        const userDetails = await User.findById(req.user.id)
    const{OldPassword, newPassword, confirmpassword} = req.body;

    const isPasswordMatch = await bcrypt.compare(
         OldPassword,
        userDetails.password
      )
      if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" })
      }
      const encryptedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUserDetails = await User.findByIdAndUpdate(
        req.user.id,
        { password: encryptedPassword },
        { new: true }
      )
   // Send notification email

      try {
        const emailResponse = await mailSender(
            updatedUserDetails.email,
            "Password for your account has been updated",
            passwordUpdated(
              updatedUserDetails.email,
              `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
            )
          )
          console.log("Email sent successfully:", emailResponse.response)
        
      } catch (error) {
           // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      })
      }
      return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
        console.error("Error occurred while updating password:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while updating password",
          error: error.message,
        })
    }
}