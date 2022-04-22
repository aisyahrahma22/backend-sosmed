const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')

module.exports = {
    getPosts: (req, res) => {
        try {
            let id = req.dataToken.id
    
            const sqlQuery = 'SELECT * FROM posts WHERE userId = ?'
    
            db.query(sqlQuery, id, (err, result) => {
                try {
                    if(err) throw err 
    
                    res.status(200).send({
                        status: 200,
                        error: false, 
                        message: 'Get Data Success!',
                        data: result
                    })
                } catch (error) {
                    console.log(error)
                }
            })
        } catch (error) {
            console.log(error)
        }
    },

    // getPosts: (req,res) => {
    //     let id = req.dataToken.id
    //     var sql = `Select * from posts where userId = ${req.user.userId};`;
    //     db.query(sql, (err,result) => {
    //         if(err) return res.status(500).send({ message: 'Error!', error: err})

    //         return res.status(200).send(result)
    //     })
    // },
    addPost: (req,res) => {
        try {
            const path = '/post/images'; //file save path
            const upload = uploader(path, 'POS').fields([{ name: 'image'}]); //uploader(path, 'default prefix')
            const id = req.dataToken.id
            upload(req, res, (err) => {
                if(err){
                    return res.status(500).json({ message: 'Upload picture failed !', error: err.message });
                }
                const { image } = req.files;
                const imagePath = image ? path + '/' + image[0].filename : null;
                const data = JSON.parse(req.body.data);
                data.image = imagePath;
                data.userId = id;
                var sql = 'INSERT INTO posts SET ?';
                conn.query(sql, data, (err, results) => {
                    if(err) {
                        console.log(err.message)
                        fs.unlinkSync('./Public' + imagePath);
                        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err.message });
                    }     
                    console.log(results);
                    sql = `SELECT * from posts where userId = ${id};`;
                    conn.query(sql, id, (err, results) => {
                        if(err) {
                            console.log(err.message);
                            return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err.message });
                        }
                        console.log(results);
                        
                        return res.status(200).send(results);
                    })   
                })    
            })
        } catch(err) {
            return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err.message });
        }
    },

    deletePost: (req,res) => {
        var postId = req.params.id;
        var sql = `SELECT * from posts where id = ${postId};`;
        db.query(sql, (err, results) => {
            if(err) {
                return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `DELETE from posts where id = ${postId};`
                db.query(sql, (err1,results1) => {
                    if(err1) {
                        return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err1.message });
                    }
    
                    fs.unlinkSync('./Public' + results[0].image);
                    sql = `SELECT * from posts where userId=${req.user.userId};`;
                    db.query(sql, (err2,results2) => {
                        if(err2) {
                            return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err2.message });
                        }
                        res.status(200).send(results2);
                    })
                })
            }
        })  
    },
    editPost: (req,res) => {
        var postId = req.params.id;
        var sql = `SELECT * from posts where id = ${postId};`;
        db.query(sql, (err, results) => {
            if(err) throw err;
    
            if(results.length > 0) {
                const path = '/post/images'; //file save path
                const upload = uploader(path, 'POS').fields([{ name: 'image'}]); //uploader(path, 'default prefix')
    
                upload(req, res, (err) => {
                    if(err){
                        return res.status(500).json({ message: 'Upload post picture failed !', error: err.message });
                    }
    
                    const { image } = req.files;
                    // console.log(image)
                    const imagePath = image ? path + '/' + image[0].filename : null;
                    const data = JSON.parse(req.body.data);
    
                    try {
                        if(imagePath) {
                            data.image = imagePath;
                            
                        }
                        sql = `Update posts set ? where id = ${postId};`
                        db.query(sql,data, (err1,results1) => {
                            if(err1) {
                                if(imagePath) {
                                    fs.unlinkSync('./Public' + imagePath);
                                }
                                return res.status(500).json({ message: "There's an error on the server. Please contact the administrator.", error: err1.message });
                            }
                            if(imagePath) {
                                fs.unlinkSync('./Public' + results[0].image);
                            }
                            sql = `Select * from posts where userId=${req.user.userId};`;
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
    }
}
