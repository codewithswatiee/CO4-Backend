import express from 'express';
import { getAllStudents, getProjectDetails, getAnalysis, createComments, getComments } from '../controllers/mentor/mentor.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /mentors/:mentorId/students
router.get('/:mentorId/students', getAllStudents);

// GET /mentors/project/:projectId
router.get('/project/:projectId', getProjectDetails);

// GET /mentors/analysis/:projectId
router.get('/analysis/:projectId', getAnalysis);

// POST /mentors/comments
router.post('/comments', createComments);
router.get('/comments/:projectId', getComments);

export default router;