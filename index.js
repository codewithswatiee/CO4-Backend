import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import dbConnect from './config/database.js';
import authRoutes from './routes/auth.route.js';
import studentRoutes from './routes/student.route.js';
dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

// Custom middleware to handle JSON parsing errors
app.use('/api', (req, res, next) => {
    express.json()(req, res, (err) => {
        if (err) {
            console.error('JSON parsing error:', err.message);
            return res.status(400).json({ 
                message: 'Invalid JSON format in request body',
                error: err.message 
            });
        }
        next();
    });
});

const corsOptions = {
    origin: ['http://localhost:3000'],
    methods: '*',
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
}

app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})



dbConnect();