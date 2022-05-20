const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')
const fs = require('fs')

module.exports = {
    getAllPosts: async(req, res) => {
        try {
            // console.log(req.query)
            let id = req.dataToken.id
            console.log(id)
            const page = parseInt(req.query.page)
            const limit = parseInt(req.query.limit)
            const startIndex = (page - 1) * limit

            let query1 = `SELECT posts.*, users.username, users.profileimage as profilepicture
            FROM posts
            JOIN users 
            ON posts.userId = users.id 
            ORDER BY posts.id DESC
            LIMIT ${startIndex},${limit};`

            const posts = await query(query1)
            
            let query2 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let post = posts[i];
                let resultLikes = await query(query2, post.id);
                posts[i] = { ...posts[i], totalLike: resultLikes[0].userId };
            }

            let query3 = `SELECT COUNT(*) userId FROM likes WHERE userId = ? AND postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let post = posts[i];
                let resultIsLiked = await query(query3, [id, post.id]);
                posts[i] = { ...posts[i], myLike: resultIsLiked[0].userId };
            }
            
            res.status(200).send(posts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
    getPostUserbyId: async(req, res) => {
        try {
            let id = req.params.id
          
            const sql1 = 'SELECT * FROM users WHERE id = ?'
            const sql1Result = await query(sql1, [id])

            const sql2 = `SELECT * FROM posts WHERE userId = ? ORDER BY id DESC`
            const posts = await query(sql2, [sql1Result[0].id])
            
            const sql3 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let likesResult = await query(sql3, posts[i].id);
                posts[i] = { ...posts[i], totalLike: likesResult[0].userId };
            }

            let sql4 = `SELECT COUNT(*) id FROM comment WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let commentResult = await query(sql4, [posts[i].id]);
                posts[i] = { ...posts[i], comments: commentResult[0].id };
            }
            
            res.status(200).send(posts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
    getProfilePost: async(req, res) => {
        try {
            let id = req.dataToken.id
            const sql1 = 'SELECT * FROM users WHERE id = ?'
            const sql1Result = await query(sql1, [id])

            const sql2 = `SELECT * FROM posts WHERE userId = ? ORDER BY id DESC`
            const posts = await query(sql2, [sql1Result[0].id])
            
            const sql3 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let likesResult = await query(sql3, posts[i].id);
                posts[i] = { ...posts[i], totalLike: likesResult[0].userId };
            }

            let sql4 = `SELECT COUNT(*) id FROM comment WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let commentResult = await query(sql4, [posts[i].id]);
                posts[i] = { ...posts[i], comments: commentResult[0].id };
            }
            
            res.status(200).send(posts)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
    getLikedPost: async(req, res) => {
        try {
            const id = req.dataToken.id
            const likedPost = []
            let sql1 = `SELECT postId FROM likes WHERE userId = ? ORDER BY postId DESC;`
            const sql1Result = await query(sql1, [id])

            let sql2 = `SELECT * FROM posts WHERE id = ?;`
            for (let i = 0; i < sql1Result.length; i++) {
                const sql2Result = await query(sql2, [sql1Result[i].postId])
                likedPost.push(sql2Result[0])
            }
            
            let sql3 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < likedPost.length; i++) {
                let sql3Result = await query(sql3, likedPost[i].id);
                likedPost[i] = { ...likedPost[i], likesTotal: sql3Result[0].userId };
            }
       
            let sql4 = `SELECT COUNT(*) userId FROM likes WHERE userId = ? AND postId = ?`;
            for (let i = 0; i < likedPost.length; i++) {
                let sql4Result = await query(sql4, [id, likedPost[i].id]);
                likedPost[i] = { ...likedPost[i], myLiked: sql4Result[0].userId };
            }

            let sql5 = `SELECT username FROM users WHERE id = ?`;
            for (let i = 0; i < likedPost.length; i++) {
                let sql5Result = await query(sql5, likedPost[i].userId);
                likedPost[i] = { ...likedPost[i], username: sql5Result[0].username };
            }
       
            let sql6 = `SELECT profileimage FROM users WHERE id = ?`;
            for (let i = 0; i < likedPost.length; i++) {
                let sql6Result = await query(sql6, [likedPost[i].userId]);
                likedPost[i] = { ...likedPost[i], profileImage: sql6Result[0].profileimage };
            }
            
            res.status(200).send(likedPost)
        } catch (error) {
            res.status(400).send({
                status: 400,
                error: true,
                message: error.message
            })
        }
    },
    // getAllData: async(req, res) => {
    //     try {
    //         let id = req.dataToken.id

    //         let query1 = `SELECT posts.*, users.username, users.profileimage as profilepicture
    //         FROM posts
    //         JOIN users 
    //         ON posts.userId = users.id 
    //         ORDER BY posts.id DESC`

    //         const posts = await query(query1)
            
    //         let query2 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
    //         for (let i = 0; i < posts.length; i++) {
    //             let post = posts[i];
    //             let resultLikes = await query(query2, post.id);
    //             posts[i] = { ...posts[i], totalLike: resultLikes[0].userId };
    //         }

    //         let query3 = `SELECT COUNT(*) userId FROM likes WHERE userId = ? AND postId = ?`;
    //         for (let i = 0; i < posts.length; i++) {
    //             let post = posts[i];
    //             let resultIsLiked = await query(query3, [id, post.id]);
    //             posts[i] = { ...posts[i], myLike: resultIsLiked[0].userId };
    //         }
            
    //         res.status(200).send(posts)
    //     } catch (error) {
    //         res.status(400).send({
    //             status: 400,
    //             error: true,
    //             message: error.message
    //         })
    //     }
    // },
    getData: (req, res) => {
        let id = req.dataToken.id
        var postId = req.params.id;
        
        var getDataQuery =`SELECT p.*, u.username, u.profileimage, u.displayname, count(l.userId) as totalLike
        FROM posts p 
        JOIN users u 
        ON p.userId = u.id 
        LEFT JOIN likes l 
        ON p.id = l.postId 
        WHERE p.id = ${postId}`;
    
        db.query(getDataQuery, (err, results) => {
          if (err) {
            res.status(500).send(err);
          }

          var sql = `SELECT c.postId, c.userId, c.comment, u.username, c.created_at
          FROM users u 
          JOIN comment c
          ON c.userId = u.id
          WHERE c.postId = ${postId}`
            db.query(sql, (err2,results2) => {
                if(err2) {
                    // console.log(err)
                    return res.status(500).send(err2)
                }

                var sql3 = `SELECT l.userId, l.postId  
                FROM users u 
                JOIN likes l
                ON l.userId = u.id
                WHERE l.postId = ${postId} and l.userId = ${id}`
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
                        comment :results2,
                        likes : newArray,
                    })
                })
            })
        });
    },
   
    homeLike: (req, res) => {
        try {
            let id = req.dataToken.id
            var postId = req.params.id;
            var sql = `INSERT INTO likes (postId, userId) VALUES (${postId}, ${id})`
            db.query(sql, (err, result) => {
                try {
                    if (err) throw err
                    res.status(200).send({
                        error: false,
                        message:'Success!'
                    })
                } catch (error) {
                    console.log(error)
                    res.status(400).send({
                        error: true,
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(error.status).send({
                status: error.status,
                error: true,
                message: error.message
            })
        }
    },

    homeUnlike: (req, res) => {
        try {
            let id = req.dataToken.id
            var postId = req.params.id;
            var sql = `DELETE FROM likes WHERE userId=${id} AND postId=${postId}`
            db.query(sql, (err, result) => {
                try {
                    if (err) throw err
                    
                    res.status(200).send({
                        error: false,
                        message:'Success!'
                    })
                } catch (error) {
                    res.status(error.status).send({
                        status: error.status,
                        error: true,
                        message: error.message
                    })
                }
            })
        } catch (error) {
            res.status(error.status).send({
                status: error.status,
                error: true,
                message: error.message
            })
        }
    },
    getComments: async(req, res) => {
        try {
            const page = parseInt(req.query.page)
            var postId = req.params.id;

            let query1 = `SELECT comment.*, users.username, users.profileimage
            FROM comment
            JOIN users 
            ON comment.userId = users.id 
            WHERE comment.postId = ?
            ORDER BY comment.id DESC`
            const query1Result = await query(query1, [postId])

            res.status(200).send(query1Result)
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },
    addPost: (req,res) => {
        try {
            const path = 'Public/post/images'; 
            const upload = uploader(path, 'POS').fields([{ name: 'image'}]);
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
                db.query(sql, data, (err, results) => {
                    if(err) {
                        fs.unlinkSync('./Public' + imagePath);
                        return res.status(500).json({ message: "Server Error", error: err.message });
                    } 

                    // if(data.caption === ''){
                    // return res.status(500).json({ message: "Image or Caption Empty", error: err.message });
                    // }
                    
                    console.log('ini result uploud',results)

                    sql = `SELECT * from posts where userId = ${id};`;
                    db.query(sql, id, (err, results) => {
                        if(err) {
                            return res.status(500).json({ message: "Server Error", error: err.message });
                        }
                        
                        return res.status(200).send(results);
                    })   
                })    
            })
        } catch(err) {
            return res.status(500).json({ message: "Server Error", error: err.message });
        }
    },

    deletePost: async(req, res) => {
        try {
            const postId = req.params.id;
            var id = req.dataToken.id

            const sql1 = 'SELECT id FROM posts WHERE id = ?;'
            let sql1Result = await query(sql1, [ postId])
            let postsId = sql1Result[0].id

            const sql2 = 'DELETE FROM comment WHERE postId = ?;'
            await query(sql2, [postsId])
            
            const sql3 = 'DELETE FROM likes WHERE postId = ?;'
            await query(sql3, [postsId])
           
            const sql4 = 'DELETE FROM posts WHERE id = ?;'
            await query(sql4, [postId])

            const sql5 = `Select * from posts where userId=${id} ORDER BY posts.id DESC;`;
            await query(sql5)
            
            res.status(200).send({
                error: false,
                message: 'Delete Post Success!',
                
            })
        } catch (error) {
            res.status(500).send({
                error: true,
                message: error.message
            })
        }  
    },

    editPost: (req,res) => {
        var postId = req.params.id;
        var id = req.dataToken.id
        var sql = `SELECT * from posts where id = ${postId};`;
        db.query(sql, (err, results) => {
            if(err) throw err;
    
            if(results.length > 0) {
                const path = 'Public/post/images'; 
                const upload = uploader(path, 'POS').fields([{ name: 'image'}]);
    
                upload(req, res, (err) => {
                    if(err){
                        return res.status(500).json({ message: 'Upload post picture failed !', error: err.message });
                    }
    
                    const { image } = req.files;
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
                            sql = `Select * from posts where userId=${id} ORDER BY posts.id DESC;`;
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

    likepost: (req,res) => {
        let totalLike;
        var postId = req.params.id;
        var sql = `SELECT * from posts where id = ${postId};`;
        var id = req.dataToken.id

        db.query(sql, (err, results) => {
            if(err) {
                console.log('err atas', err)
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `SELECT * from likes where userId = ${id} and postId = ${postId} `;
                db.query(sql, (err2,results2) => {
                    if(results2.length == 0) {
                        sql = `INSERT INTO likes (postId, userId)
                        VALUES (${results[0].id}, ${id});`
                        db.query(sql, (err1,results1) => {
                            if(err1) {
                                console.log('err1 bawah', err1)
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }
                        })
                    } else {
                        sql = `DELETE from likes where userId = ${id} and postId = ${postId}`
                        console.log('sql user id', sql)
                        db.query(sql, (err2,results2) => {
                            if(err2) {
                                console.log('err bawah2', err2)
                                return res.status(500).json({ message: "Server Error", error: err2.message });
                            }
                        })
                    }

                     sql = `SELECT COUNT(userId) as totalLikes FROM likes;`;
                     db.query(sql, (err2,results2) => {
                         if(err2) {
                             return res.status(500).json({ message: "Server Error", error: err2.message });
                         }
                         totalLike = results2[0].totalLikes;
                     })

                    if(err2) {
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send(results2);
                })

            }
        })  
    },

    addComment: (req,res) => {
        let comment = req.body.comment
        var postId = req.params.id;
        var id = req.dataToken.id
        var sql = `SELECT * from posts where id = ${postId};`;
    
        db.query(sql, (err, results) => {
            if(err) {
                return res.status(500).json({ message: "Server Error", error: err.message });
            }
            
            if(results.length > 0) {
                sql = `INSERT INTO comment (postId, userId, comment)
                VALUES (${results[0].id}, ${id}, '${comment}');`
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    res.status(200).send({ message: "Like Success", error: false });
                })

            }
        })  
    },
    // deleteComment: (req,res) => {
    //     var commentId = req.params.id;
    //     var sql = `SELECT * from comment where id = ${commentId};`;
    //     var id = req.dataToken.id

    //     db.query(sql, (err, results) => {
    //         if(err) {
    //             console.log('err atas', err)
    //             return res.status(500).json({ message: "Server Error", error: err.message });
    //         }
            
    //         if(results.length > 0) {
    //             sql = `DELETE FROM comment WHERE id=${commentId}`
    //             console.log('sql user id', sql)
    //             db.query(sql, (err2,results2) => {
    //                 console.log('results2:', results2)
    //                 if(err2) {
    //                     console.log('err bawah2', err2)
    //                     return res.status(500).json({ message: "Server Error", error: err2.message });
    //                 }
    //                 res.status(200).send(results2);
    //             })

    //         }
    //     })  
    // },
    // editComment: (req,res) => {
    //     var {comment} = req.body;
    //     var commentId = req.params.id;
    //     console.log('ini comment',typeof comment)
    //     var sql = `SELECT * from comment where id = ${commentId};`;
    //     console.log('ini sql atas', sql)
    //     var id = req.dataToken.id
    //     db.query(sql, (err, results) => {
    //         console.log('results', results)
    //         if(err) {
    //             console.log('err atas', err)
    //             return res.status(500).json({ message: "Server Error", error: err.message });
    //         }
            
    //         if(results.length > 0) {
    //             sql = `UPDATE comment
    //             SET comment = '${comment}' WHERE id=${commentId}`
    //             console.log('sql user id', sql)
    //             db.query(sql, (err2,results2) => {
    //                 console.log('results2:', results2)
    //                 if(err2) {
    //                     console.log('err bawah2', err2)
    //                     return res.status(500).json({ message: "Server Error", error: err2.message });
    //                 }
    //                 res.status(200).send(results2);
    //             })

    //         }
    //     })  
    // },
    
}
