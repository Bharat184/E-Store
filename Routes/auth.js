const express=require("express");
const router=express.Router();
const auth=require("../Controllers/authController");
const middleware=require("../Middleware/isAuth")
const {body}=require("express-validator");
const user=require('../Models/User');

router.get('/login',auth.loginPage);
router.get('/logout',middleware.isAuth,auth.logOut);
router.get('/signup',auth.signUp);
router.get('/reset',auth.getResetMailPage);

router.post('/signup',[
    body('name',"Name should exists").isLength({min:1}),
    body('email',"Use a valid email").isEmail().custom((val)=>{
        return user.findOne({email:val}).then((userDoc)=>{
            if(userDoc)
            {
                throw new Error("Email exist already!");
            }
        })
    }),
    body('password',"Password length should be atleast 5 character long.").isLength({min:5})
],auth.postSignup);

router.post('/login',[
    body('email',"Invalid Email").isEmail(),
],auth.postLogin);

router.post('/reset',auth.postResetMailPage);
router.post('/reset/password',auth.postPassword);
router.get('/reset/password/:id',auth.getResetPage);
module.exports=router;