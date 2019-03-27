const BookModel = require('../models/BookModel')
const WordModel = require('../models/WordModel')
const UserModel = require('../models/UserModel')
const tool = require('../utils/tool.js'),
      db_redis = require('../drives/redis.js')
const md5 = require('md5')
const fs = require('fs')

/**
 * 获取单词书列表
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getBook = async function (ctx, next) {
  let type = ctx.params.type ? ctx.params.type : null;
  let result;
  
  await BookModel.getBook({
    typeid: type,
    isShare: 1
  }, (res) => {
    result = res;
  })

  console.log(result)
  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = '-1';
  }  
}

/**
 * 获取单词书详情
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getBookDetail = async function (ctx, next) {
  let params = ctx.request.body;
  let id = params.id;
  let result;
  
  // 验证是不是它本人或者是否为公开单词本
  await BookModel.isUserBook({
    bookid: params.id,
    username: params.username
  }, (res) => {
    console.log(res)
    result = res
  })

  if(result == -1) {
    ctx.throw(403)
    return;
  }

  await BookModel.getBookDetail({
    id: id
  } ,(res) => {
    result = res;
  })

  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = '-1';
  } 
}

/**
 * 获取用户创建的单词本
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getUserBook = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  //验证token
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

  await BookModel.getUserBook({
    creator: params.username
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
 * 创建新的单词本
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let createBook = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      result;

  //验证token
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
  let path = './public/images/cover/' + name + '.png';
  let base64 = params.cover.replace(/^data:image\/\w+;base64,/, "");
  let dataBuffer = new Buffer(base64, 'base64');
  fs.writeFile(path, dataBuffer, function(err){
      if(err){
          console.log(err);
      } else {
         console.log('写入成功！');
      }
  });

  await BookModel.createBook({
    title: params.title,
    cover: 'http://localhost:3000/images/cover/' + name + '.png',
    creator: params.username,
    des: params.des,
    points: 0,
    typeid: params.typeid,
    isShare: 0,
  }, (res) => {
    result = res;
  });
  
  if(result) {
    ctx.body = result.insertId;
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取单词书的单词
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getBookWord = async function (ctx, next) {
  let params = ctx.request.body;
  let result;

  // 查看是不是它的单词本或者是公开
  await BookModel.isUserBook({
    bookid: params.id,
    username: params.username
  }, (res) => {
    result = res
  })

  if(result == 0) {
    ctx.throw(403)
    return;
  }

  await WordModel.getBookWord({
    bookid: params.id,
    start: (params.page-1) * 10,
    size: 10
  }, (res) => {
    console.log(res)
    result = res;
  });

  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 更新单词本
 * @param  {[type]} ctx    [description]
 * @param  {[type]} values [description]
 * @return {[type]}        [description]
 */
let updateBook = async function (ctx, values) {
  let params = ctx.request.body,
      isTrue,
      result;

  console.log(params)

  //验证token
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


  let name;
  if(params.cover) {
    name = md5(params.username + Date.now());
    let path = './public/images/cover/' + name + '.png';
    let base64 = params.cover.replace(/^data:image\/\w+;base64,/, "");
    let dataBuffer = new Buffer(base64, 'base64');
    fs.writeFile(path, dataBuffer, function(err){
        if(err){
            console.log(err);
        } else {
           console.log('写入成功！');
        }
    });  
  }

  await BookModel.updateBook({
    title: params.title,
    cover: name ? 'http://localhost:3000/images/cover/' + name + '.png':'',
    creator: params.username,
    des: params.des,
    points: 0,
    typeid: params.typeid,
    bookid: params.bookid,
    isShare: 0,
  }, (res) => {
    result = res;
  });
  
  if(result) {
    ctx.body = result.affectedRows;
  } else {
    ctx.body = "-1";
  }
}

/**
 * 共享单词本
 */
let shareBook = async function (ctx, values) {
  let params = ctx.request.body,
      isTrue,
      result;

  console.log(params)

  //验证token
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
  
  // 分享书籍
  await BookModel.shareBook({
    username: params.username,
    bookid: params.bookid
  }, (res) => {
    console.log(result)
    result = res;
  });
  console.log(result && result == 1)
  if(result && result == 1) {
    ctx.body = "1";
  } else {
    ctx.body = "-1";
  }
}

/**
 * 删除单词本
 * @param  {[type]} ctx    [description]
 * @param  {[type]} values [description]
 * @return {[type]}        [description]
 */
let removeBook = async function (ctx, values) {
  let params = ctx.request.body,
      isTrue,
      result;

  console.log(params)

  //验证token
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

  await BookModel.removeBook({
    bookid: params.bookid,
    username: params.username
  }, (res) => {
    result = res;
  });

  if(result) {
    ctx.body = "1"
  } else {
    ctx.body = "-1"
  }
}


module.exports = {
  getBook,
  getBookDetail,
  getUserBook,
  createBook,
  getBookWord,
  updateBook,
  shareBook,
  removeBook
}