import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
const generateAccessandRefreshTokens= async (userId)=>{
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken;
       await  user.save({validBeforeSave:false})
        return {accessToken, refreshToken};
}
const options = {
    httpOnly:true,
    secure:true
}
const registerUser = asyncHandler(async (req, res)=>{
        const {fullname, username, email,password} = req.body
        // some()returns true or false
        if([fullname,username,email, password].some((field)=>{
            field?.trim()===""
        })){
            throw new ApiError(400,"All fields are required!")
        }

        const registeredUser = await User.findOne({
           $or:[{username}, {email}]
        })
        if(registeredUser){
            throw new ApiError(400,"user already exist try to login into your account")
        }
        // due to multer i have access to files 
        const avatarfilePath = await req.files?.avatar[0]?.path
        const coverImagePath = await req.files?.coverImage[0].path
        const filePath = await req.files?.file[0].path

        if(!avatarfilePath){
            throw new ApiError(400,"file is required")
        }
        if(!coverImagePath){
            throw new ApiError(400,"file is required")
        }
        if(!filePath){
            throw new ApiError(400,"file is required")
        }

        const avatar = await uploadOnCloudinary(avatarfilePath)
        const coverImage = await uploadOnCloudinary(coverImagePath)
        const file = await uploadOnCloudinary(filePath)
        const user = await User.create({
            email,
            username:username.toLowerCase(),
            password,
            fullname,
            avatar:avatar.url,
            coverImage:coverImage.url,
            file:file.url

        })

        const createdUser = await User.findOne(user._id).select("-password -refreshToken")
        if(!createdUser){
            throw new ApiError(500,"Error while registering the user")
        }

        return res.status(200).json(new ApiResponse(200,createdUser,"user is successfully registered"))

})

const loginUser = asyncHandler(async (req, res)=>{
        const{email, username, password} = req.body;
        if(!email && !username){
            throw new ApiError(400,"email or username is required.");
        }

        const user = await User.findOne({
            $or:[{email},{username}]
        })
        if(!user){
            throw new ApiError(400,"Cannot find user");
        }
        const passwordCorect = await user.isPasswordCorrect(password);
        if(!passwordCorect){
            throw new ApiError(400,"Invalid password or email");
        }
        
        // if the compiler is at this line it means user is found so we will generate tokens and give it to the user.
        const {accessToken, refreshToken} = await generateAccessandRefreshTokens(user._id)

        // at this point refreshToken is saved in the database is shown wwhich i dont want.
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
                .json(new ApiResponse(200,
                   { user:loggedInUser,accessToken,refreshToken},"User is successfully logged in"
                ))
        
})  

const logoutUser = asyncHandler(async (req, res)=>{
         await User.findByIdAndUpdate(req.user._id,{
            $set:{
                refreshToken:undefined
            }
        },{
            new:true
        })
        return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
        .json(new ApiResponse(200,{},"user is successfully logged out!!"))

})

const getuserProfile = asyncHandler(async (req, res)=>{
            const {username} = req.params;
            if(!username){
                throw new ApiError(400,"Username not found");
            }
            const profile = await User.aggregate([{
                $match:{
                    username:username
                }
            },{
                $project:{
                    fullname:1,
                    username:1,
                    email:1,
                    coverImage:1,
                    avatar:1,
                    file:1
                }
            }])
           if(!profile?.length){
            throw new ApiError(400,"Profile not found")
           }
           return res.status(200).json(new ApiResponse(200,profile[0],"Profile fetched successfully!"))
})
export {registerUser, loginUser,logoutUser,getuserProfile}