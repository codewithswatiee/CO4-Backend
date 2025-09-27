import mongoose from "mongoose";

const StudentData = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    projects: {
        ref: 'Project',
        type: [mongoose.Schema.Types.ObjectId],
        required: true
    },   
});


const StudentDataModel = mongoose.model("StudentData", StudentData);
export default StudentDataModel;