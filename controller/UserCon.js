const tool = require('../utils/tool')
const db_redis = require('../drives/redis')
const mailTool = require('../utils/email')
const md5 = require('md5')
const UserModel = require('../models/UserModel')
const PlanModel = require('../models/PlanModel')
const fs = require('fs')

/**
 * 用户登录操作
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let login = async function (ctx, next) {
  let params = ctx.request.body,
      ip = ctx.req.headers['x-forwarded-for'] ||
        ctx.req.connection.remoteAddress ||
        ctx.req.socket.remoteAddress ||
        ctx.req.connection.socket.remoteAddress,
      result;

  await UserModel.checkUserLogin({
    username: params.username,
    password: params.passwd
  }, (res) => {
    result = res;
  });

  console.log(result)
  if(result) {
    let cookies = {};
    cookies.token = tool.createToken(params.username);
    cookies.username = params.username;
    cookies.avatar = result.avatar;
    cookies.nickname = result.nickname;
    cookies.points = result.points;
    UserModel.storeUserToken(cookies);
    ctx.body = JSON.stringify(cookies);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 用户进行注册
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let register = async function (ctx, next) {
  let params = ctx.request.body,
      req = ctx.req,
      salt = tool.createSalt(),
      code = params.code,
      ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress,
      user = {
        username: params.username,
        nickname: params.username,
        salt: salt,
        passwd: tool.createPasswd(params.passwd, salt),
        email: params.email,
        sex: 1,
        birthday: tool.formatDate(new Date(1970, 1, 1), "YYYY-MM-DD"),
        des: '',
        roleId: 0,
        regTime: tool.formatDate(new Date(), "YYYY-MM-DD HH:MM:SS"),
        regIP: ip
      },
      isTrue,
      cookies = {};
  console.log("user")
  console.log(user);

  // 检查用户名是否存在
  await UserModel.checkUserName({
    username: user.username
  }, (res) => {
    if(res > 0) {
      isTrue = 0;
    } else {
      isTrue = 1;
    }
  });

  if(isTrue == 0) {
    ctx.body = '-1';
    return;
  }

  // 检查邮箱验证码
  await UserModel.getUserCode({
    email: user.email,
    code: user.code
  }, (res) => {
    if(res == 1) {
      isTrue = true
    } else {
      isTrue = false
    }    
  })

  if(isTrue) {
    ctx.body = '-1';
    return;
  }

  console.log("通过验证")

  // 开始注册
  await UserModel.createUser(user, (res) => {
    if(res == 1) {
      cookies.username = user.username;
      cookies.nickname = user.nickname;
      cookies.avatar = '';
      cookies.token = tool.createToken(user.username);
      cookies.points = 0;
      UserModel.storeUserToken(cookies);
      isTrue = 1;
    }
  })

  if(isTrue === 1) {
    ctx.body = JSON.stringify(cookies)
  } else {
    ctx.body = '-1'
  }
}

let verifyMail = async function (ctx, next) {
  let params = ctx.request.body,
      code = tool.createCode(4),
      email = params.email,
      username = params.username,
      mail = {
        from: '纳尼日语 <rimochiko@163.com>',
        subject: '来自纳尼日语的注册邮箱验证码',
        to: email,
        text: '你好，'+ username +',欢迎注册纳尼日语，你的验证码是：'+ code + '，15分钟内有效。若不是本人操作，请无视（请勿直接回复此邮件）'
      };

  // 存入数据库
  UserModel.storeUserCode({
    email: email,
    code: code
  });

  mailTool(mail);
  ctx.body = "1";
}

/**
 * 检查邮箱验证码
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let checkMail = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue;

  await UserModel.getUserCode({
    email: params.email,
    code: params.code
  }, (res) => {
    if(res == 1) {
      isTrue = true
    } else {
      isTrue = false
    }    
  })

  if(isTrue) {
    ctx.body = "1";
  } else {
    ctx.body = "-1";
  }
}

/**
 * 检查用户名是否存在
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let checkName = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue = false;
  await UserModel.checkUserName({
    username: params.username
  }, (res) => {
    if(res > 0) {
      isTrue = false;
    } else {
      isTrue = true;
    }
  })

  if(isTrue) {
      ctx.body = "1";
    } else {
      ctx.body = "-1";
  } 
}

/**
 * 获取用户的信息
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getProfile = async function (ctx, next) {
  let username = ctx.params.id;
  let result;
  await UserModel.getUserInfo({
    username: username
  }, (res) => {
    result = res;
  });

  if(result) {
   ctx.body = JSON.stringify(result);
  } else {
   ctx.body = "-1";
  }
}

/**
 * 更新用户信息
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let updateInfo = async function (ctx, next) {
  let params = ctx.request.body,
      ip = ctx.req.headers['x-forwarded-for'] ||
        ctx.req.connection.remoteAddress ||
        ctx.req.socket.remoteAddress ||
        ctx.req.connection.socket.remoteAddress,
        isTrue,
        result;

  let user = {
    username: params.username,
    nickname: params.nickname,
    sex: params.sex,
    des: params.des
  }

  console.log(user)

  // 验证Token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + user.username, function (err, reply) {
          console.log("token_" + user.username)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.body = "-1";
    return;
  }

  await UserModel.updateInfo(user, (res) => {
    result = res;
  });

  if(result) {
    ctx.body = "1";
  } else {
    ctx.body = "-1"
  }
}

/**
 * 获取学习记录
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getRecord = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;
  
  await UserModel.getRecord({
    username: params.username
  }, (res) => {
    if(res) {
      console.log(res)
      if(res) {
        res.forEach((item, index) => {
          item.dayDate = tool.formatDate(item.dayDate, "YYYY-MM-DD");
        });
      }
      result = res;
    }
  });

  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 刷新页面，重新获取用户信息
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let checkToken = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  // 验证Token  
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.body = "-1";
    return;
  }

  // 获取用户信息
  await UserModel.getUserInfo({
    username: params.username
  }, (res) => {
    result = res;
  });

  if(result) {
    let cookies = {};
    cookies.username = params.username;
    cookies.avatar = result.avatar;
    cookies.nickname = result.nickname;
    cookies.points = result.points;
    ctx.body = JSON.stringify(cookies);
  } else {
    ctx.body = "-1";
  }    
}

/**
 * 添加记录
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let addRecord = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  // 验证Token  
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.body = "-1";
    return;
  }

  let bookid;
  if(params.status == 1) {
    //获取当前的默认计划
    await PlanModel.getDefaultPlan({
      username: params.username
    }, (res) => {
      if(res) {
        bookid = res.bookid;
      }
    })    
  }
  console.log(params)

  let dayNum = params.dayNum,
      wrongNum = params.wrongNum

  if(dayNum <= 0 || wrongNum < 0 || dayNum < wrongNum) {
    ctx.body = "-1";
    return;
  }

  let points = tool.calPoints(dayNum, wrongNum);
  let date = tool.formatDate(new Date(), "YYYY-MM-DD HH:MM:SS");
  // 检查用户的积分是不是超过了上限
  let nowPoints = 0;
  await UserModel.calRecordPoint({
    username: params.username,
    dayDate: tool.formatDate(new Date(), "YYYY-MM-DD")
  }, (res) => {
    nowPoints = res;
  })

  if(nowPoints >= 100) {
    points = 0;
  }

  // 插入记录信息
  await UserModel.addRecord({
    username: params.username,
    dayDate: date,
    dayNum: dayNum,
    status: params.status,
    bookid: bookid,
    wrongNum: wrongNum,
    addPoints: points
  }, (res) => {
    result = res && res > 0 ? res: 0;
  })
  console.log("获得积分：")
  console.log(result)
  if(result) {
    ctx.body = result;
  } else {
    ctx.body = "-1";
  }    
}

/**
 * 更新头像
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let updateAvatar = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  // 验证Token  
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.body = "-1";
    return;
  }
  
  let name = md5(params.username + Date.now());
  let path = './public/images/avatar/' + name + '.png';
  let base64 = params.avatar.replace(/^data:image\/\w+;base64,/, "");
  let dataBuffer = new Buffer(base64, 'base64');
  fs.writeFile(path, dataBuffer, function(err){
      if(err){
          console.log(err);
      } else {
         console.log('写入成功！');
      }
  });

  await UserModel.updateAvatar({
    username: params.username,
    avatar: 'http://localhost:3000/images/avatar/' + name + '.png'
  }, (res) => {
    if(res) {
      isTrue = true;
    } else {
      isTrue = false;
    }
  });

  if(isTrue) {
    ctx.body = 'http://localhost:3000/images/avatar/' + name + '.png';
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取数据
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getData = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  // 验证Token  
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.body = "-1";
    return;
  }

  // 插入记录信息
  await UserModel.getData({
    username: params.username
  }, (res) => {
    result = res;
    if(result.points) {
      (result.points).forEach((item, index) => {
        item.dayDate = tool.formatDate(item.dayDate, "YYYY-MM-DD")
      })
    }
    if(result.grade) {
      (result.grade).forEach((item, index) => {
        item.createDate = tool.formatDate(item.createDate, "YYYY-MM-DD")
      })
    }
  })

  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取所有用户的记录（首页显示）
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getAllRecord = async function (ctx, next) {
  let result;
  await UserModel.getAllRecord((res) => {
    if(res && res.length) {
      res.forEach((item, index) => {
        item.dayDate = tool.formatDate(item.dayDate, "YYYY-MM-DD")
      })
    }
    result = res;
  })
  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取昨日排行
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getRank = async function (ctx, next) {
  let result;
  let date = new Date();
  date.setDate(date.getDate() - 1)
  date = tool.formatDate(date, "YYYY-MM-DD")
  await UserModel.getRank({
    date: date
  },(res) => {
    result = res;
  })
  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

module.exports = {
  login,
  register,
  verifyMail,
  checkMail,
  checkName,
  getProfile,
  updateInfo,
  getRecord,
  checkToken,
  addRecord,
  updateAvatar,
  getData,
  getAllRecord,
  getRank
}