import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    url: {
        type: String,
    },
    publicId: {
        type: String,
    },
    uploadDate:{
        type: Date,
        default: Date.now
    }
})

const Project = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    tags: [],
    rawFiles: [fileSchema],
    formattedFile: {},
    analysis: {},
    feedback: {},  
    comments:{
        type: [String],
        default: []
    },
    transcribe: [],
    mentorRemarks:{
        Score:{ type: Number, default: 0 },
        potentialCategory:{ type: String, enum:['High', 'Medium', 'Low'] }
    }
}, {
    timestamps: true
});


const ProjectModel = mongoose.model("Project", Project);
export default ProjectModel;