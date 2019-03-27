var tool = require('../utils/tool.js');
const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');

/**
 * 添加新用户
 * @param  {[Object]} user [用户信息]
 * @return {[Promise]}      [description]
 */
let createUser = function (user, callback) {
  let sql = `insert into users(username, nickname, salt, passwd, email, sex, birthday, roleId, regTime, regIP, status) 
  values('${user.username}','${user.nickname}','${user.salt}','${user.passwd}','${user.email}',${user.sex},'${user.birthday}',${user.roleId},'${user.regTime}','${user.regIP}', 1)`
  return db_mysql(sql)
  .then((res) => {
    if(res.affectedRows > 0) {
      callback(1)
    }
    else {
      callback(-1)
    }
  })  
  .catch((err) => {
  	console.log(err)
  })
}

/**
 * 检查用户名是否存在
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let checkUserName = function (values, callback) {
  let sql = `select count(*) as num from users where ?`;
  console.log(values)
  return db_mysql(sql, values)
  .then((res) => {
    callback(res[0].num)
  })
  .catch((err) => {
  	console.log(err)
  })
}

/**
 * 验证用户登录
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let checkUserLogin = function (values, callback) {
  console.log(values)
  // 提取出密码盐进行加密
  let sql = `select salt from users where username = ?`;
  return db_mysql(sql, values.username)
  .then((res) => {
    if(res != null) {
      let salt = res[0].salt,
          password = tool.createPasswd(values.password, salt);
      sql = `select avatar,nickname,points from users where username = ? and passwd = ?`;
      return db_mysql(sql, [values.username, password])
    } else {
      resolve(null)
    }
  }).then((res)=> {
    if(res.length > 0) {
      callback(res[0]);
    } else {
      callback(null);
    }
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 检查注册验证码
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let checkEmailCode = function (values, callback) {
  let key = "code_" + values.email.replace(/\W/g,'');
  return new Promise(function(resolve, reject) {
    let key = "code_" + values.email.replace(/\W/g,'');
    db_redis.get(key, function (err, reply) {
      if(reply && reply == values.code) {
        resolve(1);
      } else {
        resolve(-1);
      }
    })
  })
  .then((res)=> {
    callback(res)
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取用户信息
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getUserInfo = function (values, callback) {
  let sql = `select id,username, nickname,sex,birthday,des,points,avatar from users where ?`
  return db_mysql(sql, values)
  .then((res)=> {
    if(res) {
      callback(res[0])
    } else {
      callback(null)
    }
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 存储用户Token
 * @param  {[type]} cookies [description]
 * @return {[type]}         [description]
 */
let storeUserToken = function (values) {
  db_redis.set("token_" + values.username, values.token, 'EX', 3600);
}

/**
 * 存储邮箱验证码
 * @param  {[type]} cookies [description]
 * @return {[type]}         [description]
 */
let storeUserCode = function (values) {
  let key = "code_" + values.email.replace(/\W/g,'');
  db_redis.set(key , values.code, 'EX', 3600);
}

/**
 * 验证邮箱验证码
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getUserCode = function (values, callback) {
  return new Promise(function(resolve, reject) {
    let key = "code_" + values.email.replace(/\W/g,'');
    db_redis.get(key, function (err, reply) {
      if(reply && reply == values.code) {
        resolve(1)
      } else {
        resolve(-1)
      }
    })
  }).then((res)=> {
    callback(res)
  })
}

/**
 * 更新用户信息
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let updateInfo = function (values, callback) {
  let sql = `update users set nickname = ?,sex = ?,des = ? where username = ?`;
  console.log(sql , values)
  return db_mysql(sql, [values.nickname, values.sex, values.des, values.username])
  .then((res)=> {
    callback(res)
  })
  .catch((err) => {
    cosnole.log(err);
  })
}

/**
 * 更新用户头像
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let updateAvatar = function (values, callback) {
  let sql = 'update users set avatar = ? where username = ?';
  return db_mysql(sql, [values.avatar, values.username])
  .then((res) => {
    callback(1)
  })
  .catch((err) => {
    callback(0)
  })
}

/**
 * 获取用户的学习记录
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getRecord = function(values, callback) {
  let sql = `select * from record where username = ? order by dayDate desc`;
  let bookid = [],result;
  return db_mysql(sql, values.username)
  .then((res)=> {
    console.log(res)
    if(res && res.length) {
      result = res;
      res.forEach((item, index) => {
        if(item.bookid != null && bookid.indexOf(item.bookid) < 0) {
          bookid.push(item.bookid);
        }
      });
      sql = `select id,title from book where id in (${bookid})`;
      return db_mysql(sql);
    }
  })
  .then((res) => {
    if(result && result.length && res && res.length) {
      result.forEach((item, index) => {
        for(let i = 0,r_len = res.length; i < r_len ; i++) {
          if(item.bookid == res[i].id) {
            item.title = res[i].title;
            break;
          }
        }
      });
      callback(result);
    } else {
      callback(null);
    }
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 添加用户的学习记录
 * @param {[type]}   values   [description]
 * @param {Function} callback [description]
 */
