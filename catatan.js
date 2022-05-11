// var sql =`SELECT p.*, u.username, u.profileimage, count(l.userId) as totalLike
// FROM posts p 
// JOIN users u 
// ON p.userId = u.id 
// LEFT JOIN likes l 
// ON p.id = l.postId 
// WHERE u.id <> ${id}
// ORDER BY p.id DESC;`;

// getData: (req, res) => {
//    let id = req.dataToken.id
//    var postId = req.params.id;
//    console.log('ini postId ', postId)
//    var getDataQuery =`SELECT p.*, u.username, u.profileimage, count(l.userId) as totalLike
//    FROM posts p 
//    JOIN users u 
//    ON p.userId = u.id 
//    LEFT JOIN likes l 
//    ON p.id = l.postId 
//    GROUP BY p.id`;

//    db.query(getDataQuery, (err, results) => {
//      if (err) {
//        res.status(500).send(err);
//      }
//      var sql = `SELECT c.postId, c.userId, c.comment, u.username, c.created_at
//      FROM users u 
//      JOIN comment c
//      ON c.userId = u.id
//      WHERE c.userId = ${id} and c.postId = ${postId} `
//        db.query(sql, (err2,results2) => {
//            if(err2) {
//                // console.log(err)
//                return res.status(500).send(err2)
//            }

//            var sql3 = `SELECT l.postId 
//            FROM users u 
//            JOIN likes l
//            ON l.userId = u.id
//            WHERE l.userId = ${id}`
//            db.query(sql3, (err2,results3) => {
//                if(err2) {
//                    // console.log(err)
//                    return res.status(500).send(err2)
//                }
//                var newArray = []
//                for (let i = 0; i < results3.length; i++) {
//                    newArray.push(results3[i].postId)
//                }
       
//                res.status(200).send({
//                    results: results,
//                    comment :results2,
//                    likes : newArray,
//                })
//            })
       
//        })
//    });
// },

// SELECT p.*, u.username, u.profileimage, c.comment, us.username
// FROM posts p     
// JOIN users u ON u.id = p.userId     
// FULL OUTER JOIN comment c ON p.id = c.postId     
// JOIN users us ON us.id = c.userId

// SELECT p.*, u.username, u.profileimage, c.comment, count(l.userId) as totalLike
//                     FROM posts p 
//                     JOIN users u 
//                     ON p.userId = u.id 
                  //   JOIN comment c 
                  //   ON p.id = c.postId 
//                     JOIN likes l 
//                     ON p.id = l.postId 
//                     ORDER BY p.id DESC;


// SELECT posts.id, caption, username, userId, profileimage,posts.created_at, (SELECT count(*) FROM likes WHERE postId = posts.id) as  totalLike
// from posts 
// INNER JOIN users ON posts.userId = users.id 
// LEFT JOIN (SELECT id as likeId, postId FROM likes WHERE userId = ${id}) as l ON posts.id = l.postId 
// WHERE users.id = ${id} ORDER BY posts.created_at DESC 

   // getAllPostExplore : (req,res) => {
   //      let id = req.dataToken.id
   //      var postId = req.params.id;
   //      var sql =`SELECT p.*, u.username, u.profileimage
   //                  FROM posts p 
   //                  JOIN users u 
   //                  ON p.userId = u.id 
   //                  WHERE userId <> ${id}
   //                  ORDER BY p.id DESC;`;
   //      db.query(sql, (err,results) => {
   //          if(err) {
   //              // console.log(err)
   //              return res.status(500).send(err)
   //          }
    
   //          res.status(200).send(results)
   //      })
   //  },
