// Import Multer
const multer = require('multer')

const multipleUpload = () => {
    // Setting Multer
    // 1. Disk Storage & Filename
    let storage = multer.diskStorage({
        destination: function(req, file, next){
            next(null, 'Public')
        },
        filename: function(req, file, next){
            next(null, 'PIMG' + '-' + Date.now() + Math.round(Math.random() * 1000000000) + '.' + file.mimetype.split('/')[1]) // [image, png]
        }
    })

    // 2. File Filter
    function fileFilter(req, file, next){
        console.log(file.mimetype)
        if(file.mimetype.split('/')[0] === 'image'){
            // Accept
            next(null, true)
        }else if(file.mimetype.split('/')[0] !== 'image'){
            // Reject
            next(new Error('File Must Be Image'))
        }
    }

    let multipleUpload = multer({storage: storage, fileFilter: fileFilter, limits:{ fileSize: 20000 }}).array('images', 3) // fileSize satuan byte

    return multipleUpload
}

module.exports = multipleUpload