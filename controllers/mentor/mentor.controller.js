import ProjectModel from "../../models/project.model.js";
import StudentDataModel from "../../models/student-data.model.js";
import UserModel from "../../models/user.model.js";
import axios from "axios";

export const getAllStudents = async (req, res) => {
    try {
        const { mentorId } = req.params;
        if (!mentorId) {
            return res.status(400).json({ message: "Mentor ID is required" });
        }

        const isMentor = await UserModel.findById(mentorId);
        if (!isMentor || isMentor.role !== 'mentor') {
            return res.status(404).json({ message: "Mentor not found" });
        }

        const students = await StudentDataModel.find({mentorId: mentorId})
        .populate('studentId', 'name email')
        .select('-__v -docDesc');
        if (!students || students.length === 0) {
            return res.status(404).json({ message: "No students found for this mentor" });
        }

        res.status(200).json({
            message: "Students fetched successfully",
            students: students
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


export const getProjectDetails = async (req , res) => {
    try {
        const { projectId } = req.params;
        const projectDetails = await ProjectModel.findById(projectId)

        if (!projectDetails) {
            return res.status(404).json({ message: "No details found for this project" });
        }

        let response = {
            title: projectDetails.title,
            description: projectDetails.description,
            tags: projectDetails.tags,
            uploadedFiles: projectDetails.rawFiles,
            transcribe: projectDetails.transcribe,
            formatedFile: projectDetails.formattedFile,
        };

        if (!projectDetails.analysis || Object.keys(projectDetails.analysis).length === 0) {
            response.overview = {
                title: projectDetails.title,
                description: projectDetails.description,
                tags: projectDetails.tags,
                uploadedFiles: projectDetails.rawFiles,
                transcribe: projectDetails.transcribe,
                formatedFile: projectDetails.formattedFile,
            }
            response.feasibility = {};
            response.llmAnalysis = {};
            response.scores={};
            return res.status(200).json({
                message: "Project details fetched successfully",
                ...response
            });
        } else{
            response.overview = {
                title: projectDetails.title,
                description: projectDetails.description,
                tags: projectDetails.tags,
                uploadedFiles: projectDetails.rawFiles,
                transcribe: projectDetails.transcribe,
                formatedFile: projectDetails.formattedFile,
            }

            response.llmAnalysis = {
                overall_confidence: projectDetails.overall_confidence,
                problem_and_market_score: projectDetails.problem_and_market_score,
                value_and_model_score: projectDetails.value_and_model_score,
                team_and_traction_score: projectDetails.team_and_traction_score,
                funding_readiness_score: projectDetails.funding_readiness_score,
                strengths: projectDetails.analysis?.strengths || "Not available",
                weaknesses: projectDetails.analysis?.weaknesses || "Not available",
                prioritized_actions: projectDetails.analysis?.prioritized_actions || "Not available",
                red_flags: projectDetails.analysis?.red_flags || "Not available",
                risk_assessment: projectDetails.analysis?.risk_assessment || "Not available",
            }

            response.feasibility = {
                market_feasibility: {
                        market_feasibility_feedback: projectDetails.analysis?.market_feasibility_feedback || "Not available",
                        market_feasibility_basis: projectDetails.analysis?.market_feasibility_basis || "Not available"
                    },
                    technical_feasibility: {
                        technical_feasibility_feedback: projectDetails.analysis?.technical_feasibility_feedback || "Not available",
                        technical_feasibility_basis: projectDetails.analysis?.technical_feasibility_basis || "Not available"
                },
                financial_feasibility: {
                    financial_feasibility_feedback: projectDetails.analysis?.financial_feasibility_feedback || "Not available",
                    financial_feasibility_basis: projectDetails.analysis?.financial_feasibility_basis || "Not available",
                    value_and_model_score: projectDetails.analysis?.value_and_model_score || "Not available",
                    value_and_model_basis: projectDetails.analysis?.value_and_model_basis || "Not available",
                    funding_readiness_basis: projectDetails.analysis?.funding_readiness_basis || "Not available",
                    funding_readiness_score: projectDetails.analysis?.funding_readiness_score || "Not available",
                },
                kpis: projectDetails.analysis?.extracted_kpis || "Not available"
            }

            return res.status(200).json({
                message: "Project details fetched successfully",
                ...response
            });
        }

        
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAnalysis = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }


        const project = await ProjectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        console.log("project", project.transcribe[0])

        const analysis = project.analysis;
        if (analysis && Object.keys(analysis).length > 0) {
            console.log("Analysis already exists", analysis);
            return res.status(404).json({ message: "Analysis already there" });
        }
        
        const response = await axios.post('http://127.0.0.1:7000/llm-workflow/llm-analysis', {
            json_data: project.transcribe[0]
        })


        const savedAnalysis = await ProjectModel.findByIdAndUpdate(projectId, {
            $set: {
                analysis: response.data
            }
        }, { new: true });

        if (!savedAnalysis) {
            return res.status(404).json({ message: "Project not found" });
        }
        const data = response.data;

        const dataToSend={
            llmAnalysis : {
                overall_confidence: data.overall_confidence,
                problem_and_market_score: data.problem_and_market_score,
                value_and_model_score: data.value_and_model_score,
                team_and_traction_score: data.team_and_traction_score,
                funding_readiness_score: data.funding_readiness_score,
                strengths: data.strengths || "Not available",
                weaknesses: data.weaknesses || "Not available",
                prioritized_actions: data.prioritized_actions || "Not available",
                red_flags: data.red_flags || "Not available",
                risk_assessment: data.risk_assessment || "Not available",
            },

            feasibility : {
                market_feasibility: {
                        market_feasibility_feedback: data.market_feasibility_feedback || "Not available",
                        market_feasibility_basis: data.analysis?.market_feasibility_basis || "Not available"
                    },
                    technical_feasibility: {
                        technical_feasibility_feedback: data.analysis?.technical_feasibility_feedback || "Not available",
                        technical_feasibility_basis: data.analysis?.technical_feasibility_basis || "Not available"
                },
                financial_feasibility: {
                    financial_feasibility_feedback: data.analysis?.financial_feasibility_feedback || "Not available",
                    financial_feasibility_basis: data.analysis?.financial_feasibility_basis || "Not available",
                    value_and_model_score: data.analysis?.value_and_model_score || "Not available",
                    value_and_model_basis: data.analysis?.value_and_model_basis || "Not available",
                    funding_readiness_basis: data.analysis?.funding_readiness_basis || "Not available",
                    funding_readiness_score: data.analysis?.funding_readiness_score || "Not available",
                },
                kpis: data.analysis?.extracted_kpis || "Not available"
            }
        }



        return res.status(200).json({
            message: "Analysis fetched successfully",
            ...dataToSend
        });


    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }   
}

export const createComments = async (req, res) => {
    try {
        const { projectId, comment } = req.body;
        console.log("req.body", req.body);
        if (!projectId || !comment || typeof comment !== 'string' || comment.trim() === '') {
            console.log("Invalid input");
            return res.status(400).json({ message: "Project ID, Mentor ID and non-empty comment are required" });
        }


        const project = await ProjectModel.findById(projectId);
        if (!project) {
            console.log("Project not found");
            return res.status(404).json({ message: "Project not found" });
        }

        console.log("commentString", comment);
        project.comments.push(comment);
        await project.save();

        return res.status(201).json({ 
            message: "Comment created successfully", 
            comment: {
                text: comment.trim(),
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getComments = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: "Project ID is required" });
        }
        const project = await ProjectModel.findById(projectId).select('comments');
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        return res.status(200).json({ 
            message: "Comments fetched successfully", 
            comments: project.comments 
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}