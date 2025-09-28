import express from "express";
import { getAllStudentDetails, getProjectDetails, createProject, getFeedback } from "../controllers/student/student.controller.js";
import { upload } from "../config/cloudinary.js";
import { handleUploadError } from "../utils/upload.util.js";

const router = express.Router();

router.get("/:studentId", getAllStudentDetails);
router.get("/project/:projectId", getProjectDetails);
router.get("/feedback/:projectId", getFeedback);

router.post(
  "/create",
  upload.array("files", 10),
  createProject,
  // Express error handler for multer (delegate to shared handler)
  (err, req, res, next) => handleUploadError(err, req, res, next)
);

export default router;