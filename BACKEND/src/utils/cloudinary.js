import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        fs.unlinkSync(localFilePath);
        // response contains a lot of things including  url of the file 
        return response;
    } catch (error) {
        console.log("Failed to upload file on the cloudinary server!!",error);
        fs.unlinkSync(localFilePath);
        return null;
    }
}

export {uploadOnCloudinary}