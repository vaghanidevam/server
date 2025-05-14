const Tag = require("../tag");

// create tag

exports.createTag = async(req , res)=>{
    try {
        const {name, description} = req.body;
     if(!name || !description){
        return res.status(400).json({
            success:false,
            message:"All fields are required",
          });
    
     }

     const tagDetails = await Tag.create({
        name,
        description
     })

    console.log(tagDetails)
    //return response
    return res.status(200).json({
        success:true,
        message:"Tag Created Successfully",
      })

    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
          })
    }
}


//get all tags

exports.showAllTags = async(req, res)=>{
    try {
        const allTags = await Tag.find({}, {name: true, description:true});
        return    res.status(200).json({
            success:true,
            message:"All tags returned successfully",
            allTags,
          })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
          })
    }
}





