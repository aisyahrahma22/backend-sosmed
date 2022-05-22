const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller 
const UserController = require('./../Controllers/UserController')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.post('/register', UserController.register)/
Router.patch('/confirmation', jwtVerify, UserController.confirmation) 
Router.post('/login', UserController.login)
Router.post('/checkuserverify', jwtVerify, UserController.checkUserVerify)
Router.post('/resend', jwtVerify, UserController.resend)
Router.patch('/editprofiledata',  jwtVerify, UserController.editProfileData)
Router.post('/resendpassword', UserController.resendPassword)
Router.patch("/resetpassword",  jwtVerify, UserController.resetPassword);
Router.get('/gettoken', jwtVerify, UserController.getValidToken)
Router.get('/allusers', jwtVerify, UserController.getUsers)
Router.get('/profileusers/:id', jwtVerify, UserController.getProfileUser) 
Router.get('/userverify', jwtVerify, UserController.getUserVerify) 

module.exports = Router