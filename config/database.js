const mongoose = require('mongoose');
require("dotenv").config();


exports.connect = ()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{console.log(" db connected")})
    .catch((error)=>{
        console.log("db connection faild");
        console.error(error);
        process.exit(1);
    })
}
