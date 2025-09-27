import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';
dotenv.config();

// Verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Verify admin role
export const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Verify doctor role
export const verifyDoctor = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        if (user.role !== 'doctor') {
            return res.status(403).json({ message: 'Access denied. Doctor privileges required.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Doctor verification error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Verify admin or doctor role
export const verifyAdminOrDoctor = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        if (user.role !== 'admin' && user.role !== 'doctor') {
            return res.status(403).json({ message: 'Access denied. Admin or Doctor privileges required.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin/Doctor verification error:', error);
        res.status(401).json({ message: 'Invalid token.' });
    }
};
