const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');

/**
 * 获取单词书的一页单词
 * @param  {[type]} id       [单词书id]
 * @param  {[type]} size     [单词个数]
 * @param  {[type]} username [用户名]
 * @return {[type]}          []
 */
var getBookWord = function (values, callback) {
  console.log(values)
  let sql = `select id,name,meaning,kana from words where id in (select wordid from wordbelong where bookid = ?) limit ?, ?`;
  return db_mysql(sql, [values.bookid, values.start, values.size])
  .then((res)=> {
    callback(res)
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 添加单词到记忆列表
 */
var addWordRem = function (values, callback) {
  let promises = [];
  let sql;
  values.words.forEach((item, index) => {
    sql = `insert into wordremember(wordid, userid, status, createDate) values(?, ?, ?, ?)`
    promises.push(db_mysql(sql,[item.id, values.username, 0, values.date]));
  });

  return Promise.all(promises)
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 获取用户的单词
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var getUserWord = function (values, callback) {
  let sql = `select wordid, status from wordremember where userid = ?`;
  let wordid = [];
  let result;
  return db_mysql(sql, values.username)
  .then((res) => {
    if(res && res.length > 0) {
      res.forEach((item, index) => {
        wordid.push(item.wordid);
      });
      result = res;
      console.log(wordid)
      sql = `select id, name, meaning, kana from words where id in (${wordid.toString()})`;
      return db_mysql(sql)
    }
  }).then((res) => {
    if(res === null || result == null) {
    } else {
      // 处理获取单词合并到结果中。
      for(let i = 0, len_r = result.length; i < len_r; i++) {
        for(let j = 0, len_s = res.length; j < len_s; j++) {
          if(result[i].wordid == res[j].id) {
            delete res[j].id;
            result[i] = Object.assign({}, result[i], res[j]);
          }
        }
      }
    }
    callback(result);
  }).catch((err) => {
    console.log(err);
  })
}

/**
 * 处理遗留未记忆单词
 * @return {[type]} [description]
 */
let fixedRemains = function (values) {
  let sql = 'select wordid from wordremember where status = 0 and userid = ? and createDate != ? and wordid in (select wordid from wordbelong where bookid = ?)';
  return db_mysql(sql, [values.username, values.date, values.bookid])
  .then((res) => {
    if(res && res.length > 0) {
      let wordid = [];
      res.forEach((item, index) => {
        wordid.push(item.wordid);
      });
      if(wordid.length) {
       sql = `update wordremember set createDate = ? where status = 0 and userid = ? and wordid in (${wordid})`;
       return db_mysql(sql, [values.date, values.username]);
      }
    }
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 查询单词（中文）
 */
let getWordByCn = function (values, callback) {
  console.log(values)
  let sql = `select * from words where meaning like '${values.keyword}%' limit 0,3`;
  let result;
  return db_mysql(sql)
  .then((res) => {
    let wordid = [];
    result = res;
    if(result && result.length > 0) {
      result.forEach((item, index) => {
        item.sequence = [];
        wordid.push(item.id);
      });
      console.log(wordid)
      sql =  `select * from sequence where wordid in (${wordid})`;
      console.log(sql);
      return db_mysql(sql);
    }
  })
  .then((res) => {
    // 整合例句到结果中
    if(result && result.length > 0 && res && res.length > 0) {
      console.log(res);
      res.forEach((item, index) => {
        for(let i = 0, r_len = result.length; i < r_len; i++) {
          if(item.wordid === result[i].id) {
            result[i].sequence.push(item);
          }
        }
      })
    }
    callback(result);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 查询单词（日语）
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getWordByJp = function (values, callback) {
  let sql = "select * from words where name = ? or kana = ?";
  let result;
  return db_mysql(sql, [values.keyword, values.keyword])
  .then((res) => {
    console.log(res)
    if(res && res.length) {
      let wordid = [];
      result = res;
      result.forEach((item, index) => {
        item.sequence = [];
        wordid.push(item.id);
      });
      console.log(wordid)
      sql =  `select * from sequence where wordid in (${wordid})`;
      return db_mysql(sql);
    }
  })
  .then((res) => {
    // 整合例句到结果中
    if(result && result.length && res && res.length) {
      res.forEach((item, index) => {
        for(let i = 0, r_len = result.length; i < r_len; i++) {
          if(item.wordId === result[i].id) {
            result[i].sequence.push(item);
          }
        }
      })
    }
    callback(result);
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 完成了一个单词的测试
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var finishOneTest = function (values, callback) {
  let sql,status,
      wrongNum = 0, 
      testNum = 0,
      result;
  switch(values.testform) {
    case 0: sql = "select meaning as answer from words where id = ?"; 
            break;
    case 1: sql = "select roman as answer from words where id = ?"; 
            break;
  }
  return db_mysql(sql, values.wordid)
  .then((res) => {
    if(res && res.length) {
      // 判断答案的正误
      if(values.testform == 1) {
        if(res[0].answer === values.answer) {
          wrongNum = 0;
          result = 1;
        } else {
          wrongNum = 1;
          result = 0;
        }      
      } else {
        // 如果是测中文意思，就写出它的某个意思
        let answer = (res[0].answer).search('\uFF0C') >= 0 ? res[0].answer.split(/\uFF0C/) : res[0].answer.split(';');
        console.log(answer);
        if(answer.indexOf(values.answer) >= 0) {
          wrongNum = 0;
          result = 1; 
        } else {
          wrongNum = 1;
          result = 0;
        }
      }
      // 选出原有测试次数和错误次数
      sql = 'select wrongNum, testNum from wordremember where userid = ? and wordid = ?';
      return db_mysql(sql, [values.userid, values.wordid]);
    }
  })
  .then((res) => {
    // 更新单词记忆状态
    if(res && res.length) {
      sql = 'update wordremember set wrongNum = ?,testNum = ?,status = ? where userid = ? and wordid = ?';
      wrongNum += res[0].wrongNum ;
      testNum = res[0].testNum + 1;
      if(testNum < 5) {
        status = 4;
      } else {
        let cur = Math.ceil(wrongNum/testNum * 4);
        console.log(cur)
        status = cur == 0 ? 1 : cur;
      }
      return db_mysql(sql, [wrongNum, testNum, status, values.userid, values.wordid]);
    }
  })
  .then((res) => {
    callback(result);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 根据关键字获取相关单词
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getRelateWord = function (values, callback) {
  let sql = `select id,name,kana,roman,meaning from words where name like '${values.keyword}%' or kana like '${values.keyword}%' or roman like '${values.keyword}%' or meaning like '%${values.keyword}%' limit 0, 5`;
  return db_mysql(sql)
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err);
  });
}

/**
 * 向单词书里添加单词
 * @param {[type]}   values   [description]
 * @param {Function} callback [description]
 */
let addBookWord = function (values, callback) {
  // 查询单词是不是已经在里面了
  let sql = 'select count(*) as num from wordbelong where wordid = ? and bookid = ?';
  return db_mysql(sql, [values.wordid, values.bookid])
  .then((res) => {
    if(res[0].num <= 0) {
      // 插入单词
      sql = 'insert into wordbelong(wordid, bookid) values(?,?)';
      return db_mysql(sql, [values.wordid, values.bookid]);
    } else {
      return new Promise((resolve, reject) => {
        resolve(null)
      });
    }
  })
  .then((res) => {
    if(res.insertId > 0) {
      sql = 'update book set wordnum = wordnum + 1 where id = ?'
      return db_mysql(sql, values.bookid)
    } else {
      return new Promise((resolve, reject) => {
        resolve(null)
      });
    }
  })
  .then((res) => {
    if(res.affectedRows >= 1) {
      console.log(res)
      callback(1)
    } else {
      callback(2)
    }
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 根据ID获取例句
 * 1 - 官方添加
 * 0 - 网友添加
 * @param  {[type]}   values   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
let getSequence = function (values, callback) {
  let sql = 'select * from sequence where wordid = ? and status = 1 limit 0,1';
  return db_mysql(sql, values.wordid)
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 添加单词
 * @param {[type]}   values   [description]
 * @param {Function} callback [description]
 */
let addWord = function (values, callback) {
  console.log(values)
  let sql = 'insert into words(name, meaning, kana, roman, typeid) values(?,?,?,?,?)';
  let promises = [];
  
  (values.words).forEach((item, index) => {
    promises.push(db_mysql(sql, [item.name, item.meaning, item.kana, item.roman, item.typeid]))
  });
  return Promise.all(promises)
  .then((res) => {
    callback(res);
  })
  .catch((err) => {
    console.log(err);
  })
}

/**
 * 添加例句
 * @param {[type]}   values   [description]
 * @param {Function} callback [description]
 */
let addSeq = function (values, callback) {
  console.log(values)
  let sql = 'insert into sequence(wordid, origin, meaning, ref, creator,cover,status) values (?,?,?,?,?,?,0)';
  return db_mysql(sql, [values.wordid, values.orgin, values.meaning, values.ref, values.creator, values.cover])
  .then((res) => {
    if(res) {
      callback(1);
    } else {
      callback(null);
    }
  })
  .then((err) => {
    console.log(err);
  });
}

module.exports = {
  addBookWord,
  getBookWord,
  getUserWord,
  addWordRem,
  getWordByCn,
  getWordByJp,
  finishOneTest,
  fixedRemains,
  getRelateWord,
  getSequence,
  addWord,
  addSeq
}