const dotenv=require('dotenv').config().parsed;

//Inbuilt node.js modules
const fs=require("fs");
const http=require("http");
const https=require('https');
const path=require("path");

//Third party modules installed using npm from npm repository.
const express=require("express");
const bodyParser=require("body-parser");
const app=express();
const mongoose=require('mongoose');
const session=require('express-session');
const User=require("./Models/User");
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf=require("csurf");
const csrfProtection=csrf();
const flash=require("connect-flash");
const multer=require('multer');
const helmet=require('helmet');
const compression=require('compression');
const morgan=require('morgan');

//User Defined Modules.
const rootDir=require('./Utils/path');
const product=require("./Models/Product");
const user=require("./Models/User");

//store session in mongodb
let uri=`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.z0rzwg9.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const store = new MongoDBStore({
   uri,
   collection: 'sessions'
 });

// parse req data
const fileStorage=multer.diskStorage({
   destination:(req,file,cb)=>{
      cb(null,'images');
   },
   filename:(req,file,cb)=>{
      // let loc=new Date().toISOString();
      // file.originalname=loc+"_"+file.originalname;
      let fileName=new Date().toISOString().replace(/:/g,'_');
       fileName+=Math.floor(Math.random()*1000000).toString()+".jpg";
      req.body.filePath="images\\"+fileName;

      cb(null,fileName); //give distinct image name.
   }
});

const fileFilter=(req,file,cb)=>{
   if(file.mimetype==='image/png'|| file.mimetype==='image/jpg' || file.mimetype==='image/jpeg')
   {
      cb(null,true);
   }
   else
   {
      cb(null,false);
   }
}


//Set templating engine.
app.set("view engine","ejs"); //set view engine.
app.set("views",path.join(__dirname,"Views")); //set view folder.


// parse the req object
app.use(bodyParser.urlencoded({extended:false}));
app.use(
   multer({storage:fileStorage,fileFilter}).single('image')
);

//set public folders
app.use(express.static(path.join(__dirname,'Public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//set session
app.use(
   session({
     secret: 'my secret',
     resave: false,
     saveUninitialized: false,
     store:store
   })
 );

app.use(csrfProtection);
app.use(flash());

const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{ //write log info to a file.
   flags:'a'
});

app.use(helmet()); //add secure http headers
app.use(compression()); //compress the response assests
app.use(morgan('combined',{stream:accessLogStream})); //store /display logging info.



app.use((req, res, next) => {
   res.locals.isAuthenticated = req.session.isLoggedIn;
   res.locals.csrfToken = req.csrfToken();
   next();
 });

app.use((req,res,next)=>{
   if(!req.session.user)
   {
      return next();
   }
   user.findById(req.session.user._id).then((e)=>{
      req.user=e;
      next();
   }).catch((err)=>{
      console.log(err);
   });
   
});

// app.use((req,res,next)=>{
//    console.log(process.env.M_NAME);
//    next();
// })

app.use(require("./Routes/shop"));
app.use('/admin',require("./Routes/admin")); //Filtering routes Mechanism
app.use(require('./Routes/auth'));


app.use('/',(req,res,next)=>{
   return res.render('404',{title:"Page not found"});
});

app.use((error,req,res,next)=>{
   console.log(error)
   return res.status(500).render("500",{title:"Error",link:'/error',isAuthenticated:req.session.isLoggedIn});
});

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.z0rzwg9.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`).then(()=>{}).catch((err)=>{
   console.log("error is: "+err);
});

app.listen(3000);