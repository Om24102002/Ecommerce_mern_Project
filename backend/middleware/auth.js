const ErrorHander = require("../utlis/errorhander");
const catchAsynError = require("./catchAsynError");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");


exports.isAuthenticatedUser = catchAsynError(async (req,res,next)=>{

    const {token} = req.cookies;

    if(!token){
        return next(new ErrorHander("Please login to access this resource",401));
    }

    const decodeData = jwt.verify(token,process.env.JWT_SECRET);

    req.user = await User.findById(decodeData.id);

    next();

})


// authorizeRoles

exports.authorizeRoles = (...roles)=>{

    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHander(`Role: ${req.user.role} is not allowed to access this resource`,403));
        }

        next();
    };
}