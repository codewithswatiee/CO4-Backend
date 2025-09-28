import express from 'express';
import { 
    fetchAllStudents, 
    fetchAllMentors, 
    assignMentorToStudent, 
    getPotentialIdeas, 
    getAssignedMentors
} from '../controllers/admin/admin.controller.js';

const router = express.Router();

// Get all students
router.get('/students', fetchAllStudents);

// Get all mentors
router.get('/mentors',  fetchAllMentors);

// Assign mentor to student
router.post('/assign-mentor', assignMentorToStudent);
router.get('/mentor-assignments', getAssignedMentors);

// Get potential ideas categorized
router.get('/potential-ideas', getPotentialIdeas);

export default router;