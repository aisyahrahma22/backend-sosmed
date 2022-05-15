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
            data.profileimage = './Public/default/default.jpg'

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
                          // Step3. Check, apakah tokennya itu sama dengan yg disimpan didalam database
                          db.query('SELECT token FROM users WHERE token = ?', req.headers.authorization, (err, result) => {
                            try {
                                if(err) throw err 

                                if(result.length === 0){
                                    res.status(400).send({
                                        error: true, 
                                        message: 'Token Deactived'
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
                                console.log(error)
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
                db.query('UPDATE users SET token = ?  WHERE id = ?',  [token, result[0].id], (err1, result1) => {
                try {
                    if(err1) throw err1 
                    console.log(token)
                    console.log(result1)

                    res.status(200).send({
                        error: false, 
                        message: 'Login Success',
                        token: token,
                        id: result[0].id
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
        var sql = `SELECT * from users where id = ${id}`
        db.query(sql, (err, results) => {
            if(err) throw err;
    
            console.log(err)
            console.log(results)
            if(results.length > 0) {
                const path = 'Public/users'; //file save path
                const upload = uploader(path, 'USER').fields([{ name: 'image'}]); //uploader(path, 'default prefix')
    
                upload(req, res, (err) => {
                    if(err){
                        return res.status(500).json({ message: 'Upload post profile picture failed !', error: err.message });
                    }
                    const { image } = req.files;
                    console.log({ image })
                    const imagePath = image ? path + '/' + image[0].filename : null;
                    const data = JSON.parse(req.body.data);
                    console.log(data)
    
                    try {
                        if(imagePath) {
                            data.profileimage = imagePath;                        
                        }
                        sql = `Update users set ? where id = ${id};`
                        db.query(sql,data, (err1,results1) => {
                            if(err1) {
                                if(imagePath) {
                                    fs.unlinkSync('' + imagePath);
                                }
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }
                            if(imagePath) {
                                fs.unlinkSync('' + results[0].profileimage);
                            }
                            
                            sql = `SELECT u.id,u.username, u.displayname, u.profileimage,u.bio
                                    FROM users u
                                    WHERE u.id = ${id}`;
                            db.query(sql, (err2,results2) => {
                                if(err2) {
                                    return res.status(500).json({ message: "Server Error", error: err1.message });
                                }

                                return res.status(200).send(results2);
                            })
                        })
                    }
                    catch(err){
                        console.log(err.message)
                        return res.status(500).json({ message: "Server Error", error: err.message });
                    }
                })
            }
        })
    },
    getUsers: (req,res) => {
        const id = req.dataToken.id 
        var sql = `Select * from users where id = ${id};`;
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})

            return res.status(200).send(result)
        })
    },
    getProfileUser : (req,res) => {
        // funtion untuk nampilin profile user lain ketika klik usernamenya
        var userId = req.params.id;
        var sql = `SELECT * FROM users where users.id = ${userId}`;
        console.log('ini sql', sql)
        db.query(sql, (err,results) => {
            if(err) {
                // console.log(err)
                return res.status(500).send(err)
            }
           
            var sql2 = `SELECT users.id as userId, posts.image, posts.id as postId, posts.caption, posts.created_at
                FROM users
                JOIN posts
                ON users.id = posts.userId 
                WHERE users.id = ${userId}
                ORDER BY posts.id DESC`;
                console.log('ini sql', sql2)
                db.query(sql2, (err2,results2) => {
                    if(err2) {
                        // console.log(err)
                        return res.status(500).send(err2)
                    }
            
                    res.status(200).send({
                        results: results,
                        results2 :results2,
                    })
                })
    
           
        })
       
    },

    resendPassword: (req, res) => {
        let email =  req.body.email
        console.log(email)

        // Step0. Make sure bahwa id user itu ada
        db.query('SELECT * FROM users WHERE email = ?', email, (err, result) => {
            try {
                if(err) throw err

                console.log(err)
                console.log(result)
                if(result.length === 1){
                    // Step1. Get Email dari user id tersebut 
                    let email = result[0].email
                    let id = result[0].id


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
                                    fs.readFile('C:/My Apps/api-sosmed/Public/Template/index2.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`http://localhost:3000/resetpassword/${token}`})
        
                                            transporter.sendMail({
                                                from: 'myUniverse', // Sender Address 
                                                to: 'ichajust2@gmail.com', // Email User
                                                subject: 'Reset Password',
                                                html: newTemplateResult
                                            })
                                            .then((response) => {
                                                res.status(200).send({
                                                    error: false, 
                                                    message: 'Please Check Your Email to Change Password'
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
                    res.status(500).send({
                        error: true, 
                        message:'Account not found'
                    })
                }
            } catch (error) {
                console.log(error)                
            }
        })
    },
    resetPassword: (req, res) => {
        // Step1. Get id
        let { password } = req.body;
        console.log(password)
        let id = req.dataToken.id;
        console.log(id)
        let hashPassword = crypto.createHmac('sha256', 'abc123')
        .update(password)
        .digest("hex");

        console.log(hashPassword)

        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err 
                console.log('atas', result)

                if(result.length === 0){
                    res.status(400).send({
                        error: true, 
                        message: 'Account Not Found'
                    })
                }else{
                      db.query('SELECT token FROM users WHERE token = ?', req.headers.authorization, (err1, result1) => {
                        try {
                            if(err1) throw err1 
                            console.log('bawah', result1)
                            console.log('result1.length', result1.length)

                            if(result1.length === 0){
                                res.status(400).send({
                                    error: true, 
                                    message: 'Token Deactived'
                                })
                            }else{
                                db.query(`UPDATE users SET password =  ${db.escape(hashPassword)} WHERE id = ${id}`, (err2, result2) => {
                                    try {
                                        if(err2) throw err2 
                                        console.log('ini err2',err2)
                                        console.log('result2', result2)

                                        res.status(200).send({
                                            error: false, 
                                            message: 'Reset Password Success!'
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
                            console.log(error)
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
        
    },

    getValidToken: (req, res) => {
        let id = req.dataToken.id;

        var sql = `SELECT token From users WHERE id = ${id}`
        db.query(sql, (err3, result3) => {
            try {
                if(err3) throw err3
                console.log('ini err2',err3)
                console.log('result2', result3)

                res.status(200).send({
                    error: false, 
                    message: 'Get Token Success!',
                    result3: result3
                })
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })
    }
    // resetPassword: async (req, res, next) => {
    //     try {
    //       console.log( req.dataToken.id);
        //   let { password } = req.body;
        //   let id = req.dataToken.id;
        //   let token = req.headers.authorization
    //       console.log(id)
    //       console.log('ini token', token)
        //   let hashPassword = crypto.createHmac('sha256', 'abc123')
        //     .update(password)
        //     .digest("hex");

    //         let sql = `SELECT * from users WHERE id = ${id};`;
    //         await query(sql);

    //         let sql2 = `SELECT token from users WHERE token = ${token};`;
    //         await query(sql2);
            

    //         let resetPass = `UPDATE users set password = ${db.escape(hashPassword)} WHERE id = ${id};`;
    //         await query(resetPass);
    
    //         res.status(200).send({ status: 200, messages: "Reset password success" });
    //     } catch (error) {
    //         console.log(error)
    //     }
    //   },
      
    // resetPassword: (req, res) => {
    //     let { password } = req.body;
    //     let id = req.dataToken.id;
    //     let token = req.headers.authorization
    //     password = crypto.createHmac('sha256', 'abc123')
    //       .update(password)
    //       .digest("hex");
    //        console.log(password);
     
    
    //     let updateQuery1 = `SELECT * from users WHERE id = ${id};';`;

    //     db.query(updateQuery1, (err1, result1) => {
    //     if (err1) res.status(500).send(err1);
    //         let updateQuery2 = `SELECT token from users WHERE token = ${token}';`;

    //         db.query(updateQuery2, (err2, result2) => {
    //         if (err2) res.status(500).send({ error: true, 
    //             message: 'Token Deactived'});
            
    //             let updateQuery3 = `UPDATE users set password='${password}' where id = '${id}';`;
    //             db.query(updateQuery3, (err3, result3) => {
    //             if (err3) res.status(500).send(err3);
                
    //             res.status(200).send({ error: false, 
    //                 message: 'Reset Password Success'});
    //             });
    //         });
    //     });
       
    // },
   
    // resetPassword: (req, res) => {
    //     //Hashing password
    //     let { password } = req.body;
    //     password = crypto.createHmac(
    //         'sha256',
    //       `${process.env.JWT_KEY}}`
    //     )
    //       .update(password)
    //       .digest("hex");

    //     console.log( password)
    
    //     //CHANGE USER PASSWORD
    //     let updateQuery = `Update users set password = ${db.escape(
    //       password
    //     )} where email=${db.escape(req.body.userData.email)};`;

    //     console.log(updateQuery)
    
    //     db.query(updateQuery, (err, results0) => {
    //       if (err) res.status(500).send({ errMessage: "Update user data failed" });
    
    //       //GET UPDATED USER DATA
    //       let selectQuery = `Select * from users where email=${db.escape(
    //         req.body.userData.email
    //       )};`;
    
    //       db.query(selectQuery, (err, results) => {
    //         if (err) res.status(500).send({ errMessage: "Get user data failed" });
    
    //         if (results[0]) {
    //           res.status(200).send({
    //             dataLogin: results[0],
    //             token,
    //             message: "Change password success",
    //           });
    //         } else {
    //           res.status(200).send({
    //             errMessage: "Can't match user data",
    //           });
    //         }
    //       });
    //     });
    //   }
}