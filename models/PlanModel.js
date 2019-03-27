const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');
const tool = require('../utils/tool');

/**
 * 获取用户所有计划
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getAllPlan = function (values, callback) {
  let sql = `select id, bookid, username, createDate, dayNum, studyNum from plan where ?`;
  let result = {};
  let bookids = [];
  let promises = [];
  return db_mysql(sql, values)
  .then((res) => {
    if(res && res.length) {
      result = res;
      sql = 'select count(*) as num from wordremember where userid = ? and wordid in (select wordid from wordbelong where bookid = ?)';
      res.forEach((item, index) => {
        bookids.push(item.bookid);
        promises.push(db_mysql(sql, [values.username, item.bookid]))
      })
      // 选出所有计划的书的信息
      sql = `select id, title, wordnum, cover from book where id in (${bookids.toString()})`;
      return db_mysql(sql)
    }
  })
  .then((res) => {
    if(res && res.length) {
      for(let i = 0, len_r = res.length; i < len_r; i++) {
        for(let j = 0, len_i = result.length; j < len_i; j++) {
          if(res[i].id === result[j].bookid) {
            delete res[j].id;
            result[j] = Object.assign({} , result[j], res[i])
          }
        }
      }
      // 计算所有计划的进度
      return Promise.all(promises);
    }
  })
  .then((res) => {
    console.log(res)
    if(res) {
      for(let i = 0, len_r = res.length; i < len_r; i++) {
        result[i].num = res[i][0].num;
      }      
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
 * 获取用户默认计划
 * @return {[type]} [description]
 */
let getDefaultPlan = function (values, callback) {
  let sql = `select id, bookid, createDate, dayNum from plan where username = ? and status = 1`;
  return db_mysql(sql,values.username)
  .then((res)=> {
    if(res) {
      callback(res[0])
    } else {
      callback(null)
    }
  })
  .catch((err) => {
    console.log(err)
  });
}

/**
 * 添加计划
 */
let addPlan = function (info, callback) {
  // 查询该单词书是不是已经有过一个计划了
  let sql = 'select count(*) as num from plan where username = ? and bookid = ?';
  let count, status;
  return db_mysql(sql, [info.username, info.bookid])
  .then((res) => {
    if(res[0].num <= 0) {
      // 查询是否有默认的计划（status = 1）
      sql = 'select count(*) as num from plan where status = 1 and username = ?';
      return db_mysql(sql, info.username)
    } else {
      return new Promise((resolve, reject) => {
        resolve(null);
      });
    }
  })
  .then((res)=> {
    if(res) {
      if(res[0].num > 0) {
        status = 0;
      } else {
        status = 1;
      }
      // 插入计划
      sql = `insert into plan(bookid, username, createDate, dayNum, status) values (?,?,?,?,?)`;
      return db_mysql(sql, [info.bookid, info.username, info.createDate, info.dayNum, status])      
    }
  })
  .then((res) => {
    // 更新单词本的学习人数
    if(res) {
      sql = `select studyNum from book where id = ?`;
      return db_mysql(sql, info.bookid);
    }
  })
  .then((res) => {
    if(res) {
      count = res[0].studyNum + 1;
      sql = 'update book set studyNum = ? where id = ?';
      return db_mysql(sql, [count, info.bookid]);
    }
  })
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err)
  })
}

