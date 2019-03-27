const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');


for(let i = 272; i <=289 ;i++) {
	let sql = 'insert into wordbelong(wordid, bookid) values(?, 1)';
	db_mysql(sql, i)
	.then((res) => {
		console.log("插入一条"+i)
	})
}