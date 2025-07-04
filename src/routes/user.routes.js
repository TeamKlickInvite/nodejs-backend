import { Router } from "express";
import { sendOtp,verifyOtp, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/verify.middleware.js";
// import { sendOtp, verifyOtp,  } from "../controllers/user.controllers.js";

const router = Router()

router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1  
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

// router.route("/login").post(loginUser)
router.post("/send-otp",sendOtp)
router.post("/verify-otp",verifyOtp)
router.route("/refresh-token").post(refreshAccessToken)


// secured routing
router.route("/logout").post(verifyJwt,logoutUser)
export default router