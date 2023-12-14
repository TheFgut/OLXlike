const { Router } = require('express')
const multer = require('multer');
const Product = require('../models/Product')
const router = Router()
const auth = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken')
const { secret } = require('../config');

router.get('/', async (req, res) => {
    const products = await Product.find({}).lean()

    var token = getParameterByName('token', req.url);
    var hasToken = getParameterByName('hasToken', req.url);
    res.render('index', {
        title: 'Products list',
        isIndex: true,
        token: token,
        hasToken: hasToken === "true",
        products
    })

})

router.post('/productSearch', async (req, res) => {

    var regex = new RegExp(req.body.searchPattern, "i");
    const products = await Product.find({ "title": { $regex: regex } }).lean()
    var token = getParameterByName('token', req.url);
    var hasToken = getParameterByName('hasToken', req.url);
    res.render('index', {
        title: 'Products list',
        isSearching: true,
        search: req.body.searchPattern,
        token: token,
        hasToken: hasToken === "true",
        products
    })

})

router.get('/create', (req, res) => {
    var token = getParameterByName('token', req.url);
    var hasToken = getParameterByName('hasToken', req.url);
    res.render('create', {
        title: 'Create product',
        isCreate: true,
        token: token,
        hasToken: hasToken === "true"
    })
})

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });


router.post('/create', upload.single('imageInput'), async (req, res) => {
    var token = req.body.token;
    var hasToken = req.body.hasToken;

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            res.status(401).json({ error: 'JWT verification failed ' + token + " " + err.message });
        } else {
            // Find the user using the decoded ID
            User.findById(decoded.id, (err, user) => {
                if (err) {
                    console.error('Error:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (user) {
                    // Create a new product using user information
                    const price = parseFloat(req.body.price);
                    const prod = new Product({
                        title: req.body.title,
                        image: {
                            data: req.file.buffer,
                            contentType: req.file.mimetype
                        },
                        shortDescription: req.body.shortDesc,
                        description: req.body.longDesc,
                        price: price,
                        sellerDetails: {
                            name: user.username,
                            contactDetails: req.body.contact
                        }
                    });

                    // Save the product to the database
                    prod.save((err, savedProduct) => {
                        if (err) {
                            console.error('Error saving product:', err);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else {
                            // Send a response with success message or saved product details
                            var nextUrl = "/?token=" + token + "&hasToken=" + hasToken;
                            res.redirect(nextUrl);
                        }
                    });
                } else {
                    console.log('User not found');
                    res.status(404).json({ error: 'User not found' });
                }
            });
        }
    });
});


router.get('/edit', async (req, res) => {

    const id = getParameterByName('id', req.url);
    const prod = await Product.findById(id)

    const referer = req.get('referer'); // Get the referer URL from the request headers
    var token = getParameterByName('token', referer);
    var hasToken = getParameterByName('hasToken', referer);

    const product = {
        title: prod.title, shortDescription: prod.shortDescription, description: prod.description, _id: prod._id, sellerName: prod.sellerDetails.name,
        sellerContact: prod.sellerDetails.contactDetails, price: prod.price
    };

    res.render('create', {
        title: 'Create product',
        isEdit: true,
        prodductID: req.body.id,
        lockNavbar: true,
        token: token,
        hasToken: hasToken,
        product
    })
})

router.post('/edit', upload.single('imageInput'), async (req, res) => {
    const id = req.body.id;
    Product.findById(id, (err, prod) => {
        if (err) {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else if (prod) {
            prod.title = req.body.title;
            if (req.file !== undefined) {
                prod.image.data = req.file.buffer;
                prod.image.contentType = req.file.mimetype;
            }
            prod.shortDescription = req.body.shortDesc;
            prod.description = req.body.longDesc;
            prod.price = parseFloat(req.body.price);
            prod.sellerDetails.contactDetails = req.body.contact;

            // Save the product to the database
            prod.save((err, savedProduct) => {
                if (err) {
                    console.error('Error saving product:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    // Send a response with success message or saved product details
                    var nextUrl = "/myProducts?token=" + req.body.token + "&hasToken=" + req.body.hasToken;
                    res.redirect(nextUrl);
                }
            });
        }
        else {
            console.log('product not found');
            res.status(404).json({ error: "product not found" + id });
        }
    });

});




router.get('/myProducts', upload.single('imageInput'), async (req, res) => {
    var token = getParameterByName('token', req.url);
    var hasToken = getParameterByName('hasToken', req.url);

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            console.error('JWT verification failed:', err.message);
            res.status(401).json({ error: 'JWT verification failed' });
        } else {
            // Find the user using the decoded ID
            User.findById(decoded.id, (err, user) => {
                if (err) {
                    console.error('Error:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else if (user) {

                    Product.find({ 'sellerDetails.name': user.username }).lean().exec((err, products) => {
                        if (err) {
                            console.error('Error:', err);
                            res.status(500).json({ error: 'Internal Server Error' });
                        } else if (products) {
                            res.render('myProducts', {
                                title: 'MyProducts',
                                token: token,
                                hasToken: hasToken === "true",
                                products
                            });
                        } else {
                            console.log('User not found');
                            res.status(404).json({ error: 'User not found' });
                        }
                    });

                } else {
                    console.log('User not found');
                    res.status(404).json({ error: 'User not found' });
                }
            });
        }
    });
});



router.get('/productDetails', async (req, res) => {
    const id = getParameterByName('id', req.url);
    const prod = await Product.findById(id)

    var token = getParameterByName('token', req.url);
    var hasToken = getParameterByName('hasToken', req.url);


    const product = {
        title: prod.title, shortDescription: prod.shortDescription, description: prod.description, _id: prod._id, sellerName: prod.sellerDetails.name,
        sellerContact: prod.sellerDetails.contactDetails, price: prod.price
    };

    res.render('productDetails', {
        title: 'Loock on product',
        token: token,
        hasToken: hasToken === "true",
        lockNavbar: true,
        product
    })
})


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


router.get('/image/:id', async (req, res) => {
    try {
        const prod = await Product.findById(req.params.id);

        if (!prod) {
            return res.status(404).send('Image not found');
        }

        if (!prod.image) {
            return res.status(404).send('Image not found');
        }
        // Convert Buffer to base64 data URL
        const base64Image = `data:.jpeg;base64,${prod.image.data}`;

        res.contentType("image/jpeg");
        res.send(prod.image.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});




module.exports = router
