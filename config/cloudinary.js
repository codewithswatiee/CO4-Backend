import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

// Create multer upload instance
export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow specific file types
        // Allow images, documents, and common audio file types
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            // Documents
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Audio
            'audio/mpeg',            // .mp3
            'audio/mp3',             // sometimes used
            'audio/wav',             // .wav
            'audio/x-wav',
            'audio/ogg',             // .ogg
            'audio/webm',            // webm audio
            'audio/mp4',             // .m4a/.mp4
            'audio/aac',             // .aac
            'audio/flac',            // .flac
            'audio/x-flac',
            'audio/vnd.wave',
            'audio/x-ms-wma'        // .wma
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    }
});

// Upload file buffer to Cloudinary
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            resource_type: 'auto',
            folder: options.folder || 'raw-files',
            public_id: options.public_id,
            tags: options.tags || [],
            ...options
        };

        cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
};

// Upload multiple files to Cloudinary
export const uploadMultipleToCloudinary = async (files, options = {}) => {
    try {
        const uploadPromises = files.map((file, index) => {
            const fileOptions = {
                ...options,
                public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
            };
            return uploadToCloudinary(file.buffer, fileOptions);
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Multiple files upload error:', error);
        throw error;
    }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
    try {
        console.log('Attempting to delete from Cloudinary with public ID:', publicId);
        
        // First, try to get the resource to verify it exists
        let resourceExists = false;
        try {
            const resourceInfo = await cloudinary.api.resource(publicId);
            resourceExists = true;
            console.log('Resource found:', resourceInfo.public_id);
        } catch (resourceError) {
            console.log('Resource not found with exact public ID, trying alternative formats...');
            
            // If the exact public ID doesn't work, try some common variations
            const variations = [
                publicId,
                publicId.replace(/\//g, '%2F'), // URL encoded slashes
                publicId.replace(/\//g, '_'), // Underscores instead of slashes
            ];
            
            for (const variation of variations) {
                try {
                    const resourceInfo = await cloudinary.api.resource(variation);
                    console.log('Resource found with variation:', variation);
                    publicId = variation; // Use the working variation
                    resourceExists = true;
                    break;
                } catch (varError) {
                    console.log('Variation not found:', variation);
                }
            }
        }
        
        if (!resourceExists) {
            console.log('Resource not found in Cloudinary, it may have been already deleted');
            return { result: 'not found', message: 'Resource not found in Cloudinary' };
        }
        
        // Now attempt to delete
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary delete result:', result);
        
        // Cloudinary can return 'not found' even for successful deletes sometimes
        // So we check if the resource still exists after delete attempt
        if (result.result === 'not found') {
            try {
                await cloudinary.api.resource(publicId);
                // If we can still get the resource, delete failed
                return { result: 'error', message: 'Delete operation failed - resource still exists' };
            } catch (checkError) {
                // If we can't get the resource anymore, it was successfully deleted
                return { result: 'ok', message: 'File successfully deleted' };
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

// Get optimized URL
export const getOptimizedUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, {
        quality: 'auto',
        fetch_format: 'auto',
        ...options
    });
};

// Get file info from Cloudinary
export const getFileInfo = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId);
        return result;
    } catch (error) {
        console.error('Error getting file info from Cloudinary:', error);
        throw error;
    }
};

// List files in a specific folder (for debugging)
export const listFilesInFolder = async (folderPath, options = {}) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: folderPath,
            max_results: options.maxResults || 50,
            ...options
        });
        
        console.log(`Found ${result.resources.length} files in folder: ${folderPath}`);
        result.resources.forEach(resource => {
            console.log(`- ${resource.public_id} (${resource.format}, ${resource.bytes} bytes)`);
        });
        
        return result;
    } catch (error) {
        console.error('Error listing files in folder:', error);
        throw error;
    }
};

// Search for files by tag (for debugging)
export const searchFilesByTag = async (tag, options = {}) => {
    try {
        const result = await cloudinary.api.resources_by_tag(tag, {
            max_results: options.maxResults || 50,
            ...options
        });
        
        console.log(`Found ${result.resources.length} files with tag: ${tag}`);
        result.resources.forEach(resource => {
            console.log(`- ${resource.public_id} (${resource.format}, ${resource.bytes} bytes)`);
        });
        
        return result;
    } catch (error) {
        console.error('Error searching files by tag:', error);
        throw error;
    }
};

export default cloudinary;
