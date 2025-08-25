import { Router } from "express";
// import { verifyToken } from "../middlewares/verify.middleware.js";
import {uploadTemplate,getAllTemplates,filterTemplates} from '../controllers/template.controller.js'
import { uploadTemplateAssets} from "../middlewares/multer.middleware.js";
// import { uploadTemplate, getAllTemplates,filterTemplates } from "../controllers/template.controller.js";
import { uploadTemplateAsset,SaveTemplateAsset } from "../middlewares/uploadTemplateAssets.middleware.js";
 import createTemplate ,{ getTemplateById}  from "../controllers/NewTemplate.controller.js"
 import { saveCustomization} from "../controllers/NewTemplate.controller.js"
 import { addGuest,updateGuest,deleteGuest,getGuestsByHost} from "../controllers/GuestBook.controller.js"
import { createGroup,getGroupsByOrder} from "../controllers/GuestGroup.controller.js";
import {addGuestsToGroup,getHostGroupGuests} from '../controllers/GuestGroupRelation.controller.js'


const router = Router();
router.post('/uploadTemplate', uploadTemplateAssets, uploadTemplate);
 router.post('/createTemplate', uploadTemplateAsset, createTemplate);
router.get('/getTemplateById/:id',getTemplateById)
router.post('/saveCustomization',SaveTemplateAsset,saveCustomization)
router.post('/addGuest',addGuest)
router.delete('/deleteGuest/:guest_id',deleteGuest)
router.put('/updateGuest/:guest_id',updateGuest)
router.post('/createGroup',createGroup)
router.post('/addGuestsToGroup',addGuestsToGroup)
router.get("/getGroupsByOrder/:order_id",getGroupsByOrder)
router.get("/getHostGroupGuests/:group_id",getHostGroupGuests)
router.get("/getGuestsByHost/:host_id",getGuestsByHost)
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