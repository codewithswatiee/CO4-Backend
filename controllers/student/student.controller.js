import ProjectModel from "../../models/project.model.js";
import StudentDataModel from "../../models/student-data.model.js";
import UserModel from "../../models/user.model.js";
import { uploadMultipleFiles } from "../../utils/upload.util.js";

export const getAllStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;

        const studentExists = await UserModel.findById(studentId);
        if (!studentExists) {
            return res.status(404).json({ message: "Student not found" });
        }

        const projectDetails = await StudentDataModel.findOne({ studentId })
        .populate('projects', 'title description tags')
        .populate('mentorId', 'name email');

        if (!projectDetails) {
            return res.status(404).json({ message: "No project details found for this student" });
        }

        console.log("Fetched student details:", projectDetails);
        res.status(200).json({ 
            message: "Student details fetched successfully",
            details: projectDetails 
        });
    } catch (error) {
        console.error("Error fetching student details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getProjectDetails = async (req, res) => {
    try {
        const { projectId } = req.params;
        const projectDetails = await ProjectModel.findById(projectId)

        if (!projectDetails) {
            return res.status(404).json({ message: "No details found for this project" });
        }

        console.log("Fetched project details:", projectDetails);
        res.status(200).json({ 
            message: "Project details fetched successfully",
            details: projectDetails 
        });
    } catch (error) {
        console.error("Error fetching project details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createProject = async (req, res) => {
    try {
        const { studentId, title, description, tags } = req.body;
        if (!studentId || !title || !description || !req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Student ID and at least one file are required" });
        }

        const studentExists = await UserModel.findById(studentId);
        if (!studentExists) {
            return res.status(404).json({ message: "Student not found" });
        }

        const fileData = req.files;

        const uploadedFiles = await uploadMultipleFiles(studentId, fileData);
        if (!uploadedFiles.success) {
            return res.status(500).json({ message: "File upload failed", error: uploadedFiles.error });
        }

        // LOGIC TO GET TRANSCRIPTION FROM AUDIO FILES CAN BE ADDED HERE

        const {transcribe, structured_data } = await axios.post('http://127.0.0.1:7000/process-pdf', {
            pdf_link: uploadedFiles.files[0].url
        })

        const projectDoc = await ProjectModel.create({
            title: title || `Project_${Date.now()}`,
            description: description || "",
            tags: tags || [],
            rawFiles: uploadedFiles.files,
            transcribe: transcribe, // Placeholder for transcription data
            feedback: {},
            mentorRemarks: {},
            comments: [],
            analysis: {},
            formattedFile: structured_data || {}
        });

        await projectDoc.save();

        await StudentDataModel.updateOne(
            { studentId },
            { $addToSet: { projects: projectDoc._id } },
            { upsert: true }
        );

        res.status(201).json({
            message: "Project created successfully",
            project: projectDoc
        });
        
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFeedback = async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID   is required" });
        }

        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const transcribe = project.transcribe;
        if (!transcribe || transcribe.length === 0) {
            return res.status(400).json({ message: "No transcription data available for this project" });
        }
        // Request to AI
        const feedbackResponse = await axios.post('http://127.0.0.1:7000/llm-workflow/plan-feedback', {
            json_data: transcribe
        });

        const saveFeedback = await ProjectModel.findByIdAndUpdate(projectId, {
            $set: {
                feedback: feedbackResponse
            }
        }, { new: true });

        if (!saveFeedback) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({
            message: "Feedback generated and saved successfully",
            feedback: saveFeedback.feedback
        });
    } catch (error) {
        console.error("Error generating feedback:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}