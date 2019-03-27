var nodemailer = require('nodemailer');

var config = {
  host: 'smtp.163.com',
  port: 25,
  auth: {
    user: 'rimochiko@163.com',
    pass: 'liwei128'
  }
}

var transporter = nodemailer.createTransport(config)

module.exports = function (mail) {
  transporter.sendMail(mail, function (error, info) {
    if(error) {
      return console.log(error);
    }
    console.log('mail sent:', info.response);
  });
};