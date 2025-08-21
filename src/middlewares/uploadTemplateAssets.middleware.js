import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './public/uploads/templates';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${unique}${ext}`);
  },
});

export const uploadTemplateAsset = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit to 5MB per file
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only JPEG, JPG, or PNG images are allowed!'));
    }
  },
}).fields([
  { name: 'previewImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 } // For pimage
  // { name: 'backgroundImage', maxCount: 1 }, // For bimage
]);

export const SaveTemplateAsset = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit to 5MB per file
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Only JPEG, JPG, or PNG images are allowed!'));
    }
  },
}).fields([
  { name: 'SaveImage', maxCount: 1 } // For pimage
  // { name: 'backgroundImage', maxCount: 1 }, // For bimage
]);