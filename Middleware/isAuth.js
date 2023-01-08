exports.isAuth=(req,res,next)=>{
    if(!req.session.user)
    {
        return res.send("Restricted Access!");
    }
    next();
}