/**
 * 获取对应的任务
 * @param  {[type]}            [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getTodayPlan = function (values, callback) {
  console.log(values)
  // 假设values传来的是用户的ID，以及书籍的ID，以及数量
  let result = {},
      words = [];
  // 查询以前的留下的没有记忆的单词
  let sql = `select count(*) as num from wordremember where userid = ? and createDate = ? and wordid in (select wordid from wordbelong where bookid = ?)`;
  return db_mysql(sql, [values.username, values.date, values.bookid])
  .then((res) => {
    console.log(res);
    if(res[0].num == 0) {
      // 第一次学习，获取指定数目个单词
      console.log("第一次学习，获取指定数目个单词");
      console.log(values.bookid, values.username, values.size);
      result.isFirst = true;
      sql = `select * from words where id in (select wordid from wordbelong where bookid = ?) and id not in (select wordid from wordremember where userid = ?) limit 0, ?`;
      return db_mysql(sql, [values.bookid, values.username, values.size])
    } else {
      //console.log(res);
      result.isFirst = false;
      result.words = res;
      // 获取已经学习的单词
      sql = `select * from words where id in (select wordid from wordbelong where bookid = ?) and id in (select wordid from wordremember where userid = ? and createDate = ?)`;
      return db_mysql(sql, [values.bookid, values.username, values.date])
    }   
  })
  .then((res) => {
    console.log(res);
    result.words = res;
    // 获取单词的词性
    sql = 'select id, name from types where typeid = 2';
    return db_mysql(sql, values.typeid);
  })
  .then((res) => {
    result.words.forEach((item, index) => {
      for(let i = 0, r_len = res.length; i < r_len; i++) {
        if(item.typeid == res[i].id) {
          item.typeid = res[i].name;
          break;
        }
      }
    });
    // 获取书籍的标题
    sql = `select title from book where id = ?`;
    return db_mysql(sql, values.bookid);
  })
  .then((res) => {
    result.title = res[0].title;
    callback(result);
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 获取今日要复习的单词
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getTodayReview = function (values, callback) {
  // 选出上一次记单词的日期
  let sql = 'select createDate from wordremember where userid = ? group by createDate desc limit 0, 2';
  let word;
  return db_mysql(sql, values.username)
  .then((res) => {
    if(res && res.length >= 2) {
      let date = tool.formatDate(res[1].createDate, "YYYY-MM-DD")
      // 寻找上一次记单词的所有单词，和原来等级是4的单词。
      sql = 'select * from words where id in (select wordid from wordremember where (createDate=? and userid =?) or (status = 4 and createDate!=? and userid=?))';
      return db_mysql(sql, [date, values.username, values.date, values.username])
    }
  })
  .then((res) => {
    if(res && res.length) {
      word = res;
      // 单词词性
      sql = 'select id, name from types where typeid = 2';
      return db_mysql(sql, values.typeid);
    }
  })
  .then((res) => {
    if(word) {
      word.forEach((item, index) => {
        for(let i = 0; i < res.length; i++) {
          if(item.typeid == res[i].id) {
            item.typeid = res[i].name;
          }
        }
      })
    }
    callback(word);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取复习的次数
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getReviewCount = function (values, callback) {
  let sql = 'select dayNum,wrongNum from record where username = ? and status = 2 and dayDate = ?';
  let result = {
    testCount: 0,
    grade: 0
  };
  return db_mysql(sql, [values.username, values.date])
  .then((res) => {
    console.log("Review")
    console.log(res)
    if(res && res.length) {
      result.testCount = res.length;
      let grade = 0;
      res.forEach((item, index) => {
        grade+=(item.wrongNum / item.dayNum);
      });
      grade = Math.floor((1 - (grade / result.testCount))*100);
      result.grade = grade;
      callback(result);
    } else {
      callback(result);
    }
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 设置默认计划
 * @param {[type]}   values   [description]
 * @param {Function} callback [description]
 */
let setDefaultPlan = function (values, callback) {
  // 取消原来的默认标记
  let sql = 'update plan set status = 0 where username = ? and status = 1';
  return db_mysql(sql, values.username)
  .then((res) => {
    sql = 'update plan set status = 1 where username = ? and id = ?';
    return db_mysql(sql, [values.username, values.planid])
  })
  .then((res) => {
    console.log(res)
    callback(res)
  })
  .catch((err) => {
    console.log(err)
  });
}

/**
 * 修改计划
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let updatePlan = function (values, callback) {
  let sql = 'update plan set dayNum = ? where username = ? and id = ?';
  return db_mysql(sql, [values.num, values.username, values.planid])
  .then((res) => {
    console.log(res)
    callback(res)
  })
  .catch((err) => {
    console.log(err)
  })
}

/**
 * 计算计划结束的日期
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let calPlan = function (values, callback) {
  let sql = 'select bookid from plan where username = ? and id = ?';
  let result = {};
  return db_mysql(sql, [values.username, values.planid])
  .then((res) => {
    if(res && res[0]) {
      result.bookid = res[0].bookid;
      sql = 'select count(*) as num from wordbelong where bookid = ?';
      return db_mysql(sql, result.bookid);
    }
  })
  .then((res) => {
    if(res && res[0]) {
      result.allNum = res[0].num;
      sql = 'select count(*) as num from wordremember where userid = ? and wordid in (select wordid from wordbelong where bookid = ?)';
      return db_mysql(sql, [values.username, result.bookid]);
    }
  })
  .then((res) => {
    if(res && res[0]) {
      result.readyNum = res[0].num;
      callback(result);
    }
  })
}

module.exports = {
  getAllPlan,
  addPlan,
  getDefaultPlan,
  getTodayPlan,
  getTodayReview,
  getReviewCount,
  setDefaultPlan,
  updatePlan,
  calPlan
}