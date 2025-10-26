const { DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");

/**
 * Delete an image from S3 bucket
 * @param {string} imageUrl - Full S3 URL or just the key
 * @returns {Promise<boolean>} - Returns true if deleted successfully
 */
const deleteImageFromS3 = async (imageUrl) => {
    try {
        if (!imageUrl) return false;
        
        // Extract key from URL if full URL is provided
        let key = imageUrl;
        
        // If it's a full S3 URL, extract the key
        if (imageUrl.includes('amazonaws.com')) {
            const url = new URL(imageUrl);
            key = url.pathname.substring(1); // Remove leading slash
        }
        
        const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        };
        
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`✅ Deleted image from S3: ${key}`);
        return true;
    } catch (error) {
        console.error('❌ Error deleting image from S3:', error.message);
        return false;
    }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - Returns true if file exists
 */
const checkFileExists = async (key) => {
    try {
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        };
        
        await s3Client.send(new GetObjectCommand(params));
        return true;
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return false;
        }
        throw error;
    }
};

/**
 * Extract S3 key from full URL
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key (path)
 */
const getKeyFromUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname.substring(1); // Remove leading slash
    } catch (error) {
        return url; // Return as-is if not a valid URL
    }
};

module.exports = {
    deleteImageFromS3,
    checkFileExists,
    getKeyFromUrl
};
