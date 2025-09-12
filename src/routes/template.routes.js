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
import { createMsgFormat,updateMsgFormat,getMsgFormatsByOrder,deleteMsgFormat } from "../controllers/CustomMsgFormat.controller.js";
import { submitRSVP } from "../controllers/Rsvp.controller.js";


const router = Router();
router.post('/uploadTemplate', uploadTemplateAssets, uploadTemplate);
 router.post('/createTemplate', uploadTemplateAsset, createTemplate);
router.get('/getTemplateById/:id',getTemplateById)
router.post('/saveCustomization',checkFrappeAuth,SaveTemplateAsset,saveCustomization)
router.get('/getAllTemplates',checkFrappeAuth,getAllTemplates)
router.get('/filterTemplates',checkFrappeAuth,filterTemplates)

// Master GuestBook
router.post('/addGuest',checkFrappeAuth,addGuest)
router.delete('/deleteGuest/:guest_id',checkFrappeAuth,deleteGuest)
router.put('/updateGuest/:guest_id',checkFrappeAuth,updateGuest)
router.get("/getGuestsByHost/:host_id",checkFrappeAuth,getGuestsByHost)

// GuestGroup
router.post('/createGroup',createGroup)
router.get("/getGroupsByOrder/:order_id",checkFrappeAuth,getGroupsByOrder)

// GuestGroupRelation
router.post('/addGuestsToGroup',checkFrappeAuth,addGuestsToGroup)
router.get("/getHostGroupGuests/:group_id",checkFrappeAuth,getHostGroupGuests)

// Msg FOrmate Api
router.post("/createMsgFormat",createMsgFormat)
router.get("/getMsgFormatsByOrder/:order_id",getMsgFormatsByOrder)
router.put("/updateMsgFormat/:msg_id",updateMsgFormat)
router.delete("/deleteMsgFormat/:msg_id",deleteMsgFormat)


// Invitaions APi
router.post("/sendInvitation",checkFrappeAuth,sendInvitation)
router.get("/getGroupById/:id",checkFrappeAuth,getGroupById)

// RSVP API
router.post("/submitRSVP",checkFrappeAuth,submitRSVP)

export default router