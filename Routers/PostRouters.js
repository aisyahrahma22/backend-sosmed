const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller Todos
const PostController = require('./../Controllers/PostControllers')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.get('/get/:id', jwtVerify, PostController.getData);
Router.post('/addpost', jwtVerify, PostController.addPost)
Router.delete('/deletepost/:id', jwtVerify, PostController.deletePost)
Router.put('/editpost/:id', jwtVerify, PostController.editPost)
Router.get('/getall', jwtVerify, PostController.getAllPost)
Router.get('/getallbyuserid', jwtVerify, PostController.getAllPostByUserId)
Router.post('/likepost/:id', jwtVerify, PostController.likepost);
Router.post('/addcomment/:id', jwtVerify, PostController.addComment)
Router.put('/editcomment/:id', jwtVerify, PostController.editComment)
Router.delete('/deletecomment/:id', jwtVerify, PostController.deleteComment)
Router.get('/getpostbyid/:id', jwtVerify, PostController.getAllPostById)

module.exports = Router