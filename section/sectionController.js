const Section = require("../section/section");
const Course = require("../course/course")
const SubSection = require('../subSection/subSection')

exports.createSection = async (req, res) => {
    try {
        const { sectionName, courseId } = req.body;
        if (!sectionName || !courseId) {
            return res.status(400).json({
				success: false,
				message: "Missing required properties",
			});
        }
        const section = await Section.create({
            sectionName
        })
        const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				$push: {
					courseContent: section._id,
				},
			},
			{ new: true }
		).populate().exec();
          return  res.status(200).json({
                success: true,
                message: "Section created successfully",
                updatedCourse,
            });
    } catch (error) {
    return    res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message,
		});
    }
}


// update section

exports.updateSection = async (req, res) => {
    try {
        const { sectionName, sectionId, courseId } = req.body
        const section = await Section.findByIdAndUpdate({ sectionId }, {
            sectionName
        }, { new: true })
        const course = await Course.findById(courseId).populate()
       return res.status(200).json({
			success: true,
			message: section,
			data:course,
		});
    } catch (error) {
        console.error("Error updating section:", error);
	return res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
}


// delete section

exports.deleteSection = async (req, res) => {
    try {
        const { sectionId , courseId} = req.params
        await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
        const section =  await Section.findById(sectionId)
        console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}
        await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

        //find the updated course and return 
		const course = await Course.findById(courseId).populate().exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});

        return console.log("section deleted")
    } catch (error) {
        console.error("Error deleting section:", error);
	return	res.status(500).json({
			success: false,
			message: "Internal server error",
		});
    }
}