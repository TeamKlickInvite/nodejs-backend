import { ApiError } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken";
// import { User } from "../models/user.models.js"; 


// middlewares/verifyToken.js


// export const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith("Bearer ")) {
//     return res.status(401).json({ error: "No token provided" });
//   }

//   const token = authHeader.split(" ")[1];
//   try {
//     const decoded = jwt.verify(token, process.env.FRAPPE_JWT_SECRET); // Get secret/public key from Frappe dev
//     req.user = decoded; // You’ll now have access to user ID
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: "Invalid or expired token" });
//   }
// };

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // ✅ Allow dummy token for local testing
  if (token === "dummy-token") {
    req.user = {
      sub: "mock-user-123" // 🔑 This acts as userId in the controller
    };
     console.log("Authenticated user:", req.user);
    return next();
  }

  // 🔒 (Optional) add real JWT check for Frappe here later
  return res.status(403).json({ error: "Invalid token" });
};
















































export const verifyJwt = asyncHandler(async(req, res, next) =>{
try {
    
        const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ","")
        console.log("token",token)
    
        if(!token){
            throw new ApiError(401,"unauthorized request")
        }
        
        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        console.log("decode Token", decodeToken)
        console.log("ID Type:", typeof decodeToken._id);
     
        const user = await User.findOne({ _id: decodeToken._id }).select("-password -refreshToken");
        console.log(user)
    
        if(!user){
            throw new ApiError(401,"invalid acces token")
        }
        req.user = user;
        next()
} catch (error) {
     throw new ApiError(401,"invalid acces error")
}
   
})