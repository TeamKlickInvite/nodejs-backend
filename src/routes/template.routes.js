import { Router } from "express";
// import { verifyToken } from "../middlewares/verify.middleware.js";
import {uploadTemplate,getAllTemplates,filterTemplates} from '../controllers/template.controller.js'
import { uploadTemplateAssets,uploadCardAssets} from "../middlewares/multer.middleware.js";


const router = Router();
router.post('/uploadTemplate', uploadTemplateAssets, uploadTemplate);
// router.post('/create', createBlock)
// router.post('/saveCard', uploadCardAssets, saveCard);
router.get('/getAllTemplates',getAllTemplates)
router.get('/filterTemplates',filterTemplates)
// router.get('/templates/:templateId/details', getTemplateDetails);
// router.get('/export', exportCard);
// router.post('/uploadBlockImage', uploadBlockImageMulter, uploadBlockImage);
 
// router.post('/export', exportRenderedTemplate);
// router.get("/getAllTemplates",getAllTemplates)
// router.get("/:id", getAllTemplatesByid);
// router.post('/save', verifyToken, saveOrUpdateDraft);

// // ✅ Finalize a draft explicitly
// router.post('/finalize', verifyToken, finalizeDraft);
// router.get("/getTemplatesByTitle/:title", getTemplatesByTitle);
export default router