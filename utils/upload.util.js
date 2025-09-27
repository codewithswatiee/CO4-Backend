import multer from 'multer';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary.js';
import ProjectModel from '../models/project.model.js';


// Upload  files
export const uploadMultipleFiles = async (studentId, files) => {
    try {     // Create folder structure
        const folderPath = `raw-files/students/${studentId}`;
        
        // Upload all files to Cloudinary
        const uploadPromises = files.map(async (file, index) => {
            const result = await uploadToCloudinary(file.buffer, {
                folder: folderPath,
                public_id: `${Date.now()}_${index}_${file.originalname.split('.')[0]}`,
                tags: [
                'raw-files',
                `student-${studentId}`,
            ]
            });

            return {
                name: file.originalname,
                url: result.secure_url,
                publicId: result.public_id,
                uploadDate: new Date()
            };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        console.log('Uploaded files:', uploadedFiles);

        return {
            message: `${uploadedFiles.length} files uploaded successfully`,
            files: uploadedFiles,
            success: true
        }; 

    } catch (error) {
        console.error('Multiple upload error:', error);
        return {
            message: 'Failed to upload files',
            error: error.message 
        }
    }
};

// Delete a file by public ID
export const deleteFile = async (req, res) => {
    try {
        console.log('Request body type:', typeof req.body);
        console.log('Request body:', req.body);
        
        let publicId;
        
        // Handle different possible formats of the request body
        if (typeof req.body === 'string') {
            try {
                // Try to parse the body if it's a string
                const parsedBody = JSON.parse(req.body);
                publicId = parsedBody.publicId;
            } catch (parseError) {
                console.error('Error parsing request body:', parseError);
            }
        } else if (req.body && typeof req.body === 'object') {
            // If it's already an object, extract publicId directly
            publicId = req.body.publicId;
        }
        
        console.log('Deleting file with public ID:', publicId);
        
        if (!publicId) {
            return res.status(400).json({ message: 'Public ID is required' });
        }

        // First check if the file exists in our database
        const projectWithFile = await ProjectModel.findOne({ 'rawFiles.publicId': publicId });

        if (!projectWithFile) {
            return res.status(404).json({
                message: 'File not found in database',
                success: false
            });
        }

        // Delete from Cloudinary
        const result = await deleteFromCloudinary(publicId);
        console.log('Cloudinary delete result:', result);

        // Remove from database regardless of Cloudinary result
        // (file might have been manually deleted from Cloudinary)
        const dbUpdateResult = await ProjectModel.updateMany(
            { 'rawFiles.publicId': publicId },
            { $pull: { rawFiles: { publicId: publicId } } }
        );

        console.log('Database update result:', dbUpdateResult);

        // Consider it successful if either:
        // 1. Cloudinary deletion was successful
        // 2. File was not found in Cloudinary (already deleted) but existed in DB
        if (result.result === 'ok' || result.result === 'not found') {
            return res.status(200).json({ 
                message: result.result === 'ok' ? 'File deleted successfully from both Cloudinary and database' : 'File removed from database (was already deleted from Cloudinary)',
                result,
                dbUpdated: dbUpdateResult.modifiedCount > 0,
                success: true
            });
        }

        return res.status(400).json({ 
            message: 'Failed to delete file from Cloudinary',
            result,
            dbUpdated: dbUpdateResult.modifiedCount > 0,
            success: false
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ 
            message: 'Failed to delete file', 
            error: error.message,
            success: false
        });
    }
};

// Middleware for handling upload errors
export const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum size is 10MB.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                message: 'Too many files. Maximum is 10 files.' 
            });
        }
    }
    
    if (error.message.includes('File type')) {
        return res.status(400).json({ 
            message: error.message 
        });
    }
    
    next(error);
};

