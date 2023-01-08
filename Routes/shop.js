const express=require("express");
const router=express.Router();

const controller=require("../Controllers/myController");
const cart_controller=require("../Controllers/cartController");
const middleware=require("../Middleware/isAuth");


router.get('/',controller.home_page);
router.get('/products',controller.products_page);
router.get('/cart',middleware.isAuth,cart_controller.manage_cart);
router.post('/cart/delete',middleware.isAuth,cart_controller.delete_item);
router.post('/add_to_cart',middleware.isAuth,cart_controller.add_to_cart);
router.get('/orders',middleware.isAuth,cart_controller.get_orders);
router.post('/checkout',middleware.isAuth,cart_controller.checkout);
router.get('/details/:id',controller.get_product_details);
router.get('/invoice/:id',middleware.isAuth,controller.getInvoice);
module.exports=router;