// Import Moduls
const express = require('express')
const cors = require('cors')

// Initialize Express 
const app = express() // Untuk membuat server API
app.use(express.json()) // Body Parser : Untuk menerima data dari frontend

// Initialize PORT
const PORT = 5000

// Initialize Cors
app.use(cors()) // Kita memberikan izin ke semua client 


const db = require('./Connection/Connection')

// Import Routers
const PostRouters = require('./Routers/PostRouters')
app.use('/post', PostRouters)

app.use('/Public/', express.static(__dirname + '/Public')) // Memberikan akses ke client untuk mengambil assets image kita

const UserRouters = require('./Routers/UserRouter')
app.use('/user', UserRouters)

app.listen(PORT, () => console.log('API Running on PORT ' + PORT) )