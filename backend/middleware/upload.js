const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Process image with Sharp
const processImage = async (file) => {
  const filename = `photo-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
  const filepath = path.join('uploads', filename);

  // Ensure uploads directory exists
  await fs.mkdir('uploads', { recursive: true });

  // Process image with Sharp
  await sharp(file.buffer)
    .resize(800, 800, { // Resize to max dimensions while maintaining aspect ratio
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: 80 }) // Convert to WebP format with 80% quality
    .toFile(filepath);

  return filename;
};

// Middleware to process uploaded image
const processUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    const filename = await processImage(req.file);
    req.file.filename = filename;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, processUpload }; 
