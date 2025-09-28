import StudentDataModel from "../../models/student-data.model";
import UserModel from "../../models/user.model";

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
            { new: true, upsert: true }
        );

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
            .populate('projects', 'title description tags feasibility overall_confidence problem_and_market_score value_and_model_score team_and_traction_score funding_readiness_score analysis llmAnalysis mentorRemarks');

        // helper to classify based on mentorRemarks
        const classifyPotential = (mentorRemarks = {}) => {
            // try numeric keys first
            const numericKeys = ['score', 'potential_score', 'potentialScore', 'overall_score', 'overall_confidence', 'value_and_model_score', 'funding_readiness_score'];
            for (const k of numericKeys) {
                const v = mentorRemarks[k];
                if (typeof v === 'number' && !isNaN(v)) {
                    if (v >= 75) return 'best';
                    if (v >= 40) return 'mediocre';
                    return 'low';
                }
                // sometimes numbers come as strings
                if (typeof v === 'string' && !isNaN(Number(v))) {
                    const n = Number(v);
                    if (n >= 75) return 'best';
                    if (n >= 40) return 'mediocre';
                    return 'low';
                }
            }

            // fallback to textual cues
            const text = (mentorRemarks.potential || mentorRemarks.potential_rating || mentorRemarks.potentialRemarks || mentorRemarks.overall || '')
                .toString()
                .toLowerCase();

            if (text.match(/\b(high|best|excellent|strong|promising|good)\b/)) return 'best';
            if (text.match(/\b(medium|mediocre|average|ok|moderate)\b/)) return 'mediocre';
            if (text.match(/\b(low|poor|weak|bad)\b/)) return 'low';

            // if mentorRemarks contains freeform feedback, try to infer
            const feedback = (mentorRemarks.feedback || mentorRemarks.comments || '').toString().toLowerCase();
            if (feedback.match(/\b(high|best|excellent|strong|promising|good)\b/)) return 'best';
            if (feedback.match(/\b(medium|mediocre|average|ok|moderate)\b/)) return 'mediocre';
            if (feedback.match(/\b(low|poor|weak|bad)\b/)) return 'low';

            return 'unclassified';
        };

        const categorized = {
            best: [],
            mediocre: [],
            low: [],
            unclassified: []
        };

        const ideas = studentsWithIdeas.map(studentData => {
            const student = studentData.studentId;
            const projects = (studentData.projects || []).map(project => {
                const category = classifyPotential(project.mentorRemarks || {});
                const item = {
                    student,
                    project // include full project document (all available data)
                };
                categorized[category] = categorized[category] || [];
                categorized[category].push(item);
                return project;
            });

            return {
                student,
                projects
            };
        });

        res.status(200).json({
            message: "Potential ideas fetched successfully",
            ideas, // original per-student list
            categorized // grouped by mentor-remarks-derived potential: best / mediocre / low / unclassified
        });
    } catch (error) {
        console.error('getPotentialIdeas error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}