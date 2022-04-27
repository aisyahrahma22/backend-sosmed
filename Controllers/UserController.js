// Import Connection
const db = require('./../Connection/Connection');
const util = require('util')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')

// Import Validator
const validator = require('validator')

// Import Crypto 
const crypto = require('crypto')

// Import Transporter Nodemailer
const transporter = require('./../Helpers/Transporter')

const fs = require('fs')
const handlebars = require('handlebars')

// Import JWT Token
const jwt = require('jsonwebtoken')

module.exports = {
    register: async(req, res) => {
        try {
            // Step1. Get All Data
            let data = req.body

            // Step2. Validasi
            if(!data.username || !data.email || !data.password) throw { message: 'Data Not Completed!' }
            if(!validator.isEmail(data.email)) throw { message: 'Email Invalid' }
            if(data.password.length > 50) throw { message: 'Password Maximum 50 Character' }

            // Step3. Hashing Password
            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(data.password)
            const passwordHashed = await hmac.digest('hex')
            data.password = passwordHashed
            data.profileimage = '/default/default.jpg'

            // Step4.1. Validasi, apakah usernamenya sudah ter-register?
            let query01 = 'SELECT * FROM users WHERE username = ?'
            const findUsername = await query(query01, data.username)
            .catch((error) => {
                throw error
            })

            if(findUsername.length > 0){
                throw { message: 'Username Already Register!' }
            }

            // Step4.1. Validasi, apakah emailnya sudah ter-register?
            let query1 = 'SELECT * FROM users WHERE email = ?'
            const findEmail = await query(query1, data.email)
            .catch((error) => {
                throw error
            })

            if(findEmail.length > 0){
                throw { message: 'Email Already Register!' }
            }

            // Step4.2.
            let code_activation = Math.round(Math.random() * 100000)
            data.code_activation = code_activation

            // Step4.3. Store ke Db
            let query2 = 'INSERT INTO users SET ?'
            const insertUser = await query(query2, data)
            .catch((error) => {
                throw error
            })

            jwt.sign({id: insertUser.insertId}, '123abc', (err, token) => {
                try {
                    if(err) throw err

                    // Step5.0. Save Token to Db
                    let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                    db.query(query3, [token, insertUser.insertId], (err1, result1) => {
                        try {
                            if(err1) throw err1

                            // Step5.1. Send Email Confirmation
                            fs.readFile('C:/My Apps/api-sosmed/Public/Template/index.html', {
                                encoding: 'utf-8'}, (err, file) => {
                                    if(err) throw err 

                                    const newTemplate = handlebars.compile(file)
                                    const newTemplateResult = newTemplate({bebas: data.email, link:`http://localhost:3000/confirmation/${token}`, code_activation: code_activation, link_activation_code: `http://localhost:3000/confirmationcode/${insertUser.insertId}`})

                                    transporter.sendMail({
                                        from: 'aisyah', // Sender Address 
                                        to: 'ichajust2@gmail.com', // Email User
                                        subject: 'Email Confirmation',
                                        html: newTemplateResult
                                    })
                                    .then((response) => {
                                        res.status(200).send({
                                            error: false, 
                                            message: 'Register Success! Check Email to Verified Account!'
                                        })
                                    })
                                    .catch((error) => {
                                        res.status(500).send({
                                            error: false, 
                                            message: error.message
                                        })
                                    })
                            })
                        } catch (error) {
                            res.status(500).send({
                                error: true, 
                                message: error.message
                            })
                        }
                    })
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },

    confirmation: (req, res) => {
        // Step1. Get id
        const id = req.dataToken.id 
        const code_activation = req.body.code_activation

        // Step2.0. Check, apakah user melakukan aktivasi via link atau menggunakan activation code
        if(code_activation !== undefined){ // Apablia aktivasi menggunakan code
            db.query('SELECT * FROM users WHERE id = ? AND code_activation = ? AND is_confirmed = 0', [id, code_activation], (err, result) => {
                try {
                    if(err) throw err 

                    if(result.length === 0){
                        res.status(400).send({
                            error: true, 
                            message: 'Id Not Found / Email Already Active / Code Activation Wrong'
                        })
                    }else{
                        // Step3. Apabila is_confirmed = 0, update menjadi = 1
                        db.query('UPDATE users SET is_confirmed = 1 WHERE id = ?', id, (err1, result1) => {
                            try {
                                if(err) throw err 

                                res.status(200).send({
                                    error: false, 
                                    message: 'Your Account Active!'
                                })
                            } catch (error) {
                                res.status(500).send({
                                    error: true, 
                                    message: error.message
                                })
                            }
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        }else{ // Apabila aktivasi menggunakan link
            // Step2. Check, apakah id nya exist & is_confirmed masih = 0
            db.query('SELECT * FROM users WHERE id = ? AND is_confirmed = 0', id, (err, result) => {
                try {
                    if(err) throw err 

                    if(result.length === 0){
                        res.status(400).send({
                            error: true, 
                            message: 'Id Not Found / Email Already Active'
                        })
                    }else{
                        // Step3. Apabila is_confirmed = 0, update menjadi = 1
                        db.query('UPDATE users SET is_confirmed = 1 WHERE id = ?', id, (err1, result1) => {
                            try {
                                if(err) throw err 

                                res.status(200).send({
                                    error: false, 
                                    message: 'Your Account Active!'
                                })
                            } catch (error) {
                                res.status(500).send({
                                    error: true, 
                                    message: error.message
                                })
                            }
                        })
                    }
                } catch (error) {
                    res.status(500).send({
                        error: true, 
                        message: error.message
                    })
                }
            })
        }
    },

    // login: async(req, res) => {
    //     try {
    //         // Step1. Get All Data
    //         let data = req.body

    //         console.log('req data login', data)
    //         // Step3. Hashing Password
    //         const hmac = crypto.createHmac('sha256', 'abc123')
    //         await hmac.update(data.password)
    //         const passwordHashed = await hmac.digest('hex')
    //         data.password = passwordHashed

    //          // Step4.1. Validasi, apakah passwordnya benar atau tidak
    //          let query02 = 'SELECT * FROM users WHERE password = ?'
    //          console.log('ini query 02',query02)
    //          const findPassword = await query(query02, data.password)
    //          console.log('ini find Password',findPassword)
    //         //  .catch((error) => {
    //         //      throw error
    //         //  })

    //          if(findPassword.length === 0){
    //             throw { message: 'Wrong Password!' }
    //         }

    //         // Step4.3. Store ke Db
    //         let query2 = `SELECT * FROM users WHERE email = ${findPassword[0].email} OR username = ${findPassword[0].username} AND password = ${data.password}`
    //         console.log('ini query select all', query2)
    //         const insertUser = await query(query2, data)
    //         console.log('ini insert user', insertUser)
    //         .catch((error) => {
    //             throw error
    //         })

    //         jwt.sign({id: insertUser.insertId}, '123abc', (err, token) => {
    //             try {
    //                 if(err) throw err

    //                 // Step5.0. Save Token to Db
    //                 let query3 = 'UPDATE users SET token = ? WHERE id = ?'
    //                 db.query(query3, [token, insertUser.insertId], (err1, result1) => {
    //                     try {
    //                         if(err1) throw err1

    //                         res.status(200).send({
    //                             error: false, 
    //                             message: 'Login Success',
    //                             token: token
    //                         })
                          
    //                     } catch (error) {
    //                         res.status(500).send({
    //                             error: true, 
    //                             message: error.message
    //                         })
    //                     }
    //                 })
    //             } catch (error) {
    //                 res.status(500).send({
    //                     error: true, 
    //                     message: error.message
    //                 })
    //             }
    //         })
    //     } catch (error) {
    //         res.status(500).send({
    //             error: true, 
    //             message: error.message
    //         })
    //     }
    // },

    // loginUser : (user,password,res)
  login: (req, res) => {
    let {  account, password } = req.body;
    console.log(  {  account, password } )

    // Hash the password
    password = crypto.createHmac('sha256', 'abc123')
    .update(password)
    .digest("hex");

    //GET Query
    let getUserQuery = `select * from users where (email = ${db.escape(
       account
    )} or username = ${db.escape( account)}) and password = ${db.escape(
      password
    )}`;

    // Getting data on database
    db.query(getUserQuery, (err, result) => {
      if (err) {
        res.status(404).send({
          message: err,
        });
      }
    
      if (result.length === 1) {
       jwt.sign({id: result[0].id}, '123abc', (err, token) => {
           try {
            if(err) throw err
            db.query('UPDATE users SET token = ?', token, (err1, result1) => {
               try {
                if(err1) throw err1 

                res.status(200).send({
                    error: false, 
                    message: 'Login Success',
                    token: token
                })
               } catch (error) {
                console.log(error)
               }
            })
               
           } catch (error) {
            console.log(error)
           }
       })
       
      } else {
        res.status(200).send({
            error: true, 
            message:  "Incorrect email/username or password",
           
        })
      }
    });
  },

    // login: (req, res) => {
     
    //     try {

    //         const data = req.body 

    //         if(!data.email || !data.password) throw { message: 'Data Not Complete!' }

    //         const hmac = crypto.createHmac('sha256', 'abc123')
    //         hmac.update(data.password)
    //         const passwordHashed = hmac.digest('hex')
    //         data.password = passwordHashed

    //         db.query('SELECT * FROM users WHERE email = ? AND password = ?', [data.email, data.password], (err, result) => {
    //             try {
    //                 if(err) throw error 

    //                 if(result.length === 1){
    //                     jwt.sign({id: result[0].id}, '123abc', (err, token) => {
    //                         try {
    //                             if(err) throw err

    //                             db.query('UPDATE users SET token = ?', token, (err1, result1) => {
    //                                 try {
    //                                     if(err1) throw err1 

    //                                     res.status(200).send({
    //                                         error: false, 
    //                                         message: 'Login Success',
    //                                         token: token
    //                                     })
    //                                 } catch (error) {
    //                                     console.log(error)
    //                                 }
    //                             })
    //                         } catch (error) {
    //                             res.status(500).send({
    //                                 error: true, 
    //                                 message: error.message
    //                             })
    //                         }
    //                     })
    //                 }else{
    //                     res.status(200).send({
    //                         error: true, 
    //                         message: 'Incorrect Password!'
    //                     })
    //                 }
    //             } catch (error) {
    //                 res.status(500).send({
    //                     error: true, 
    //                     message: error.message
    //                 })
    //             }
    //         })
    //     } catch (error) {
    //         res.status(500).send({
    //             error: true, 
    //             message: error.message
    //         })
    //     }
    // },

    checkUserVerify: (req, res) => {
        let id = req.dataToken.id
        
        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err 
                
                res.status(200).send({
                    error: false, 
                    is_confirmed: result[0].is_confirmed
                })
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })
    },

    resend: (req, res) => {

        let id = req.dataToken.id 

        // Step0. Make sure bahwa id user itu ada
        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err

                if(result.length === 1){
                    // Step1. Get Email dari user id tersebut 
                    let email = result[0].email
                    let code_activation = result[0].code_activation

                    // Step2. Resend Email Confirmationnya
                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err
        
                            // Step5.0. Save Token to Db
                            let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
        
                                    // Step5.1. Send Email Confirmation
                                    fs.readFile('C:/My Apps/api-sosmed/Public/Template/index.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`http://localhost:3000/confirmation/${token}`, code_activation: code_activation, link_activation_code: `http://localhost:3000/confirmationcode/${token}`})
        
                                            transporter.sendMail({
                                                from: 'aisyah', // Sender Address 
                                                to: 'ichajust2@gmail.com', // Email User
                                                subject: 'Email Confirmation',
                                                html: newTemplateResult
                                            })
                                            .then((response) => {
                                                res.status(200).send({
                                                    error: false, 
                                                    message: 'Register Success! Check Email to Verified Account!'
                                                })
                                            })
                                            .catch((error) => {
                                                res.status(500).send({
                                                    error: false, 
                                                    message: error.message
                                                })
                                            })
                                    })
                                } catch (error) {
                                    res.status(500).send({
                                        error: true, 
                                        message: error.message
                                    })
                                }
                            })
                        } catch (error) {
                            res.status(500).send({
                                error: true, 
                                message: error.message
                            })
                        }
                    })
                }else{
                    // Kirim message error, bahwa id tidak ditemukan
                }
            } catch (error) {
                console.log(error)                
            }
        })
    },
    editProfileData: (req,res) => {
        var id = req.dataToken.id
        var sql = `SELECT * from users where id = ${id};`;
        db.query(sql, (err, results) => {
            if(err) throw err;
    
            if(results.length > 0) {
                const path = 'Public/users'; //file save path
                const upload = uploader(path, 'USER').fields([{ name: 'image'}]); //uploader(path, 'default prefix')
    
                upload(req, res, (err) => {
                    if(err){
                        return res.status(500).json({ message: 'Upload profile picture failed !', error: err.message });
                    }
    
                    const { image } = req.files;
                    console.log('ini image',image)
                    const imagePath = image ? path + '/' + image[0].filename : null;
                    console.log('ini imagePath',imagePath)
                    const data = JSON.parse(req.body.data);
                    console.log('ini data',data)
    
                    try {
                        if(imagePath) {
                            data.profileimage = imagePath;
                            
                        }
                        sql = `Update users set ? where id = ${id};`
                        db.query(sql, data, (err1,results1) => {
                            if(err1) {
                                if(imagePath) {
                                    fs.unlinkSync('' + imagePath);
                                    console.log('ini fs.unlinkSync', fs.unlinkSync)
                                }
                                return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err1.message });
                           
                            }
                            if(imagePath) {
                                fs.unlinkSync('' + results[0].profileimage);
                            }

                            if(data.profileimage !== '/default/default.jpg') {
                                fs.unlinkSync('' + data.profileimage)
                            }

                            sql = `SELECT u.id,u.username, u.displayname, u.profileimage,u.bio
                            FROM users u
                            WHERE u.id = ${id}`;
                            db.query(sql, (err2,results2) => {
                                if(err2) {
                                    return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err1.message });
                                }

                                return res.status(200).send(results2);
                            })
                        })
                    }
                    catch(err){
                        console.log(err.message)
                        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err.message });
                    }
                })
            }
        })
    },
    // editProfileImage: (req,res) => {
    //     var data = req.body;
    //     console.log('ini data paling atas', data)
    //     const path = 'Public/users';
    //     const id = req.dataToken.id 
    //     const upload = uploader(path, 'USER').fields([{ name: 'image' }]);
    //     upload(req, res, (err) => {
    //         if(err){
    //             return res.status(500).send({ message: 'Upload file failed !', error: err.message });
    //         }

    //         const { image } = req.files;
    //         console.log(image)
    //         const data = { profileimage: `${path}/${image[0].filename}` }
    //         console.log('ini data', data)

    //         var sql = `UPDATE users SET ? WHERE id = ${id}`
           
    //         db.query(sql, data, (err, results) => {
    //             if(err) {
    //                 fs.unlinkSync('./Public' + path + '/' + image[0].filename)
    //                 return res.status(500).send(err)
    //             }

    //             console.log('ini err habis fs',err)
    //             console.log(results)

    //             sql = `SELECT u.id,u.username, u.displayname, u.profileimage,u.bio
    //                     FROM users u
    //                     WHERE u.id = ${id}`;
    //             console.log('ini sql bawah', sql)
    //             db.query(sql, (err, results) => {
    //                 if(err) {
    //                     return res.status(500).send(err)
                        
    //                 }
    //                 console.log('ini err bawah', err)
    //                 res.status(200).send({ ...results[0], token: req.token })
    //             })
    //         })
    //     })  
    // },
    getUsers: (req,res) => {
        const id = req.dataToken.id 
        var sql = `Select * from users where id = ${id};`;
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})

            return res.status(200).send(result)
        })
    },
}