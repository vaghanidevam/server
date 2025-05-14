const SubSection = require("../subSection/subSection");
const Section = require("../section/section");
const { uploadImageToCloudinary } = require("../utils/imageUpload")


exports.createSubSection = async (req, res) => {
    try {
        // data fecth 
        const { SectionId, title, description } = req.body;
        // extract file
        const video = req.files.videoFile;
        //validation
        if (!SectionId || !title || !timeDuration || !description) {
            return res
            .status(404)
            .json({ success: false, message: "All Fields are Required" })
        }
        console.log(video)
        // upload video 
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NANE);
console.log(uploadDetails)
        //create sub section
        const subSection = await SubSection.create({
            title,
            timeDuration: `${uploadDetails.duration}`,
            description,
            videoUrl: uploadDetails.secure_url,
        })
        //update section
        await Section.findByIdAndUpdate({ _id: SectionId }, {
            $push: {
                subSection: subSection._id,
            }
        }, { new: true })
        return res.status(200).json({ success: true, data: updatedSection })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
          })
    }
}


// update subsection

exports.updateSubSection = async (req, res) => {
    try {
        const { subSectionId } = req.params;
        const { title, description, SectionId } = req.body;
        const subSection = await SubSection.findById(subSectionId)
        if (!subSection) {
            return res.status(404).json({
              success: false,
              message: "SubSection not found",
            })
          }
          if (title !== undefined) {
            subSection.title = title
          }
      
          if (description !== undefined) {
            subSection.description = description
          }
          if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
              video,
              process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
          }
      
          await subSection.save()
      
          // find updated section and return it
          const updatedSection = await Section.findById(SectionId).populate()
          console.log("updated section", updatedSection)
      
          return res.json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection,
          })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "An error occurred while updating the section",
        })
    }
}


// delete subSection

exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId } = req.params;
        const {SectionId} =  req.body;
        await Section.findByIdAndUpdate(
            { _id: SectionId },
            {
              $pull: {
                subSection: subSectionId,
              },
            }
          )
          const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })
        if (!subSection) {
            return res
            .status(404)
            .json({ success: false, message: "SubSection not found" })
        }
        const updatedSection = await Section.findById(SectionId).populate()
      
        return res.json({
            success: true,
            message: "SubSection deleted successfully",
            data: updatedSection,
          })
    } catch (error) {
        console.error(error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    })
    }
}