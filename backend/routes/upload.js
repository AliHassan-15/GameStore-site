const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { logManualActivity } = require('../middleware/activityLogger');
const { ProductImage } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Max 10 files
  }
});

// Ensure upload directory exists
const ensureUploadDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Process and save image
const processAndSaveImage = async (buffer, filename, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'jpeg',
    thumbnail = true
  } = options;

  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const imagesDir = path.join(uploadPath, 'images');
  const thumbnailsDir = path.join(uploadPath, 'thumbnails');

  await ensureUploadDir(imagesDir);
  if (thumbnail) {
    await ensureUploadDir(thumbnailsDir);
  }

  const timestamp = Date.now();
  const uniqueId = uuidv4().replace(/-/g, '');
  const baseFilename = `${timestamp}-${uniqueId}`;

  let imageBuffer = buffer;

  // Process image
  try {
    const sharpInstance = sharp(buffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if needed
    if (metadata.width > width || metadata.height > height) {
      imageBuffer = await sharpInstance
        .resize(width, height, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .toFormat(format)
        .jpeg({ quality })
        .toBuffer();
    } else {
      imageBuffer = await sharpInstance
        .toFormat(format)
        .jpeg({ quality })
        .toBuffer();
    }

    // Save main image
    const imagePath = path.join(imagesDir, `${baseFilename}.${format}`);
    await fs.writeFile(imagePath, imageBuffer);

    let thumbnailPath = null;

    // Create thumbnail if requested
    if (thumbnail) {
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .toFormat(format)
        .jpeg({ quality: 70 })
        .toBuffer();

      thumbnailPath = path.join(thumbnailsDir, `${baseFilename}-thumb.${format}`);
      await fs.writeFile(thumbnailPath, thumbnailBuffer);
    }

    return {
      filename: `${baseFilename}.${format}`,
      path: imagePath.replace(uploadPath, ''),
      thumbnailPath: thumbnailPath ? thumbnailPath.replace(uploadPath, '') : null,
      size: imageBuffer.length,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${format}`
    };
  } catch (error) {
    throw new AppError(`Image processing failed: ${error.message}`, 400);
  }
};

// Upload product images
router.post('/product-images', authenticate, requireAdmin, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No images uploaded', 400);
  }

  const { productId } = req.body;
  const uploadedImages = [];

  for (const file of req.files) {
    try {
      const processedImage = await processAndSaveImage(file.buffer, file.originalname, {
        width: 1200,
        height: 1200,
        quality: 85
      });

      // Save to database if productId is provided
      if (productId) {
        const productImage = await ProductImage.create({
          productId,
          imageUrl: processedImage.path,
          thumbnailUrl: processedImage.thumbnailPath,
          fileSize: processedImage.size,
          mimeType: processedImage.mimeType,
          width: processedImage.width,
          height: processedImage.height,
          altText: file.originalname,
          sortOrder: uploadedImages.length
        });

        uploadedImages.push({
          ...processedImage,
          id: productImage.id
        });
      } else {
        uploadedImages.push(processedImage);
      }
    } catch (error) {
      console.error('Image processing error:', error);
      // Continue with other images even if one fails
    }
  }

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'upload.product_images',
    entityType: 'product',
    entityId: productId,
    description: `Uploaded ${uploadedImages.length} product images`,
    metadata: {
      imageCount: uploadedImages.length,
      productId
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: `${uploadedImages.length} images uploaded successfully`,
    data: { images: uploadedImages }
  });
}));

// Upload category image
router.post('/category-image', authenticate, requireAdmin, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image uploaded', 400);
  }

  const { categoryId } = req.body;

  try {
    const processedImage = await processAndSaveImage(req.file.buffer, req.file.originalname, {
      width: 600,
      height: 400,
      quality: 80
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'upload.category_image',
      entityType: 'category',
      entityId: categoryId,
      description: 'Uploaded category image',
      metadata: {
        imagePath: processedImage.path,
        categoryId
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Category image uploaded successfully',
      data: { image: processedImage }
    });
  } catch (error) {
    throw new AppError(`Image upload failed: ${error.message}`, 400);
  }
}));

// Upload user avatar
router.post('/avatar', authenticate, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No image uploaded', 400);
  }

  try {
    const processedImage = await processAndSaveImage(req.file.buffer, req.file.originalname, {
      width: 300,
      height: 300,
      quality: 85,
      thumbnail: false
    });

    // Update user avatar
    await req.user.update({ avatar: processedImage.path });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'upload.avatar',
      entityType: 'user',
      entityId: req.user.id,
      description: 'Uploaded user avatar',
      metadata: {
        imagePath: processedImage.path
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatar: processedImage.path }
    });
  } catch (error) {
    throw new AppError(`Avatar upload failed: ${error.message}`, 400);
  }
}));

// Upload review images
router.post('/review-images', authenticate, upload.array('images', 5), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No images uploaded', 400);
  }

  const { reviewId } = req.body;
  const uploadedImages = [];

  for (const file of req.files) {
    try {
      const processedImage = await processAndSaveImage(file.buffer, file.originalname, {
        width: 800,
        height: 600,
        quality: 80
      });

      uploadedImages.push(processedImage);
    } catch (error) {
      console.error('Image processing error:', error);
    }
  }

  // Log activity
  await logManualActivity({
    userId: req.user.id,
    action: 'upload.review_images',
    entityType: 'review',
    entityId: reviewId,
    description: `Uploaded ${uploadedImages.length} review images`,
    metadata: {
      imageCount: uploadedImages.length,
      reviewId
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({
    success: true,
    message: `${uploadedImages.length} review images uploaded successfully`,
    data: { images: uploadedImages }
  });
}));

// Delete uploaded image
router.delete('/:filename', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const imagesDir = path.join(uploadPath, 'images');
  const thumbnailsDir = path.join(uploadPath, 'thumbnails');

  try {
    // Check if file exists
    const imagePath = path.join(imagesDir, filename);
    const thumbnailPath = path.join(thumbnailsDir, filename.replace(/(\.[^.]+)$/, '-thumb$1'));

    // Delete main image
    try {
      await fs.unlink(imagePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Delete thumbnail
    try {
      await fs.unlink(thumbnailPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Remove from database if it's a product image
    await ProductImage.destroy({
      where: {
        imageUrl: `/images/${filename}`
      }
    });

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'upload.delete',
      entityType: 'system',
      description: `Deleted uploaded image: ${filename}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    throw new AppError(`Failed to delete image: ${error.message}`, 400);
  }
}));

