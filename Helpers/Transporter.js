const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ichajust2@gmail.com', // Email Sender
        pass: 'wjzwtogkjqxkngyh' // Key Generate
    },
    tls: {
        rejectUnauthorized: false
    }
})

module.exports = transporter