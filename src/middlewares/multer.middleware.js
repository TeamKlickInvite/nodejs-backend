// File: middlewares/upload.middleware.js
// middleware/multer.js or inside your controller
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './public/temp'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${unique}${ext}`);
  }
});

export const uploadTemplateAssets = multer({ storage }).fields([
  { name: 'previewImage', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 },
  { name: 'html', maxCount: 1 }
]);


// For saving/editing cards: upload up to 5 images for image blocks
export const uploadCardAssets = multer({ storage }).array('images', 5);

// Optional: single block image upload
// export const uploadBlockImageMulter = multer({ storage }).single('blockImage');
