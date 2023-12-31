const ErrorHander = require("../utlis/errorhander");

module.exports = (err,req,res,next)=>{
    
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";


    // Wrong Mongodb Id error

    if(err.name === "CastError"){
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHander(message,400); 
    }

    // Mongoose Duplicate key error
    if(err.code === 11000){
        const message =`Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHander(message,400); 
    }

    // Wrong JWT error

    if(err.name === "JsonWebTokenError"){
        const message = `Json web token is invalid, try again`;
        err = new ErrorHander(message,400); 
    }

    // JWT EXPIRE ERROR
    if(err.name === "TokenExpiredError"){
        const message = `Json web token is Expired, try again`;
        err = new ErrorHander(message,400); 
    }

    res.status(err.statusCode).json({
        success:false,
        message : err.message,
    });
};