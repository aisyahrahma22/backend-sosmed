const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')
const fs = require('fs')

module.exports = {
    getAllPost: (req,res) => {   
        var sql =`SELECT p.*, u.username, u.profileimage, c.comment, count(l.userId) as totalLike
                    FROM posts p 
                    JOIN users u 
                    ON p.userId = u.id 
                    JOIN comment c 
                    ON p.id = c.postId 
                    JOIN likes l 
                    ON p.id = l.postId 
                    ORDER BY p.id DESC;`;
        db.query(sql, (err,results) => {
            if(err) {
                // console.log(err)
                return res.status(500).send(err)
            }
    
            res.status(200).send(results)
        })
    },
    getAllPostByUserId : (req,res) => {
        let id = req.dataToken.id
        var postId = req.params.id;
        var sql = `SELECT * from posts where id = ${postId};`;
        var sql =`SELECT p.*, u.username, u.profileimage
                    FROM posts p 
                    JOIN users u 
                    ON p.userId = u.id
                    WHERE userId = ${id}
                    ORDER BY p.id DESC;`;
        console.log('ini req params id', postId)
        console.log('ini req', req)
        db.query(sql, (err,results) => {
            if(err) {
                // console.log(err)
                return res.status(500).send(err)
            }
    
            res.status(200).send(results)
        })
    },
    getAllPostExplore : (req,res) => {
        let id = req.dataToken.id
        var postId = req.params.id;
        var sql =`SELECT p.*, u.username, u.profileimage
                    FROM posts p 
                    JOIN users u 
                    ON p.userId = u.id 
                    WHERE userId <> ${id}
                    ORDER BY p.id DESC;`;
        db.query(sql, (err,results) => {
            if(err) {
                // console.log(err)
                return res.status(500).send(err)
            }
    
            res.status(200).send(results)
        })
    },
    getPosts: (req,res) => {
        let id = req.dataToken.id
        var sql = `Select * from posts where userId = ${id};`;
        db.query(sql, (err,result) => {
            if(err) return res.status(500).send({ message: 'Error!', error: err})

            return res.status(200).send(result)
        })
    },
    addPost: (req,res) => {
        try {
            const path = 'Public/post/images'; //file save path
            const upload = uploader(path, 'POS').fields([{ name: 'image'}]); //uploader(path, 'default prefix')
            const id = req.dataToken.id
            upload(req, res, (err) => {
                if(err){
                    return res.status(500).json({ message: 'Upload picture failed !', error: err.message });
                }
                const { image } = req.files;
                console.log('image', {image})
                const imagePath = image ? path + '/' + image[0].filename : null;
                console.log('imagePath', imagePath)
                const data = JSON.parse(req.body.data);
                console.log('data', data)
                data.image = imagePath;
                console.log('data image', data.image)
                data.userId = id;
                console.log('userId', data.userId)
                var sql = 'INSERT INTO posts SET ?';
                db.query(sql, data, (err, results) => {
                    if(err) {
                        console.log('ini err sql1',err.message)
                        fs.unlinkSync('./Public' + imagePath);
                        return res.status(500).json({ message: "Server Error", error: err.message });
                    }     
                    console.log(results);

                    sql = `SELECT * from posts where userId = ${id};`;
                    db.query(sql, id, (err, results) => {
                        if(err) {
                            console.log('ini err sql2',err.message);
                            return res.status(500).json({ message: "Server Error", error: err.message });
                        }
                        console.log(results);
                        
                        return res.status(200).send(results);
                    })   
                })    
            })
        } catch(err) {
            return res.status(500).json({ message: "Server Error", error: err.message });
        }
    },

    deletePost: (req,res) => {
        var postId = req.params.id;
        console.log('ini postId', postId)
        var sql = `SELECT * from posts where id = ${postId};`;
        console.log('ini sql atas', sql)
        var id = req.dataToken.id
        db.query(sql, (err, results) => {
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `DELETE from posts where id = ${postId};`
                console.log('sql bawah', sql)
                db.query(sql, (err1,results1) => {
                    if(err1) {
                        console.log('err1 bawah', err1)
                        return res.status(500).json({ message: "Server Error", error: err1.message });
                    }
    
                    fs.unlinkSync('' + results[0].image);
                    sql = `SELECT * from posts where userId=${id};`;
                    console.log('sql user id', sql)
                    db.query(sql, (err2,results2) => {
                        if(err2) {
                            console.log('err bawah2', err2)
                            return res.status(500).json({ message: "Server Error", error: err2.message });
                        }
                        res.status(200).send(results2);
                    })
                })
            }
        })  
    },
    editPost: (req,res) => {
        var postId = req.params.id;
        var id = req.dataToken.id
        var sql = `SELECT * from posts where id = ${postId};`;
        db.query(sql, (err, results) => {
            if(err) throw err;
    
            if(results.length > 0) {
                const path = 'Public/post/images'; //file save path
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
                                    fs.unlinkSync('' + imagePath);
                                }
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }
                            if(imagePath) {
                                fs.unlinkSync('' + results[0].image);
                            }
                            sql = `Select * from posts where userId=${id};`;
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

    
    // likepost: (req,res) => {
    //     var postId = req.params.id;
    //     console.log('ini postId', postId)
    //     var sql = `SELECT * FROM posts INNER JOIN likes ON likes.postId = ? WHERE posts.id = ${postId} AND likes.userId = ${id}`;
    //     console.log('ini sql atas', sql)
    //     var id = req.dataToken.id
    //     db.query(sql, (err, results) => {
    //         if(err) {
    //             console.log('err atas', err)
    //             return res.status(500).json({ message: "Server Error", error: err.message });
    //         }
            
    //         if(results.length) {
    //             sql = `DELETE FROM likes WHERE postId = ${postId} AND userId = ${id}`
    //             console.log('sql bawah', sql)
    //             db.query(sql, (err1,results1) => {
    //                 if(err1) {
    //                     console.log('err1 bawah', err1)
    //                     return res.status(500).json({ message: "Server Error", error: err1.message });
    //                 }
    
    //                 fs.unlinkSync('' + results[0].image);
    //                 sql = `INSERT INTO likes set ?`;
    //                 console.log('sql user id', sql)
    //                 db.query(sql, (err2,results2) => {
    //                     if(err2) {
    //                         console.log('err bawah2', err2)
    //                         return res.status(500).json({ message: "Server Error", error: err2.message });
    //                     }
    //                     res.status(200).send(results2);
    //                 })
    //             })
    //         }
    //     })  
    // },

    // 1. User login (id=47)
    // 2. Cek postId
    // 3. Jika ada, Cek userId
    // 4. Jika tidak ada, Post like
    // 5. Dislike post 
    // 6. Count total like


    likepost: (req,res) => {
        let totalLike;
        var postId = req.params.id;
        console.log('ini postId', postId)
        var sql = `SELECT * from posts where id = ${postId};`;
        console.log('ini sql atas', sql)
        var id = req.dataToken.id
        db.query(sql, (err, results) => {
            
        console.log('resul:', results.length)
        console.log('results.id:', results[0].id)
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                // Cek userId sudah like post ??
                sql = `SELECT * from likes where userId = ${id};`;
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    console.log('results2:', results2)
                    if(results2.length == 0) {
                        // Post like
                        sql1 = `INSERT INTO likes (postId, userId)
                        VALUES (${results[0].id}, ${id});`
                        console.log('sql1 bawah', sql1)
                        db.query(sql1, (err1,results1) => {
                            console.log('results:', results1)
                            if(err1) {
                                console.log('err1 bawah', err1)
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }
                        })
                    } else {
                        // Delete like
                        sql = `DELETE from likes where userId = ${id};`
                        console.log('sql user id', sql)
                        db.query(sql, (err2,results2) => {
                            if(err2) {
                                console.log('err bawah2', err2)
                                return res.status(500).json({ message: "Server Error", error: err2.message });
                            }
                        })
                    }

                     // Get count like (total)
                     sql = `SELECT COUNT(userId) as totalLikes FROM likes;`;
                     console.log('sql user id', sql)
                     db.query(sql, (err2,results2) => {
                         if(err2) {
                             console.log('err bawah2', err2)
                             return res.status(500).json({ message: "Server Error", error: err2.message });
                         }
                         totalLike = results2[0].totalLikes;
                     })

                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send(results2);
                })

            }
        })  
    },

    addComment: (req,res) => {
        var {comment} = req.body;
        var postId = req.params.id;
        console.log('ini comment',typeof comment)
        var sql = `SELECT * from posts where id = ${postId};`;
        console.log('ini sql atas', sql)
        var id = req.dataToken.id
        db.query(sql, (err, results) => {
            console.log('results', results)
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `INSERT INTO comment (postId, userId, comment)
                VALUES (${results[0].id}, ${id}, '${comment}');`
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    console.log('results2:', results2)
                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send(results2);
                })

            }
        })  
    },
    deleteComment: (req,res) => {
        var commentId = req.params.id;
        var sql = `SELECT * from comment where id = ${commentId};`;
        console.log('ini sql atas', sql)
        var id = req.dataToken.id
        db.query(sql, (err, results) => {
            console.log('results', results)
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `DELETE FROM comment WHERE id=${commentId}`
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    console.log('results2:', results2)
                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send(results2);
                })

            }
        })  
    },
    editComment: (req,res) => {
        var {comment} = req.body;
        var commentId = req.params.id;
        console.log('ini comment',typeof comment)
        var sql = `SELECT * from comment where id = ${commentId};`;
        console.log('ini sql atas', sql)
        var id = req.dataToken.id
        db.query(sql, (err, results) => {
            console.log('results', results)
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `UPDATE comment
                SET comment = '${comment}' WHERE id=${commentId}`
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    console.log('results2:', results2)
                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send(results2);
                })

            }
        })  
    }
}
