const mongoose = require("mongoose");

const connectDatabase = ( )=>{
    mongoose.connect(process.env.DB_URI,{useNewUrlParser:true,useUnifiedTopology:true}).then((data)=>{
    console.log(`Mongodb connected with server : ${data.connection.host}`);
});

}

module.exports = connectDatabase;
// mongodb+srv://meomgajbhiye:1234%40Pass@ecommerce.zgiwwno.mongodb.net/Ecommerce?retryWrites=true&w=majority
