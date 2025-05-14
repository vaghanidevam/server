const mongoose = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../course/course");
const User = require("../user/user");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto")
const { courseEnrollmentEmail } = require('../mail/templates/courseEnrollmentEmail')
const { paymentSuccessEmail } = require('../mail/templates/paymentSuccessEmail')
const CourseProgress = require('../courseProgress/courseProgress')


// capture the payment and initiate the razorpay order

exports.capturePayment = async (req, res) => {
    try {
        const { courses } = req.body;
        const userId = req.User.id;
        if (!courseId) {
            return res.json({ success: false, message: "Please Provide Course ID" })
        }
        let total_amount = 0
        for (const course_id of courses) {
            // Find the course by its ID
            const course = await Course.findById(course_id)

            // If the course is not found, return an error
            if (!course) {
                return res
                    .status(200)
                    .json({ success: false, message: "Could not find the Course" })
            }

            // Check if the user is already enrolled in the course
            const uid = new mongoose.Types.ObjectId(userId)
            if (course.studentEnrolled.includes(uid)) {
                return res
                    .status(200)
                    .json({ success: false, message: "Student is already Enrolled" })
            }
            // Add the price of the course to the total amount
            total_amount += course.price
        }
    }

    catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: error.message })
    }


    const options = {
        amount: total_amount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    }

    try {
        const paymentResponse = await instance.orders.create(options)
        console.log(paymentResponse)
        return res.json({
            success: true,
            data: paymentResponse,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Could not initiate order." })

    }
}




//verify signature for razorpay and server

exports.verifyPayment  = async (req, res) => {
    const razorpay_order_id = req.body.razorpay_order_id
    const razorpay_payment_id = req.body.razorpay_payment_id
    const razorpay_signature = req.body.razorpay_signature
    const courses = req.body.courses
    const userId = req.user.id

    
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" })
  }
  let body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex")


    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res)
        return res.status(200).json({ success: true, message: "Payment Verified" })
      }
    
      return res.status(200).json({ success: false, message: "Payment Failed" })
} 




// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body
    const userId = req.user.id
  
    if (!orderId || !paymentId || !amount || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all the details" })
    }
  
    try {
      const enrolledStudent = await User.findById(userId)
  
      await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
          amount / 100,
          orderId,
          paymentId
        )
      )
    } catch (error) {
      console.log("error in sending mail", error)
      return res
        .status(400)
        .json({ success: false, message: "Could not send email" })
    }
  }



  // enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
      return res
        .status(400)
        .json({ success: false, message: "Please Provide Course ID and User ID" })
    }
  
    for (const courseId of courses) {
      try {
        // Find the course and enroll the student in it
        const enrolledCourse = await Course.findOneAndUpdate(
          { _id: courseId },
          { $push: { studentsEnroled: userId } },
          { new: true }
        )
  
        if (!enrolledCourse) {
          return res
            .status(500)
            .json({ success: false, error: "Course not found" })
        }
        console.log("Updated course: ", enrolledCourse)
  
        const courseProgress = await CourseProgress.create({
          courseID: courseId,
          userId: userId,
          completedVideos: [],
        })
        // Find the student and add the course to their list of enrolled courses
        const enrolledStudent = await User.findByIdAndUpdate(
          userId,
          {
            $push: {
              courses: courseId,
              courseProgress: courseProgress._id,
            },
          },
          { new: true }
        )
  
        console.log("Enrolled student: ", enrolledStudent)
        // Send an email notification to the enrolled student
        const emailResponse = await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        )
  
        console.log("Email sent successfully: ", emailResponse.response)
      } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, error: error.message })
      }
    }
  }