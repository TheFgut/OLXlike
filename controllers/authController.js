const User = require('../models/User')
const Role = require('../models/Role')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const { validationResult } = require("express-validator")
const {secret} = require("../config");
const Todo = require('../models/Product');
const querystring = require('querystring');  
const { url } = require('inspector');

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: "12h"})
}


class authController {
    async registration(req, res){
        try {

            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Register error', errors })
            }
            const { username, password } = req.body
            const candidate = await User.findOne({ username })
            if (candidate) {
                return res.status(400).json({ message: 'User is exist' })
            }
            var hashedPassword = bcrypt.hashSync(password, 7);
            const userRole = await Role.findOne({ value: "User" })
            const user = new User({username: username, password: hashedPassword,roles: [userRole.value] })
            await user.save()



            res.redirect('/login/')
        }
        catch (e) {
            const { username } = req.body
            console.log(e)
            return res.status(400).json({
                message: `Registration error, Login: ${username}`, e
            })
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body

            const user = await User.findOne({ username })
            if (!user) {
                return res.status(400).json({ message: `User ${username} is not exist` })
            }
            const validPassword = bcrypt.compareSync(password, user.password)
            if (!validPassword) {
                return res.status(400).json({ message: 'Password is incorrect' })
            }

            const token = generateAccessToken(user._id, user.roles)

            const todos = await Todo.find({}).lean()

            const query = querystring.stringify({
                token: token,
                hasToken: true
            });
            res.redirect('/?' + query);
  
        }
        catch (e) {
            console.log(e)
            
            return res.status(400).json({
                message: `login error, Login: ${username}`
            })
        }
    }

    async checkUserToken(req, res, token) {
        if (!token) {
            return res.status(401).json({ message: 'no token' });
        }
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Incorrect token' });
            }

            // Теперь в decoded содержится информация о пользователе
            req.user = decoded;
        });
    }
}

module.exports = new authController()