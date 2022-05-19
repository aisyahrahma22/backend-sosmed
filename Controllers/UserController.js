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
            let data = req.body

            if(!data.username || !data.email || !data.password) throw { message: 'Data Not Completed!' }
            if(!validator.isEmail(data.email)) throw { message: 'Email Invalid' }
            if(data.password.length > 50) throw { message: 'Password Maximum 50 Character' }

            
            const hmac = crypto.createHmac('sha256', 'abc123')
            await hmac.update(data.password)
            const passwordHashed = await hmac.digest('hex')
            data.password = passwordHashed
        
            let query01 = 'SELECT * FROM users WHERE username = ?'
            const findUsername = await query(query01, data.username)
            .catch((error) => {
                throw error
            })

            if(findUsername.length > 0){
                throw { message: 'Username Already Register!' }
            }

            let query1 = 'SELECT * FROM users WHERE email = ?'
            const findEmail = await query(query1, data.email)
            .catch((error) => {
                throw error
            })

            if(findEmail.length > 0){
                throw { message: 'Email Already Register!' }
            }

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
                                    const newTemplateResult = newTemplate({bebas: data.email, link:`http://localhost:3000/confirmation/${token}`})

                                    transporter.sendMail({
                                        from: 'myUniverse@mail.com',
                                        to: data.email, 
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
        const id = req.dataToken.id 

        db.query('SELECT * FROM users WHERE id = ? AND is_confirmed = 0', id, (err, result) => {
            try {
                if(err) throw err 

                if(result.length === 0){
                    res.status(400).send({
                        error: true, 
                        message: 'Id Not Found / Email Already Active'
                    })
                }else{
                      db.query('SELECT token FROM users WHERE token = ?', req.headers.authorization, (err, result) => {
                        try {
                            if(err) throw err 

                            if(result.length === 0){
                                res.status(400).send({
                                    error: true, 
                                    message: 'Token Deactived'
                                })
                            }else{
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

    
    },

    login: (req, res) => {
        let {  account, password } = req.body;
        console.log(  {  account, password } )

        password = crypto.createHmac('sha256', 'abc123')
        .update(password)
        .digest("hex");

        let getUserQuery = `select * from users where (email = ${db.escape(
        account
        )} or username = ${db.escape( account)}) and password = ${db.escape(
        password
        )}`;

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
        db.query('SELECT * FROM users WHERE id = ?', id, (err, result) => {
            try {
                if(err) throw err

                if(result.length === 1){
    
                    let email = result[0].email
                    let code_activation = result[0].code_activation
                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err

                            let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
        
                                    fs.readFile('C:/My Apps/api-sosmed/Public/Template/index.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`http://localhost:3000/confirmation/${token}`})
        
                                            transporter.sendMail({
                                                from: 'myUniverse@mail.com',  
                                                to: email,
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
                    res.status(500).send({
                        error: true, 
                        message: 'Account Not Found'
                    })
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
                const path = 'Public/users';
                const upload = uploader(path, 'USER').fields([{ name: 'image'}]); 
    
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
        var userId = req.params.id;
      
        var sql = `SELECT * FROM users where users.id = ${userId}`;
        console.log('ini sql', sql)
        db.query(sql, (err,results) => {
            if(err) {
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
                        return res.status(500).send(err2)
                    }

                    var sql3 = `SELECT l.userId, l.postId  
                        FROM users u 
                        JOIN likes l
                        ON l.userId = u.id
                        WHERE l.userId = ${userId}`
                        db.query(sql3, (err2,results3) => {
                            if(err2) {
                                return res.status(500).send(err2)
                            }
                            var newArray = []
                            for (let i = 0; i < results3.length; i++) {
                                newArray.push(results3[i].postId)
                            }
                    
                            res.status(200).send({
                                results: results,
                                results2:results2,
                                likes : newArray,
                            })
                        })
                })
    
           
        })
       
    },

    resendPassword: (req, res) => {
        let email =  req.body.email
        console.log(email)

        db.query('SELECT * FROM users WHERE email = ?', email, (err, result) => {
            try {
                if(err) throw err

                console.log(err)
                console.log(result)
                if(result.length === 1){
                    let email = result[0].email
                    let id = result[0].id

                    jwt.sign({id: id}, '123abc', (err, token) => {
                        try {
                            if(err) throw err
        
                            let query3 = 'UPDATE users SET token = ? WHERE id = ?'
                            db.query(query3, [token, id], (err1, result1) => {
                                try {
                                    if(err1) throw err1
        
                                    fs.readFile('C:/My Apps/api-sosmed/Public/Template/index2.html', {
                                        encoding: 'utf-8'}, (err, file) => {
                                            if(err) throw err 
        
                                            const newTemplate = handlebars.compile(file)
                                            const newTemplateResult = newTemplate({bebas: email, link:`http://localhost:3000/resetpassword/${token}`})
        
                                            transporter.sendMail({
                                                from: 'myUniverse@mail.com', 
                                                to: email, 
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
    },

    getUserVerify: (req, res) => {
        let id = req.dataToken.id;

        var sql = `SELECT is_confirmed From users WHERE id = ${id}`
        db.query(sql, (err, result) => {
            try {
                if(err) throw err
                res.status(200).send(result)
            } catch (error) {
                res.status(500).send({
                    error: true, 
                    message: error.message
                })
            }
        })
    }
}