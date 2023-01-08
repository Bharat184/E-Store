const product = require("../Models/Product");
const user=require("../Models/User");
const order=require("../Models/Order");

//cart details
exports.manage_cart=(req, res, next)=>{
    req.user
    .populate('cart.items.productId')
    .then((user)=>{
        const product=user.cart.items;
        return res.render('shop/cart', {csrfToken:res.locals.csrfToken, edit: false, link: "/cart", title: "My cart", data: product,isAuthenticated:req.session.isLoggedIn });
    });
}

//add to cart
exports.add_to_cart=(req, res, next)=>{
    let id = req.body.id;
    product.findById(id).then(i=>{
        return req.user.addToCart(i)
    })
    .then(()=>{
        return res.redirect("/cart");
    })    
}

exports.delete_item=(req, res, next)=>{
    let id = req.body.id;
    req.user.removeFromCart(id).then(()=>{
        return res.redirect('/cart');
    }).catch(err=>{
        console.log(err);
    })
}

exports.get_orders=(req, res, next)=>{
   
    order.find({'user.userId':req.user._id})
    .then((orders)=>{
        return res.render('shop/orders', { csrfToken:res.locals.csrfToken,link: "/orders", title: "My orders", orders: orders,isAuthenticated:req.session.isLoggedIn });
       
    })
}

exports.checkout=(req, res, next) =>
{
    req.user.populate("cart.items.productId")
    .then((i)=>{
       const products=i.cart.items.map((e)=>{
        return {quantity:e.quantity, product:{...e.productId._doc}};
       });
       let o=new order({
        user:{
            name:req.user.name,
            userId:req.user
        },
        products:products
       })
       return o.save();
    })
    .then(()=>{
        return req.user.clearCart();
    }).then(()=>{
        res.redirect('/orders');
    });
}
