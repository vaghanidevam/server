// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment ,sendPaymentSuccessEmail} = require("../payment/payment")
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")
router.post("/capturePayment", auth, isStudent, capturePayment)
router.post("/verifySignature", auth,isStudent,verifyPayment);
router.post("/sendPaymentSuccessEmail",auth,isStudent,sendPaymentSuccessEmail);
module.exports = router