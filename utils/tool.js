function asciiToChar (num) {
  return String.fromCharCode(num);
}

const md5 = require('md5')
const jwt = require('jsonwebtoken')
/**
 * 创建一个token
 * @param {String} [user_id] [用户的ID]
 * @return token
 */
var createToken = function (user_id) {
  const token = jwt.sign({
    user_id: user_id
  }, 'mochi', {
    expiresIn: '1h'
  });
  console.log("token:" + token);
  return token;
}

/**
 * 创建一个盐
 * @return {[String]} [盐]
 */
var createSalt = function () {
  let salt = ""
  for(let i = 0; i < 10; i++) {
    let type = Math.ceil(Math.random()*3);
    switch(type) {
      case 1: salt += asciiToChar(Math.floor(48 + Math.random()*9))
              break;
      case 2: salt += asciiToChar(Math.floor(97 + Math.random()*25))
              break;
      case 3: salt += asciiToChar(Math.floor(65 + Math.random()*25))
    }
  }
  console.log("salt:" + salt);
  return salt;
}

/**
 * 创建密码
 * @return {[String]} [密码]
 */
var createPasswd = function(passwd, salt) {
  return md5(md5(passwd) + salt);
}

/**
 * 创建随机验证码
 * @return {[String]} [验证码]
 */
var createCode = function (num) {
  let res = "";
  for(let i = 0; i < num; i++) {
    res += parseInt(Math.random()*9);
  }
  console.log("code:" + res);
  return res;
}


/**
 * 格式化日期
 * @return {[String]} [日期字符串]
 */
var formatDate = function (date, format) {
  let year = date.getYear() + 1900;
  let month = date.getMonth() + 1;
  let day = date.getDate();
  let hour = date.getHours();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  if(format == "YYYY-MM-DD HH:MM:SS") {
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } else if(format == "YYYY-MM-DD") {
    return `${year}-${month}-${day}`;
  }
}

/**
 * 计算添加积分
 * @param  {[type]} dayNum   [description]
 * @param  {[type]} wrongNum [description]
 * @return {[type]}          [description]
 */
var calPoints = function (dayNum, wrongNum) {
  if(dayNum <= 0 || wrongNum < 0) {
    return 0;
  }

  let points = 0;
  if(dayNum >= 30) {
    points = 10;
    points += Math.floor((1 - (wrongNum/dayNum)) * 10);
  } else if(dayNum >= 20) {
    points = 5;
    points += Math.floor((1 - (wrongNum/dayNum)) * 10);
  } else {
    points = dayNum;
  }
  return points;
}


module.exports = {
  createToken,
  createSalt,
  formatDate,
  createPasswd,
  createCode,
  calPoints
};