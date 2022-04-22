const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller Todos
const PostController = require('./../Controllers/PostControllers')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.get('/getposts', jwtVerify, PostController.getPosts)
Router.post('/addpost', jwtVerify, PostController.addPost)
Router.delete('/deletepost/:id', jwtVerify, PostController.deletePost)
Router.put('/editpost/:id', jwtVerify, PostController.editPost)

module.exports = Router