var addRecord = function (values, callback) {
  let sql = 'insert into record(username,dayDate,dayNum,status,bookid,des,wrongNum,addPoints) values(?,?,?,?,?,?,?,?)';
  let points = 0;
  return db_mysql(sql, [values.username, values.dayDate, values.dayNum, values.status, values.bookid, values.des, values.wrongNum, values.addPoints])
  .then((res) => {
    // 添加用户积分
    console.log(values)
    points = values.addPoints;
    sql = 'select points from users where username = ?';
    return db_mysql(sql, values.username);
  })
  .then((res) => {
    if(res && res[0]) {
      points += res[0].points;
    }
    sql = 'update users set points = ? where username = ?';
    console.log(points)
    return db_mysql(sql, [points, values.username]);
  })
  .then((res) => {
    console.log(points)
    callback(points);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取测试的情况
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getTestStatus = function (values, callback) {
  let sql = 'select dayNum, wrongNum from record where username = ? and dayDate = ? and bookid= ?';
  let testCount = 0,grade = 0;
  return db_mysql(sql, [values.username, values.date, values.bookid])
  .then((res) => {
    if(res && res.length) {
      res.forEach((item, index) => {
        testCount++;
        grade += (item.wrongNum / item.dayNum);
      });
      // 坑
      grade = Math.floor((1-(grade / testCount))*100);
    }
    callback({
      testCount: testCount,
      grade: grade
    });
  })
  .catch((err) => {
    console.log(err)
  })
}

/**
 * 获取统计数据
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getData = function (values, callback) {
  let result = {};
  let sql = 'select dayDate, sum(addPoints) as points from record where username = ? group by dayDate order by dayDate asc';
  return db_mysql(sql, values.username)
  .then((res) => {
    console.log(res)
    result.points = res;
    sql = 'select createDate, sum(wrongnum) as wrong, sum(testnum) as count from wordremember where userid = ? group by createDate order by createDate asc';
    return db_mysql(sql, values.username)
  })
  .then((res) => {
    result.grade = res;
    callback(result)
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取首页的显示记录
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getAllRecord = function (callback) {
 let sql = 'select * from record order by dayDate desc limit 0, 10';
 let result = {};
 let userid = [];
 let bookid = [];
 return db_mysql(sql)
 .then((res) => {
   if(res && res.length) {
     result = res;
     res.forEach((item, index) => {
       if(userid.indexOf(item.username) < 0) {
         userid.push("'"+item.username+"'")
       }
     });
     res.forEach((item, index) => {
       if(item.bookid != null && bookid.indexOf(item.bookid) < 0) {
         console.log(item.bookid)
         bookid.push(item.bookid)
       }
     });
     console.log(bookid)
     sql = `select username, nickname, avatar from users where username in (${userid})`;
     return db_mysql(sql)
   }
 })
 .then((res) => {
   if(res && res.length && result && result.length) {
     result.forEach((item, index) => {
       for(let i = 0, r_len = res.length; i < r_len; i++) {
         if(item.username == res[i].username) {
           item.nickname = res[i].nickname;
           item.avatar = res[i].avatar;
           break;
         }
       }
     });
   }
   sql = `select id, title from book where id in (${bookid})`
   return db_mysql(sql)
 })
 .then((res) => {
  if(res && res.length && result && result.length) {
    result.forEach((item, index) => {
      for(let i = 0, r_len = res.length; i < r_len; i++) {
        if(item.bookid == res[i].id) {
          item.title = res[i].title;
          break;
        }
      }
    });
    callback(result);
  } else {
    callback(null);
  }
 })
 .catch((err) => {
  console.log(err);
 })
}

/**
 * 获取
 * @param  {[type]}   value    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getRank = function (values, callback) {
  let sql = 'select username,sum(addPoints) as points from record where dayDate = ? group by username order by points desc limit 0,10';
  let result;
  let userid = [];
  return db_mysql(sql, values.date)
  .then((res) => {
    console.log(res)
    if(res && res.length) {
      result = res;
      res.forEach((item, index) => {
        if(userid.indexOf(item.username) < 0) {
          userid.push("'"+item.username+"'")
        }
      });
      sql = `select username, nickname, avatar from users where username in (${userid})`;
      return db_mysql(sql)
    }
  })
 .then((res) => {
   console.log(res)
   if(res && res.length && result && result.length) {
     result.forEach((item, index) => {
       for(let i = 0, r_len = res.length; i < r_len; i++) {
         if(item.username == res[i].username) {
           item.nickname = res[i].nickname;
           item.avatar = res[i].avatar;
           break;
         }
       }
     });
     callback(result)
   } else {
     callback(null)
   }
 })
 .catch((err) => {
   console.log(err);
 })
}

/**
 * 计算今日记录获取积分
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let calRecordPoint = function (values, callback) {
  let sql = 'select sum(addPoints) as num from record where username = ? and dayDate = ?';
  return db_mysql(sql, [values.username, values.dayDate])
  .then((res) => {
    callback(res[0].num)
  })
  .catch((err) => {
    console.log(err)
  })
}

module.exports = {
  createUser,
  checkUserLogin,
  checkUserName,
  checkEmailCode,
  getUserInfo,
  getUserCode,
  storeUserToken,
  storeUserCode,
  updateInfo,
  updateAvatar,
  getRecord,
  addRecord,
  getTestStatus,
  getData,
  getAllRecord,
  getRank,
  calRecordPoint
}
