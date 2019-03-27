const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');
      
/**
 * 获取单词书分类（type=1）
 * @return {[Array]} [单词书分类结果]
 */
var getBookType = function (callback) {
  let sql = 'select * from types where typeid = 1';
  return db_mysql(sql)
  .then((res)=> {
    callback(res)
  })
}

module.exports = {
  getBookType
}