// backend/src/controllers/uploadController.js - FIXED VERSION

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// @desc    Upload single image to Cloudinary
// @route   POST /api/upload/image
// @access  Private (Admin only)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to Cloudinary using stream (for buffer)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'welfare_organization', // Organize in folder
        resource_type: 'auto', // Auto-detect file type
        transformation: [
          { width: 1200, crop: 'limit' }, // Max width 1200px
          { quality: 'auto' }, // Auto quality
          { fetch_format: 'auto' } // Auto format (WebP if supported)
        ]
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload image',
            error: error.message
          });
        }

        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          data: {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes
          }
        });
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload multiple images
// @route   POST /api/upload/images
// @access  Private (Admin only)
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'welfare_organization',
            resource_type: 'auto',
            transformation: [
              { width: 1200, crop: 'limit' },
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format
              });
            }
          }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: uploadedImages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image?publicId=YOUR_PUBLIC_ID
// @access  Private (Admin only)
exports.deleteImage = async (req, res) => {
  try {
    // Get publicId from query parameter (NOT from params)
    const { publicId } = req.query; // CHANGED: from req.params[0] to req.query

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required. Use: /api/upload/image?publicId=YOUR_PUBLIC_ID'
      });
    }

    console.log('Attempting to delete:', publicId); // Debug log

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    console.log('Cloudinary response:', result); // Debug log

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully',
        data: {
          publicId: publicId,
          result: result.result
        }
      });
    } else if (result.result === 'not found') {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete image',
        result: result.result
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};