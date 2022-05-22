const { Route } = require('express')
const express = require('express')
const Router = express.Router()

// Import Controller 
const PostController = require('./../Controllers/PostControllers')

// Import JWT Verify
const jwtVerify = require('./../Middleware/JWT')

Router.get('/get/:id', jwtVerify, PostController.getData); 
Router.get('/getprofilepost', jwtVerify, PostController.getProfilePost);
Router.post('/addpost', jwtVerify, PostController.addPost) 
Router.delete('/deletepost/:id', jwtVerify, PostController.deletePost)
Router.delete('/homeunlike/:id', jwtVerify, PostController.homeUnlike)
Router.post('/homelike/:id', jwtVerify, PostController.homeLike) 
Router.put('/editpost/:id', jwtVerify, PostController.editPost)
Router.get('/getallposts', jwtVerify, PostController.getAllPosts)

// Router.get('/getalldata', jwtVerify, PostController.getAllData)

Router.get('/getcomment/:id', jwtVerify, PostController.getComments)
Router.get('/getlikedpost', jwtVerify, PostController.getLikedPost)

Router.get('/getpostuserbyid/:id', jwtVerify, PostController.getPostUserbyId)

Router.post('/likepost/:id', jwtVerify, PostController.likepost); 
Router.post('/addcomment/:id', jwtVerify, PostController.addComment) 
// Router.put('/editcomment/:id', jwtVerify, PostController.editComment)
// Router.delete('/deletecomment/:id', jwtVerify, PostController.deleteComment)

module.exports = Router