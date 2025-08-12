import { Router } from "express";
// import { verifyToken } from "../middlewares/verify.middleware.js";
import {uploadTemplate,getAllTemplates,filterTemplates} from '../controllers/template.controller.js'
import { uploadTemplateAssets} from "../middlewares/multer.middleware.js";
// import { uploadTemplate, getAllTemplates,filterTemplates } from "../controllers/template.controller.js";
import { uploadTemplateAsset } from "../middlewares/uploadTemplateAssets.middleware.js";
 import createTemplate  from "../controllers/NewTemplate.controller.js"
// import { saveCustomization,getUserCustomizations } from "../controllers/NewTemplate.controller.js"


const router = Router();
router.post('/uploadTemplate', uploadTemplateAssets, uploadTemplate);
 router.post('/createTemplate', uploadTemplateAsset, createTemplate);
// router.post('/saveCustomization',saveCustomization)
// router.get('/getUserCustomizations/:user_id',getUserCustomizations)
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