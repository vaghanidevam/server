const { default: mongoose } = require("mongoose");
const course = require("../course/course");
const Course = require("../course/course");
const ratingAndReview = require("./ratingAndReview");
const RatingAndReview = require("./ratingAndReview");

//createRating 
exports.createRating = async (req, res) => {

    try {
        

        const userId =  req.user.id;

        const {rating, review, courseId}= req.body
        const courseDetails=await Course.findOne({_id:courseId,
            studentsEnrolled:{$elemMatch:{$eq:userId}}});

  if(!courseDetails){
    return res.status(404).json({
        success:false,
        message:"Student is not enrolled in the course",
      })
  }


  const ratingAndReviewed =  await RatingAndReview.findOne({
    user:userId,
    Course:courseId
  })

if(ratingAndReviewed){
    return res.status(403).json({
        success:false,
        message:"Course already reviewed by the user",
      })
}

const ratingAndReview = await RatingAndReview.create({
    rating, 
    review, 
    user:userId, 
    course:courseId
})


const updatedCourseData =  await Course.findByIdAndUpdate(courseId, {
    $push:{

        ratingAndReview: ratingAndReview._id
    }
}, {new:true})

console.log(updatedCourseData)

return res.status(200).json({
    success:true,
    message:"Rating and Review created successfully for the course",
    ratingAndReview
  })



    } catch (error) {
        console.log(err);
    return res.status(500).json({
      success:false,
      message:err.message,
    })

    }
    
}


//getAverageRating

exports.getAverageRating = async  ()=>{

    try {

const courseId = req.body.courseId;


const result=await RatingAndReview.aggregate([{
  $match:{
    course:new mongoose.Types.ObjectId(courseId),
  }
},
{
  $group:{
    _id:null,
    averageRating:{$avg:"$rating"}, 
  }
}]);

if(result.length>0){
  return res.status(200).json({
    success:true,
    averageRating:result[0].averageRating
  })
}else{
  return res.status(200).json({
    success:true,
    message:"Average Rating is 0, no rating given till now",
    averageRating:0,
  });
}

        
        
    } catch (error) {
        console.log(err);
    return res.status(500).json({
      success:false,
      message:err.message,
    })

    }

}

//getAllRating

exports.getAllRating = async(req, res)=>{
  try {
    
const allReviews = await ratingAndReview.find({})
                                        .sort({rating: "desc"})
                                        .populate()
                                        .exec()

                                  return res.status(200).json({
                                          success:true,
                                          message:"All reviews fetched successfully",
                                          data:allReviews,
                                        });

  } catch (error) {
    console.log(err);
    return res.status(500).json({
      success:false,
      message:err.message,
    })

  }
}