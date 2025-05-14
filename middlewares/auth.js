const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../user/user");
const { trusted } = require("mongoose");


//auth

exports.auth =  async(req, res, next)=>{

    try {
        const token =req.cookies.token
        ||req.body.token
        ||req.header("Authorisation").replace("Bearer","");

        //if token missing than retirn responce
        if(!token){
            return res.status(401).json({
                success:false,
                message:"Token is missing"
              });
        }

        //verify token
try {
    console.log("BEFORE VERIFIYINH");
    const decode= jwt.verify(token,process.env.JWT_SECRET);
    if(!decode){
        return res.status(401).json({
            success:false,
            message:"Token is invalid"
          });
    }
    console.log(decode);
    console.log("HERE WE DECODED");
    req.user=decode;
} catch (error) {
    console.log(err);
      console.log(err.message);
      return res.status(401).json({
        success:false,
        message:"Token is invalid"
      });
}
next()
    } catch (error) {
        return res.status(401).json({
            success:false,
            message:"Something went wrong while validating the token",
          });
    }

}


//is student 

exports.isStudent = async(req, res, next)=>{
    try {
        if(req.User.accountType !=="Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for students only"
              });
        }
next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
          })
    }
}


//is isnstuctor

exports.isInstructor = async(req, res, next)=>{
    try {
        if(req.User.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructor only"
              });
        }
next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
          })
    }
}

//is admin

exports.isAdmin = async(req, res, next)=>{
    try {
        if(req.User.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only"
              });
        }
next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified,please try again"
          })
    }
}
