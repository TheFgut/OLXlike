const Router = require('express')
const router = new Router()
const controller = require('../controllers/authController')
const { check } = require("express-validator")
const Role = require('../models/Role')



router.get('/register', (req, res) => {

    res.render('authorization', {
        title: 'Please register',
        isSignin: false,
        username: req.query.username,
        password: req.query.password
    })
})

router.get('/login', async (req, res) => {
    res.render('authorization', {
        title: 'Please sign in',
        isSignin: true,
        hasToken: false
    })
})


router.post('/register', [
    check('username', "Username can't be empty").notEmpty(),
    check('password', "Password can't be less than 5 o rbigger than 15 chars").isLength({ min: 5, max: 15 })
], controller.registration)



router.post('/login', controller.login)

module.exports = router