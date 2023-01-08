const express=require("express");
const router=express.Router();

const controller=require("../Controllers/myController");
const middleware=require("../Middleware/isAuth");
const {body}=require("express-validator");

router.get("/add-product",middleware.isAuth,controller.add_product_form);
router.get('/products',middleware.isAuth,controller.admin_products);
router.post('/add-product',[
    body('title','title can"t be empty!').isLength({min:1}),
    body('price','Invalid price!').isNumeric(),
    body('description','description must be of minimum 10 characters').isLength({min:10}).isString()
],middleware.isAuth,controller.add_product);
router.delete('/delete/:id',middleware.isAuth,controller.delete_product);
router.post('/edit',middleware.isAuth,controller.edit_product);
router.post('/edit_product',middleware.isAuth,controller.edit_product_data);




module.exports=router;