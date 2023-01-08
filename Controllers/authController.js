const user=require('../Models/User');
const bcrypt=require("bcryptjs");
const nodemailer=require("nodemailer");
const crypto=require("crypto");
const {validationResult}=require("express-validator");

exports.loginPage=(req,res,next)=>{  
    let data=false;
    if(Object.keys(req.query).length>0)
    {
        data=req.query;
    }
    return res.render("auth/login",{link:"/login",title:"Login",isAuthenticated:req.session.isLoggedIn,csrfToken:res.locals.csrfToken,errorMessage:req.flash('error'),msgType:req.flash("type"),data});
}

exports.postLogin=(req,res,next)=>{
    const result=validationResult(req);
    if(!result.isEmpty())
    {
        const {errors}=result;
        req.flash('error',errors[0].msg);
        req.flash("type","warn");
        return res.redirect(`/login`);
    }
    const email=req.body.email;
    const password=req.body.password;
    user.findOne({email}).then((userDoc)=>{
        if(userDoc)
        {
            bcrypt.compare(password,userDoc.password).then((result)=>{
                if(result)
                {
                    req.session.isLoggedIn = true;
                    req.session.user=userDoc;
                    req.session.save((err)=>{
                        return res.redirect('/');
                    });
                }
                else
                {
                    req.flash('error','Invalid email or password.');
                    req.flash("type","warn");
                    return res.redirect(`/login`);
                }
            }).catch((err)=>{});
        }
        else
        {
            req.flash('error','Invalid email or password.');
            req.flash("type","warn");
            return res.redirect("/login");
        }
    })
}
exports.logOut=(req,res,next)=>{
    req.session.destroy(err=>{
       return  res.redirect("/");
    })
}
exports.signUp=(req,res,next)=>{
    let obj=false;
    return res.render("auth/signup",{link:"/signup",title:"Signup",isAuthenticated:req.session.isLoggedIn,csrfToken:res.locals.csrfToken,errorMessage:req.flash('error'),msgType:req.flash("type"),data:[],obj});
}
exports.postSignup=(req,res,next)=>{
    const result=validationResult(req);
    if(!result.isEmpty())
    {
        let {errors}=result;
        console.log(errors)
        req.flash('error',errors[0].msg);
        req.flash("type","warn");
        let data=[],obj=req.body;
        console.log(obj);
        errors.forEach((e)=>{
            data.push(e.param);
        });
        return res.render("auth/signup",{link:"/signup",title:"Signup",isAuthenticated:req.session.isLoggedIn,csrfToken:res.locals.csrfToken,errorMessage:req.flash('error'),msgType:req.flash("type"),data,obj});
        
    }
    const name=req.body.name;
    const email=req.body.email;
    const password=req.body.password;
       
    bcrypt.hash(password,12).then((hashPassword)=>{
        let obj=new user({name,email,password:hashPassword,resetToken:null,resetTokenExpiration:null});
        return obj.save();
    }).then(()=>{
        req.flash("error","Success! Login to continue.");
        req.flash("type","success");
        return res.redirect('/login');
    });
   
}

exports.getResetMailPage=(req,res,next)=>{
    return res.render("auth/reset-password",{link:"/reset",title:"Reset password",isAuthenticated:req.session.isLoggedIn,csrfToken:res.locals.csrfToken});
}
exports.postResetMailPage=(req,res,next)=>{
      crypto.randomBytes(32,(err,buffer)=>{
        if(err)
        {
            return res.redirect("/reset");
        }
        const token = buffer.toString('hex');
        user.findOne({email:req.body.email})
        .then((user)=>{
            if(!user)
            {
                req.flash('error',"No! such email exists.");
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then((result)=>{
            req.flash("type","success");
            req.flash("error","Check your email to reset your password");
            res.redirect("/login");

            //Send mail code.
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'arvinchetry99@gmail.com',
                  pass: 'mnmdueychscqxzzp'
                }
              });
              
              var mailOptions = {
                from: 'arvinchetry99@gmail.com',
                to: req.body.email,
                subject:"Reset Password",
                html: `<h3>Click to Reset password <a href="http://localhost:3000/reset/password/${token}">link</a></h3>`
              };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });

        })

      });
    // return res.send("Resetting password");
}

exports.getResetPage=(req,res,next)=>{
    const token=req.params.id;
    user.findOne({resetToken:token,resetTokenExpiration:{$gt: Date.now()}})
    .then((user)=>{
        if(!user)
        {
            req.flash("type","warn");
            req.flash("error","Invalid Token!");
            return res.redirect("/login");
        }
        else
        {
            return res.render("auth/new-password",{link:"/reset",title:"Reset password",isAuthenticated:req.session.isLoggedIn,csrfToken:res.locals.csrfToken,token,userId:user._id.toString()});
            
        }
    })
}
exports.postPassword=(req,res,next)=>{
    const {id,token,password}=req.body;
    var resetUser;
    user.findOne({
        _id:id,
        resetToken:token,
        resetTokenExpiration:{$gt:Date.now()}
    }).then((user)=>{
        if(!user)
        {
            req.flash("type","warn");
            req.flash("error","Invalid Token!");
            return redirect('/login');
        }
        resetUser=user;
        return bcrypt.hash(password,12);
    })
    .then((hashPassword)=>{
        resetUser.password=hashPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    }).then(()=>{
        req.flash("type","success");
        req.flash("error","Password changed successfully.!");
        return res.redirect("/login");
    });
}