// Get upload statistics
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const imagesDir = path.join(uploadPath, 'images');
  const thumbnailsDir = path.join(uploadPath, 'thumbnails');

  try {
    // Get directory sizes
    const getDirSize = async (dirPath) => {
      try {
        const files = await fs.readdir(dirPath);
        let totalSize = 0;
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          }
        }
        
        return totalSize;
      } catch (error) {
        return 0;
      }
    };

    const imagesSize = await getDirSize(imagesDir);
    const thumbnailsSize = await getDirSize(thumbnailsDir);
    const totalSize = imagesSize + thumbnailsSize;

    // Get file counts
    const getFileCount = async (dirPath) => {
      try {
        const files = await fs.readdir(dirPath);
        return files.length;
      } catch (error) {
        return 0;
      }
    };

    const imageCount = await getFileCount(imagesDir);
    const thumbnailCount = await getFileCount(thumbnailsDir);

    res.json({
      success: true,
      data: {
        totalSize,
        imagesSize,
        thumbnailsSize,
        imageCount,
        thumbnailCount,
        uploadPath
      }
    });
  } catch (error) {
    throw new AppError(`Failed to get upload statistics: ${error.message}`, 400);
  }
}));

// Clean up orphaned images
router.post('/cleanup', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const uploadPath = process.env.UPLOAD_PATH || './uploads';
  const imagesDir = path.join(uploadPath, 'images');
  const thumbnailsDir = path.join(uploadPath, 'thumbnails');

  try {
    // Get all image files
    const imageFiles = await fs.readdir(imagesDir);
    const thumbnailFiles = await fs.readdir(thumbnailsDir);

    // Get all images referenced in database
    const productImages = await ProductImage.findAll({
      attributes: ['imageUrl', 'thumbnailUrl']
    });

    const referencedImages = new Set();
    const referencedThumbnails = new Set();

    productImages.forEach(img => {
      if (img.imageUrl) {
        referencedImages.add(path.basename(img.imageUrl));
      }
      if (img.thumbnailUrl) {
        referencedThumbnails.add(path.basename(img.thumbnailUrl));
      }
    });

    // Find orphaned files
    const orphanedImages = imageFiles.filter(file => !referencedImages.has(file));
    const orphanedThumbnails = thumbnailFiles.filter(file => !referencedThumbnails.has(file));

    // Delete orphaned files
    let deletedCount = 0;

    for (const file of orphanedImages) {
      try {
        await fs.unlink(path.join(imagesDir, file));
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete orphaned image: ${file}`, error);
      }
    }

    for (const file of orphanedThumbnails) {
      try {
        await fs.unlink(path.join(thumbnailsDir, file));
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete orphaned thumbnail: ${file}`, error);
      }
    }

    // Log activity
    await logManualActivity({
      userId: req.user.id,
      action: 'upload.cleanup',
      entityType: 'system',
      description: `Cleaned up ${deletedCount} orphaned images`,
      metadata: {
        deletedCount,
        orphanedImages: orphanedImages.length,
        orphanedThumbnails: orphanedThumbnails.length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} orphaned files.`,
      data: {
        deletedCount,
        orphanedImages: orphanedImages.length,
        orphanedThumbnails: orphanedThumbnails.length
      }
    });
  } catch (error) {
    throw new AppError(`Cleanup failed: ${error.message}`, 400);
  }
}));

module.exports = router; 