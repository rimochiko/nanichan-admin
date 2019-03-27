var mysql = require('mysql');
var config = require('../config/default.js');
var pool = mysql.createPool({
  host: config.database.HOST,
  user: config.database.USERNAME,
  password: config.database.PASSWORD,
  database: config.database.DATABASE
});

let query = function (sql, values) {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if(err) {
        resolve(err)
      } else {
        connection.query(sql, values, (err, rows) => {
          if(err) {
            console.log(err)
            reject(-1);
          } else {
            if(rows)
             resolve(rows);
            else
              resolve(1)
          }
          connection.release()
        })
      }
    })
  })
}

module.exports = query