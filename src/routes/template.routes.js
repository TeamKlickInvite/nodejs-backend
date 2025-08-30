import { Router } from "express";
// import { verifyToken } from "../middlewares/verify.middleware.js";
import {uploadTemplate,getAllTemplates,filterTemplates} from '../controllers/template.controller.js'
import { uploadTemplateAssets} from "../middlewares/multer.middleware.js";
// import { uploadTemplate, getAllTemplates,filterTemplates } from "../controllers/template.controller.js";
import { uploadTemplateAsset,SaveTemplateAsset } from "../middlewares/uploadTemplateAssets.middleware.js";
 import createTemplate ,{ getTemplateById}  from "../controllers/NewTemplate.controller.js"
 import { saveCustomization} from "../controllers/NewTemplate.controller.js"
 import { addGuest,updateGuest,deleteGuest,getGuestsByHost} from "../controllers/GuestBook.controller.js"
import { createGroup,getGroupsByOrder,getGroupById} from "../controllers/GuestGroup.controller.js";
import {addGuestsToGroup,getHostGroupGuests,sendInvitation} from '../controllers/GuestGroupRelation.controller.js'
import {checkFrappeAuth} from '../middlewares/checkFrappeAuth.js'


const router = Router();
router.post('/uploadTemplate', uploadTemplateAssets, uploadTemplate);
 router.post('/createTemplate', uploadTemplateAsset, createTemplate);
router.get('/getTemplateById/:id',getTemplateById)
router.post('/saveCustomization',checkFrappeAuth,SaveTemplateAsset,saveCustomization)



// Master GuestBook

router.post('/addGuest',checkFrappeAuth,addGuest)
router.delete('/deleteGuest/:guest_id',checkFrappeAuth,deleteGuest)
router.put('/updateGuest/:guest_id',checkFrappeAuth,updateGuest)
router.post('/createGroup',checkFrappeAuth,createGroup)
// router.post("/addEventToGroup/:id",addEventToGroup)
router.post('/addGuestsToGroup',checkFrappeAuth,addGuestsToGroup)
router.get("/getGroupsByOrder/:order_id",checkFrappeAuth,getGroupsByOrder)
router.get("/getHostGroupGuests/:group_id",checkFrappeAuth,getHostGroupGuests)
router.get("/getGuestsByHost/:host_id",checkFrappeAuth,getGuestsByHost)
router.post("/sendInvitation",checkFrappeAuth,sendInvitation)
router.get("/getGroupById/:id",checkFrappeAuth,getGroupById)
// router.get("/getGroupsByEvent/:eventId",getGroupsByEvent)
// router.delete("/removeEventFromGroup/:eventId",removeEventFromGroup)
// router.get('/getUserCustomizations/:user_id',getUserCustomizations)
// router.post('/create', createBlock)
// router.post('/saveCard', uploadCardAssets, saveCard);
router.get('/getAllTemplates',checkFrappeAuth,getAllTemplates)
router.get('/filterTemplates',checkFrappeAuth,filterTemplates)
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