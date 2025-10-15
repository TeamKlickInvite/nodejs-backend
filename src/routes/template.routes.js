import { Router } from "express";
// import { verifyToken } from "../middlewares/verify.middleware.js";
import {uploadTemplate,getAllTemplates,filterTemplates} from '../controllers/template.controller.js'
import { uploadTemplateAssets} from "../middlewares/multer.middleware.js";
// import { uploadTemplate, getAllTemplates,filterTemplates } from "../controllers/template.controller.js";
import { uploadTemplateAsset,SaveTemplateAsset } from "../middlewares/uploadTemplateAssets.middleware.js";
 import createTemplate ,{ getTemplateById}  from "../controllers/NewTemplate.controller.js"
 import { saveCustomization} from "../controllers/NewTemplate.controller.js"
 import { addGuest,updateGuest,deleteGuest,getGuestsByHost} from "../controllers/GuestBook.controller.js"
import { createGroup,getGroupsByOrder,getGroupById,addEventToGroup,getGroupsByEvent,removeEventFromGroup,updateGroup,getGroupEvents,deleteGroup} from "../controllers/GuestGroup.controller.js";
import {addGuestsToGroup,getHostGroupGuests,sendInvitation,invitedGuest,moveGuestToNewGroup,getAvailableGuestsByOrder,removeGuestFromGroup,openInvite} from '../controllers/GuestGroupRelation.controller.js'
import {checkFrappeAuth} from '../middlewares/checkFrappeAuth.js'
import { createMsgFormat,updateMsgFormat,getMsgFormatsByOrder,deleteMsgFormat,getMsgFormatsByGroup } from "../controllers/CustomMsgFormat.controller.js";
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
router.post("/createGroup",checkFrappeAuth,createGroup)
router.put("/addEventToGroup/:group_id",checkFrappeAuth,addEventToGroup)
router.get("/getGroupsByOrder/:order_id",checkFrappeAuth,getGroupsByOrder)
router.delete("/removeEventFromGroup/:group_id/:eventId",checkFrappeAuth,removeEventFromGroup)
router.put("/updateGroup/:group_id",checkFrappeAuth,updateGroup)
router.get("/getGroupsByEvent/:eventId",checkFrappeAuth,getGroupsByEvent)
router.get("/getGroupEvents/:group_id",checkFrappeAuth,getGroupEvents)//
router.delete("/deleteGroup/:group_id",deleteGroup)//

// GuestGroupRelation
router.post('/addGuestsToGroup',checkFrappeAuth,addGuestsToGroup)
router.delete("/removeGuestFromGroup/:relation_id",checkFrappeAuth,removeGuestFromGroup)
router.get("/getHostGroupGuests/:group_id",checkFrappeAuth,getHostGroupGuests)
router.get("/invitedGuest/:order_id",checkFrappeAuth,invitedGuest)
router.post("/moveGuestToNewGroup",checkFrappeAuth,moveGuestToNewGroup)
router.get("/getAvailableGuestsByOrder/:host_id/:order_id",checkFrappeAuth,getAvailableGuestsByOrder)

// Msg FOrmate Api
router.post("/createMsgFormat",checkFrappeAuth,createMsgFormat)
router.get("/getMsgFormatsByGroup/:group_id",checkFrappeAuth,getMsgFormatsByGroup)
router.get("/getMsgFormatsByOrder/:order_id",checkFrappeAuth,getMsgFormatsByOrder)
router.put("/updateMsgFormat/:msg_id",checkFrappeAuth,updateMsgFormat)
router.delete("/deleteMsgFormat/:msg_id",checkFrappeAuth,deleteMsgFormat)



// Invitaions APi
router.post("/sendInvitation",checkFrappeAuth,sendInvitation)
router.get("/getGroupById/:id",checkFrappeAuth,getGroupById)
router.get("/openInvite/:uniqueCode",openInvite)

// RSVP API
router.post("/submitRSVP",checkFrappeAuth,submitRSVP)

export default router