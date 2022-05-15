const util = require('util')
const db = require('./../Connection/Connection')
const query = util.promisify(db.query).bind(db)
const { uploader } = require('../Helpers/Uploader')
const fs = require('fs')

module.exports = {
    getPostUserbyId: async(req, res) => {
        try {
            let id = req.params.id
            const likedPosts = []
            
            const query0 = 'SELECT * FROM users WHERE id = ?'
            const query0Result = await query(query0, [id])

            const query1 = `SELECT * FROM posts WHERE userId = ? ORDER BY id DESC`
            const posts = await query(query1, [query0Result[0].id])
            
            const query2 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultLikes = await query(query2, posts[i].id);
                posts[i] = { ...posts[i], totalLike: resultLikes[0].userId };
            }

            let query3 = `SELECT COUNT(*) id FROM comment WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultCommentsCount = await query(query3, [posts[i].id]);
                posts[i] = { ...posts[i], comments: resultCommentsCount[0].id };
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
            const likedPosts = []
            
            const query0 = 'SELECT * FROM users WHERE id = ?'
            const query0Result = await query(query0, [id])

            const query1 = `SELECT * FROM posts WHERE userId = ? ORDER BY id DESC`
            const posts = await query(query1, [query0Result[0].id])
            
            const query2 = `SELECT COUNT(*) userId FROM likes WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultLikes = await query(query2, posts[i].id);
                posts[i] = { ...posts[i], totalLike: resultLikes[0].userId };
            }

            let query3 = `SELECT COUNT(*) id FROM comment WHERE postId = ?`;
            for (let i = 0; i < posts.length; i++) {
                let resultCommentsCount = await query(query3, [posts[i].id]);
                posts[i] = { ...posts[i], comments: resultCommentsCount[0].id };
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
            let id = req.dataToken.id
            console.log(id)
            const likedPost = []
            let query1 = 'SELECT postId FROM likes WHERE userId = ? ORDER BY postId DESC;'
            const query1Result = await query(query1, id)

            console.log(query1)
            console.log('ini query1Result.length',query1Result.length)
    
            let query2 = 'SELECT * FROM posts WHERE id = ?'
            for(let i = 0; i < query1Result.length; i++){
                const query2Result = await query(query2, [query1Result[i].postId])
                likedPost.push( query2Result[0])
                console.log('ini query2Result[0]', query2Result[0])
            }

            console.log(query2)
    
            let query3 = 'SELECT COUNT(*) FROM likes WHERE postId = ?'
            for(let i = 0; i <  likedPost.length; i++){
                const query3Result = await query(query3, likedPost[i].id)
                likedPost[i] = {...likedPost[i], likes:  query3Result[0].userId}
            }

            console.log(query3)

            let query4 = 'SELECT COUNT(*) userId FROM likes WHERE userId = ? AND postId = ?'
            for(let i = 0; i <  likedPost.length; i++){
                const query4Result = await query(query4, [id, likedPost[i].id])
                likedPost[i] = {...likedPost[i], likes2:  query4Result[0].userId}
            }
            console.log(query4)
            let query5 = `SELECT username FROM users WHERE id = ?`;
            for (let i = 0; i < likedPost.length; i++) {
                let query5Result = await query(query5, likedPost[i].userId);
                likedPost[i] = { ...likedPost[i], username: query5Result[0].username };
            }
       
         

            // let query5 = 'SELECT username FROM users WHERE id = ?'
            // for(let i = 0; i <  likedPost.length; i++){
            //     const query5Result = await query(query5, [id, likedPost[i].userId])
            //     likedPost[i] = {...likedPost[i], username: query5Result[0].username}
            // }
            console.log(query5)
        
            let query6 = 'SELECT profileimage FROM users WHERE id = ?'
            for(let i = 0; i <  likedPost.length; i++){
                const query6Result = await query(query6, likedPost[i].userId)
                likedPost[i] = {...likedPost[i], profileimage: query6Result[0].profileimage}
            }

            console.log(query6)

            res.status(200).send(likedPost)
           
        } catch (error) {
            res.status(500).send({
                error: true, 
                message: error.message
            })
        }
    },
    getAllData: async(req, res) => {
        try {
            let id = req.dataToken.id

            let query1 = `SELECT posts.*, users.username, users.profileimage as profilepicture
            FROM posts
            JOIN users 
            ON posts.userId = users.id 
            ORDER BY posts.id DESC`

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
    getData: (req, res) => {
        let id = req.dataToken.id
        var postId = req.params.id;
        console.log('ini postId ', postId)
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
                        // console.log(err)
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
    getAllPost: (req,res) => { 
    //   problem solve jangan rubah codingan ini
        let id = req.dataToken.id
        var postId = req.params.id;
        var sql =`SELECT p.*, u.username, u.profileimage, count(l.userId) as totalLike
        FROM posts p 
        JOIN users u 
        ON p.userId = u.id 
        LEFT JOIN likes l 
        ON p.id = l.postId 
        GROUP BY p.id`;
        db.query(sql, (err,results) => {
            if(err) {
                // console.log(err)
                return res.status(500).send(err)
            }
            
            var sql = `SELECT l.postId 
            FROM users u 
            JOIN likes l
            ON l.userId = u.id
            WHERE l.userId = ${id}`
            db.query(sql, (err2,results2) => {
                if(err2) {
                    // console.log(err)
                    return res.status(500).send(err2)
                }
                var newArray = []
                for (let i = 0; i < results2.length; i++) {
                    newArray.push(results2[i].postId)
                }
        
                res.status(200).send({
                    results: results,
                    results2 : newArray
                })
            })
        })
    },
    getAllPostByUserId : (req,res) => {
        // function ini digunakan ketika nampilin post di profile
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
    getAllPostById : (req,res) => {
        // function ini berfungsi untuk menampilkan detail image
        // belum bisa menampilkan comment dan like ketika detail di buka
        var postId = req.params.id;
        var sql = `SELECT * from posts where id = ${postId};`;
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

    // 1. User login (id=47)
    // 2. Cek postId
    // 3. Jika ada, Cek userId
    // 4. Jika tidak ada, Post like
    // 5. Dislike post 
    // 6. Count total like

    likepost: (req,res) => {
        console.log('bebas')
        let totalLike;
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
                // Cek userId sudah like post ??
                sql = `SELECT * from likes where userId = ${id} and postId = ${postId} `;
                console.log('sql user id', sql)
                db.query(sql, (err2,results2) => {
                    console.log('results2:', results2)
                    if(results2.length == 0) {
                        // Post like
                        sql = `INSERT INTO likes (postId, userId)
                        VALUES (${results[0].id}, ${id});`
                        console.log('sql1 bawah', sql)
                        db.query(sql, (err1,results1) => {
                            console.log('results:', results1)
                            if(err1) {
                                console.log('err1 bawah', err1)
                                return res.status(500).json({ message: "Server Error", error: err1.message });
                            }
                        })
                    } else {
                        // Delete like
                        sql = `DELETE from likes where userId = ${id} and postId = ${postId}`
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
        var id = req.dataToken.id
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
                    
                    if(err2) {
                        console.log('err bawah2', err2)
                        return res.status(500).json({ message: "Server Error", error: err2.message });
                    }
                    console.log('results2:', results2)

                    sqlNew = `SELECT * from comment where postId = ${postId};`
                            console.log('sql user id', sqlNew)
                            db.query(sqlNew, (err3,results3) => {
                                
                                if(err3) {
                                    console.log('err bawah2', err3)
                                    return res.status(500).json({ message: "Server Error", error: err3.message });
                                }
                                console.log('results3:', results3)
                                res.status(200).send(results3);
                            })
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
