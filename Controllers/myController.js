const rootDir = require("../Utils/path");
const path = require("path");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const fs = require("fs");
const product = require("../Models/Product");
const order = require("../Models/Order");
const pdfDocument = require("pdfkit");
const filehelper = require("../Utils/file");
const ITEMS_PER_PAGE = 3;

exports.add_product_form = (req, res, next) => {
    let data = [],
        obj = false;
    return res.render("admin/add-products", {
        title: "Add product",
        link: "/add_product",
        edit: false,
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: req.flash("error"),
        msgType: req.flash("type"),
        data,
        obj,
    });
};

exports.add_product = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        let obj = req.body;
        const { errors } = result;
        let data = errors.map((e) => {
            return e.param;
        });
        console.log(obj);
        req.flash("error", errors[0].msg);
        req.flash("type", "warn");
        // return res.redirect(`/admin/add-product`);
        return res.render("admin/add-products", {
            title: "Add product",
            link: "/add_product",
            edit: false,
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: req.flash("error"),
            msgType: req.flash("type"),
            data,
            obj,
        });
    }
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
   
    if (image && image.size<=500000) {
        const imageUrl = image.path;
        let obj = new product({
            title,
            price,
            description,
            imageUrl,
            userId: req.user._id,
        });
        obj
            .save()
            .then(() => {
                return res.redirect("/products");
            })
            .catch((err) => {
                return next(err);
            });
    } else {
       if(image)
       {
        filehelper.deleteFile(req.body.filePath);
       }
        let data = [];
        return res
            .status(422)
            .render("admin/add-products", {
                title: "Add product",
                link: "/add_product",
                edit: false,
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: "Invalid image",
                msgType: "warn",
                data,
                obj: req.body,
            });
    }
};

//Home page explore
exports.home_page = (req, res, next) => {
    let page = +req.query.page || 1;
    let totalItems;
    product
        .countDocuments()
        .then((countDoc) => {
            totalItems = countDoc;
            return product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then((data) => {
            res.render("shop/index", {
                product: data,
                title: "Home",
                link: "/home",
                isAuthenticated: req.session.isLoggedIn,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            });
        });
};

//Browse product page shop
exports.products_page = (req, res, next) => {
    let page = +req.query.page || 1;
    let totalItems;
    product.countDocuments().then((no) => {
        totalItems = no;
        return product
            .find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
    }).then((products) => {
        return res.render("shop/products", {
            product: products,
            title: "Browse products",
            link: "/product",
            isAuthenticated: req.session.isLoggedIn,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
        .catch((err) => {
            console.log(err);
        });
};

//Admin product page
exports.admin_products = (req, res, next) => {
    let page = +req.query.page || 1;
    let totalItems;
    product.countDocuments().then((no) => {
        totalItems = no;
        return product
            .find()
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
    }).then((products) => {
        return res.render("admin/products", {
            product: products,
            title: "Admin access",
            link: "/a_product",
            isAuthenticated: req.session.isLoggedIn,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
        });
    })
        .catch((err) => {
            console.log(err);
        });
};

//Delete a product
exports.delete_product = (req, res, next) => {
    const prodId = req.params.id;
    product
        .findById(prodId)
        .then((product_doc) => {
            filehelper.deleteFile(product_doc.imageUrl);
            product.findByIdAndRemove(prodId).then((result) => {
                res.json({success:true});
            });
        })
        .catch((err) => next(err));
};

//render a page with a product detail to edit.
exports.edit_product = (req, res, next) => {
    const prodId = req.body.id;
    let data = [],
        obj = false;
    product
        .findById(prodId)
        .then((products) => {
            if (!products) {
                return res.redirect("/");
            }
            return res.render("admin/add-products", {
                csrfToken: res.locals.csrfToken,
                title: "Edit product",
                link: "/edit_product",
                edit: true,
                product: products,
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: req.flash("error"),
                msgType: req.flash("type"),
                data,
                obj,
            });
        })
        .catch((err) => { });
};

//Edit product details
exports.edit_product_data = (req, res, next) => {
    const prodId = req.body.id;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDesc = req.body.description;
    const image = req.file;
    product
        .findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.session.user._id.toString()) {
                return res.redirect("/");
            } else {
                product.title = updatedTitle;
                product.price = updatedPrice;
                product.description = updatedDesc;
                if (image) {
                    filehelper.deleteFile(product.imageUrl);
                    product.imageUrl = image.path;
                }
                return product.save();
            }
        })
        .then(() => {
            return res.redirect("/products");
        })
        .catch((err) => {
            console.log(err);
        });
};

//get details of a product
exports.get_product_details = (req, res, next) => {
    let id = req.params.id;
    product
        .findById(id)
        .then((data) => {
            return res.render("shop/product-details", {
                csrfToken: res.locals.csrfToken,
                title: data.title,
                data: data,
                edit: false,
                link: "/dfd",
                isAuthenticated: req.session.isLoggedIn,
            });
        })
        .catch((e) => { });
};

// get invoice of a user
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.id;
    order
        .findById(orderId)
        .then((orderDoc) => {
            if (!orderDoc) {
                return next(new Error("No order Found"));
            }
            if (orderDoc.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorized"));
            }
            const fileName = "invoice-" + orderId + ".pdf";
            const invoicePath = path.join("Data", "invoices", fileName);
            const pdfDoc = new pdfDocument();
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                'inline; filename="' + fileName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text("Invoice", {
                underline: true,
            });
            pdfDoc.text("------------------------");
            let totalPrice = 0;
            orderDoc.products.forEach((prod) => {
                totalPrice += prod.quantity * prod.product.price;
                pdfDoc
                    .fontSize(14)
                    .text(
                        prod.product.title +
                        " - " +
                        prod.quantity +
                        " x " +
                        " x " +
                        " $ " +
                        prod.product.price
                    );
            });
            pdfDoc.text("--------------------");
            pdfDoc.fontSize(20).text("Total Price: $" + totalPrice);
            pdfDoc.end();

            // console.log(invoicePath);
            // fs.readFile(invoicePath,(err,data)=>{
            //     if(err)
            //     {
            //         return next(err);
            //     }
            //     res.send(data);
            // })

            // const file=fs.createReadStream(invoicePath); //read data by stream to avoid memory overflow.
            // file.pipe(res);
        })
        .catch((err) => next(err));
};
