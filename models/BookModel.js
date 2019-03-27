const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');


/**
 * 获取单词书
 * @param  {[Object]} constrait [约束条件]
 * @param  {Function} callback  [获取成功后执行的函数]
 * @return {[Promise]} [获取单词书的Promise对象]
 */
var getBook = function (constrait, callback) {
  let sql;
  if(constrait.typeid) {
    sql = 'select id,creator,title,points,typeid,studyNum,wordNum,cover from book where typeid = ? and isShare = 1 and status = 1';
  } else {
    sql = 'select id,creator,title,points,typeid,studyNum,wordNum,cover from book where isShare = 1 and status = 1'
  }
  return db_mysql(sql, constrait.typeid)
  .then(callback)
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取单词书详细页面信息
 * @param  {[Number]} id [单词书id]
 * @return {[Promise]} [单词书详细的Promise对象]
 */
var getBookDetail = function (values, callback) {
  let result = {};
  let sql_book = 'select * from book where id = ?';
  let sql_word = 'select count(*) as num from words where id in (select wordId from wordBelong where bookId = ?) limit 0,10';
  let sql_avatar = 'select username,avatar from users where username in (select username from plan where bookId = ?) limit 0,3';
  let promises = [db_mysql(sql_book, values.id), db_mysql(sql_word, values.id), db_mysql(sql_avatar, values.id)];

  return Promise.all(promises)
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 获取用户创建的单词本
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var getUserBook = async function (values, callback) {
  let sql = 'select * from book where creator = ? and status = 1';
  let result;
  return db_mysql(sql, values.creator)
  .then((res) => {
    if(res && res.length) {
      result = res;
      // 取出分类名称
      sql = 'select * from types where typeid = 1';
      return db_mysql(sql);
    }
  })
  .then((res) => {
    if(result && result.length && res && res.length) {
      result.forEach((item, index) => {
        for(let i = 0, r_len = res.length; i < r_len; i++) {
          if(item.typeid === res[i].id) {
            item.typeid = res[i].name
          }
        }
      })      
    }
    callback(result)
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 创建新的单词本
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var createBook = function (values, callback) {
  let sql = 'insert into book(title,cover,creator,des,points,typeid,isShare) values(?,?,?,?,?,?,?)';
  return db_mysql(sql, [values.title, values.cover, values.creator, values.des, values.points, values.typeid, 0])
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err)
  })
}

/**
 * 查询单词书的创建人
 * @type {Object}
 */
let getBookCreator = function (values, callback) {
  let sql = 'select creator from book where id = ?';
  return db_mysql(sql, values.bookid)
  .then((res) => {
    callback(res[0].creator);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 删除单词本
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let removeBook = function (values, callback) {
  // 移除书籍
  let sql = 'update book set status = 0 where id = ? and creator = ? and isShare = 0';
  return db_mysql(sql, [values.bookid, values.username])
  .then((res) => {
    // 移除单词关系
    sql = 'delete from wordBelong where bookid = ?';
    return db_mysql(sql, values.bookid)
  })
  .then((res) => {
    // 移除计划
    sql = 'delete from plan where bookid = ?'
    return db_mysql(sql, values.bookid)
  })
  .then((res) => {
    // 移除相关记录
    sql = 'delete from record where bookid = ?'
    return db_mysql(sql, values.bookid)
  })
  .then((res) => {
    console.log(res)
    callback(res)
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 更新书本内容
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let updateBook = function (values, callback) {
  let sql;
  let constrait;
  if(values.cover) {
    sql = 'update book set title = ?, cover = ? , des = ? , typeid = ? where id = ? and creator = ?';
    constrait = [values.title, values.cover, values.des, values.typeid, values.bookid, values.username];
  } else {
    sql = 'update book set title = ?, des = ? , typeid = ? where id = ? and creator = ?';
    constrait = [values.title, values.des, values.typeid, values.bookid, values.creator];
  }
  console.log(sql)
  return db_mysql(sql, constrait)
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 共享单词书内容
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let shareBook = function (values, callback) {
  let points = 0;
  let sql = 'select points from users where username = ?';
  return db_mysql(sql, values.username)
  .then((res) => {
    if(res && res[0]) {
      points = res[0].points;
    }
    // 如果积分足够
    if(points >= 100) {
      points -= 100;
      sql = 'update book set isShare = 1 where id = ? and creator = ?';
      return db_mysql(sql, [values.bookid, values.username]);
    }
  })
  .then((res) => {
    if(res.affectedRows > 0) {
      sql = 'update users set points = ? where username = ?';
      return db_mysql(sql, [points, values.username])
    }
  })
  .then((res) => {
    if(res) {
      callback(1);
    } else {
      callback(-1);
    }
  })
  .catch((err) => {
    console.log(err)
  });
}


/**
 * 是否为用户的单词本
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {Boolean}           [description]
 */
let isUserBook = function (values, callback) {
  let sql = 'select creator,isShare from book where id = ? and status = 1';
  return db_mysql(sql, values.bookid)
  .then((res) => {
    if(res && res.length) {
      if(res[0].isShare == 1) {
        callback(1)
      } else if(res[0].creator == values.username){
        callback(1)
      } else {
        callback(-1)
      }
    } else {
      callback(-1)
    }
  })
}

module.exports = {
  getBook,
  getBookDetail,
  getUserBook,
  createBook,
  getBookCreator,
  removeBook,
  updateBook,
  shareBook,
  isUserBook
}