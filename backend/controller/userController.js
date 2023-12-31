const ErrorHander = require("../utlis/errorhander");
const catchAsynError = require("../middleware/catchAsynError");
const User = require("../models/userModel");
const sendToken = require("../utlis/jwtToken")
const sendEmail = require("../utlis/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");


// Register a user

exports.registerUser = catchAsynError(async(req,res,next)=>{

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar,{
        folder:"avatars",
        width:150,
        crop:"scale",
    })
    const {name,email,password} = req.body;

    const user = await User.create({
        name,email,password,avatar:{
            public_id: myCloud.public_id,
            url:myCloud.secure_url,
        }
    });

    sendToken(user,201,res);
})

// Login user

exports.loginUser = catchAsynError(async(req,res,next)=>{


    const {email,password} = req.body;

    // checking if user has given email and password both

    if( !email || !password){
        return next(new ErrorHander("Please Enter Email and Password",400));
  
    }
    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHander("Invalid Email or Password",401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched){
        return next(new ErrorHander("Invalid Email or Password",401));
    }

    sendToken(user,200,res);

});

// Logout 

exports.logout = catchAsynError(async (req,res,next)=>{

    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true
    })

    res.status(200).json({
        success:true,
        message:"Logged Out"
    })
});


// Forgot Password 

exports.forgotPassword = catchAsynError(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
  
    if (!user) {
      return next(new ErrorHander("User not found", 404));
    }
  
    // Get ResetPassword Token
    const resetToken = user.getResetPasswordToken();
  
    await user.save({ validateBeforeSave: false });
  
    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}`;
  
    const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  
    try {
      await sendEmail({
        email: user.email,
        subject: `Ecommerce Password Recovery`,
        message,
      });
  
      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
  
      await user.save({ validateBeforeSave: false });
  
      return next(new ErrorHander(error.message, 500));
    }
  });
  


// Reset Password

exports.resetPassword = catchAsynError(async (req,res,next)=>{

    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken, resetPasswordExpire:{$gt:Date.now()}
    })

    if(!user){
        return next(new ErrorHander("Reset password token is invalid or has been expired",400));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHander("Password does not match",400));
    }
    
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined; 

    await user.save();
    
    sendToken(user,200,res);
})

// Get User Details

exports.getUserDetails = catchAsynError(async(req,res,next)=>{

    const user = await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user,
    })
})

// Update User Password

exports.updatePassword = catchAsynError(async(req,res,next)=>{

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

    if(!isPasswordMatched){
        return next(new ErrorHander("Old Password is incorrect",400));
    }

    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHander("Password does not match",400));
    }

    user.password = req.body.newPassword;
    
    await user.save();


    sendToken(user,200,res);
})

// Update User Profile

exports.updateUserProfile = catchAsynError(async(req,res,next)=>{

    const newUserData={

        name:req.body.name,
        email:req.body.email,
    }

    // we will add cloudinary later

    if(req.body.avatar !== ""){
        const user = await User.findById(req.user.id);
        const imageId = user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId)

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar,{
            folder:"avatars",
            width:150,
            crop:"scale",
        });

        newUserData.avatar = {
            public_id: myCloud.public_id,
            url:myCloud.secure_url,
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })

    res.status(200).json({
        success:true,

    })
})


// Get all User (admin)

exports.getAllUser = catchAsynError(async (req,res,next)=>{

    const users = await User.find();

    res.status(200).json({
        success:true,
        users,
    })
})

// Get single User (admin)

exports.getSingleUser = catchAsynError(async (req,res,next)=>{

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHander(`User does not doest exist with Id: ${req.params.id}`,400))
    }

    res.status(200).json({
        success:true,
        user,
    })
})


// Update User Role -- Admin

exports.updateUserRole = catchAsynError(async(req,res,next)=>{

    const newUserData={

        name:req.body.name,
        email:req.body.email,
        role:req.body.role,
    }
    
    
    // we will add cloudinary later
    
   
     await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    })



    res.status(200).json({
        success:true,

    })
})

// Delete User -- Admin

exports.deleteUser = catchAsynError(async(req,res,next)=>{

    const user = await User.findById(req.params.id);

    // we will remove cloudinary later

    if(!user){
        return next(new ErrorHander(`User does not exist with Id: ${req.params.id}`,400));
    }

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    await user.deleteOne();
    

    res.status(200).json({
        success:true,
        message:"User deleted Successfully"

    })
})



