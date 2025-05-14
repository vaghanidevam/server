const express = require("express");
const app = express();

const userRoutes = require('./user/userRoutes.js')
const ProfileRoutes = require('./profile/profileRoutes.js')
const paymentRoutes = require('./payment/paymentsRoutes.js')
const courseRoutes = require('./course/courseRoutes.js')


const database = require('./config/database.js')
const cookieParser = require("cookie-parser")
const cors = require('cors')
const {cloudinaryConnect } =  require('./config/cloudinary.js')
const fileUpload = require('express-fileupload')
const dotenv = require('dotenv')

dotenv.config()
const PORT = process.env.PORT || 4000;

database.connect()

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({ 
      //frontend url
      origin:"http://localhost:3000",
      credentials:true,
    })
  );
  app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir:"/temp"
    })
  )
  cloudinaryConnect();

app.use('/api/VI/auth', userRoutes)
app.use('/api/VI/profile', ProfileRoutes)
app.use('/api/VI/course', courseRoutes)
app.use('/api/VI/payment', paymentRoutes)


app.get("/", (req, res)=>{
    return res.json({
        success: true,
        message: "your server is up and raning"
    })
})

app.listen(PORT, ()=>{
    console.log(`app is raning at ${PORT}`)
})