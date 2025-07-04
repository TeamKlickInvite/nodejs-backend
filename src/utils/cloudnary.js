import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// import fs from 'fs'
// import { v2 as cloudinary} from "cloudinary"
// import { response } from 'express';

//  // Configuration
//  cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET
// });
// const uploadOnCloudinary = async (localFilePath) =>{
//     try {
//         if(!localFilePath) return null
//         //upload the file on the cloudinary
//       const response = await cloudinary.uploader.upload(localFilePath,{
//             resource_type:"auto"
//         })
//       //filr has been uploaded successfully:
//       console.log("file is uploaded on clodinary")
//       return response
//     } catch (error) {
//         fs.unlinkSync(localFilePath)// remove the loacally saved temporarly file
//     }
// }

// export {uploadOnCloudinary}