const fs = require('fs')

const deleteFiles = (pathLocationToDelete) => {
    pathLocationToDelete.forEach((value) => {
        fs.unlink(value, function(err){
            try {
                if(err) throw err
            } catch (error) {
                console.log(error)
            }
        })
    })
}

module.exports = deleteFiles