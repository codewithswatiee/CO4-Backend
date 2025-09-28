import StudentDataModel from "../../models/student-data.model.js";
import UserModel from "../../models/user.model.js";

export const fetchAllStudents = async (req, res) => {
    try {
        const students = await UserModel.find({ role: 'student' }).select('-password');
        res.status(200).json({
            message: "Students fetched successfully",
            students: students
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const fetchAllMentors = async (req, res) => {
    try {
        const mentors = await UserModel.find({ role: 'mentor' }).select('-password');
        res.status(200).json({
            message: "Mentors fetched successfully",
            mentors: mentors
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }   
}

export const assignMentorToStudent = async (req, res) => {
    try {
        const { studentId, mentorId } = req.body;
        if (!studentId || !mentorId) {
            return res.status(400).json({ message: "Student ID and Mentor ID are required" });
        }

        const student = await UserModel.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: "Student not found" });
        }

        const mentor = await UserModel.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const updateStudentData = await StudentDataModel.findOneAndUpdate(
            { studentId: studentId },
            { mentorId: mentorId },
            { new: true, upsert: true, runValidators: false}
        );

        console.log("Updated Student Data:", updateStudentData);

        if(!updateStudentData) {
            return res.status(500).json({ message: "Failed to assign mentor" });
        }

        res.status(200).json({
            message: "Mentor assigned to student successfully",
            assignment: updateStudentData
        });
    } catch (error) {
        console.error("Error assigning mentor:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getPotentialIdeas = async (req, res) => {
    try {
        const studentsWithIdeas = await StudentDataModel.find({ projects: { $exists: true, $ne: [] } })
            .populate('studentId', 'name email')
            .populate('projects', 'title description tags mentorRemarks formattedFiles comments feedback analysis');

        if(!studentsWithIdeas){
            return res.status(404).json({
                message: "No potential ideas found"
            })
        }
        return res.status(200).json({
            message: "Potential ideas fetched successfully",
            ideas: studentsWithIdeas
        });
    } catch (error) {
        console.error('getPotentialIdeas error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAssignedMentors = async (req, res) => {
    try {
        // Fetch all student-mentor assignments with populated data
        const assignments = await StudentDataModel.find()
            .populate('studentId', 'name email')
            .populate('mentorId', 'name email');

        // Format the response data
        const formattedAssignments = assignments.map(assignment => ({
            student: {
                id: assignment.studentId._id,
                name: assignment.studentId.name,
                email: assignment.studentId.email
            },
            mentor: assignment.mentorId ? {
                id: assignment.mentorId._id,
                name: assignment.mentorId.name,
                email: assignment.mentorId.email
            } : null,
            assignedAt: assignment.updatedAt
        }));

        res.status(200).json({
            message: "Mentor assignments fetched successfully",
            assignments: formattedAssignments
        });
    } catch (error) {
        console.error("Error fetching mentor assignments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}