import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { Router } from "express";
import { registerUser, loginUser,logoutUser,getuserProfile } from "../controllers/user.controller.js";


const router = Router()

router.route("/register").post(upload.fields([{
        name:"avatar",
        maxCount:1
},{
        name:"coverImage",
        maxCount:1
},{
        name:"file",
        maxCount:5
}
    ]),registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/c/:username").get(verifyJWT,getuserProfile)

export default router