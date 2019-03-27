var tool = require('../utils/tool.js');
const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');

const WordModel = require('../models/WordModel'),
      BookModel = require('../models/BookModel')
const md5 = require('md5'),
      fs = require('fs');

/**
 * 获取用户拥有的单词
 */
let getWord = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue = false,
      result;
  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    throw(401)
    return;
  }
  console.log(params);
  // 获取单词
  await WordModel.getUserWord({
    username: params.username
  }, (res) => {
    if(res == null) {
      isTrue = false;
    } else {
      result = res;
    }
  });

  if(isTrue) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 查询单词（日语）
 */
let searchWordByJ = async function (ctx, next) {
  let params = ctx.params,
      isTrue = false,
      result = [],
      keyword = params.keyword;

  await WordModel.getWordByJp({
    keyword: keyword
  }, (res) => {
    // 处理拿到的单词，进行一个分组合并
    if(res && res.length) {
      for(let i = 0, r_len = res.length; i < r_len ; i++) {
        let item;
        item = Object.assign({}, res[i]);
        item.sub = [{
          id: res[i].id,
          meaning: res[i].meaning,
          sequence: res[i].sequence
        }];
        delete item.meaning;
        delete item.sequence;
        for(let j = i + 1; j < r_len; j++) {
          // 如果是同一个词语不同的意思
          if(res[i].name === res[j].name && res[i].kana === res[j].kana) {
             let sub = {
              id: res[j].id,
              meaning: res[j].meaning,
              sequence: res[j].sequence
             };
             item.sub.push(sub);
             // 如果都是同一个意思
             if(j + 1 == r_len) {
               i = j;
             }
          } else {
            i = j;
            break;
          }
          console.log(i);
        }
        result.push(item);
      }
    }
  });
  ctx.body = JSON.stringify(result);
}

/**
 * 查询单词（中文）
 */
let searchWordByC = async function (ctx, next) {
  let params = ctx.params,
      isTrue = false,
      result = [],
      keyword = params.keyword;

  await WordModel.getWordByCn({
    keyword: keyword
  }, (res) => {
    // 处理拿到的单词，进行一个分组合并
    if(res && res.length) {
      for(let i = 0, r_len = res.length; i < r_len ; i++) {
        let item;
        item = Object.assign({}, res[i]);
        item.sub = [{
          id: res[i].id,
          meaning: res[i].meaning,
          sequence: res[i].sequence
        }];
        delete item.meaning;
        delete item.sequence;
        for(let j = i + 1; j < r_len; j++) {
          // 如果是同一个词语不同的意思
          if(res[i].name === res[j].name && res[i].kana === res[j].kana) {
             let sub = {
              id: res[j].id,
              meaning: res[j].meaning,
              sequence: res[j].sequence
             };
             item.sub.push(sub);
             // 如果都是同一个意思
             if(j + 1 == r_len) {
               i = j;
             }
          } else {
            i = j;
            break;
          }
          console.log(i);
        }
        result.push(item);
      }
    }
  });
  ctx.body = JSON.stringify(result);
}

/**
 * 用户完成一个单词的一次测试
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let finishOneTest = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue = false,
      result;
  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(true)
          } else {
            reject(false)
          }
    })    
  })
  .then(res => {
    isTrue = true;
  })
  .catch((err) => {
    isTrue = false;
  })

  if(!isTrue) {
    ctx.throw(401)
    return;
  }
  
  // 判断正误
  await WordModel.finishOneTest({
    userid: params.username,
    wordid: params.wordid,
    answer: params.answer,
    testform: params.testform
  }, (res) => {
    if(res) {
      result = res;
    }
  });
  
  if(result) {
    ctx.body = result;
  } else {
    ctx.body = "-1";
  }
}

/**
 * 根据关键字获取相关单词
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getRelateWord = async function (ctx, next) {
  let params = ctx.params,
      isTrue = false,
      result,
      keyword = params.keyword;

  await WordModel.getRelateWord({
    keyword: keyword
  },(res) => {
    result = res;
  });

  if(result) {
    ctx.body = JSON.stringify(result);
  } else{
    ctx.body = '-1';
  }
}

/**
 * 向单词本中添加单词
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let addBookWord = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue = false,
      result;
  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    throw(401)
    return;
  }

  //判断单词书ID是否和创作者一样
  await BookModel.getBookCreator({
    bookid: params.bookid
  }, (res) => {
    result = res;
  });

  // 如果作者不相等
  if(result != params.username) {
    ctx.body = '-1';
    return;
  }
  
  console.log("参数：")
  console.log(params)

  // 插入单词到单词书中
  await WordModel.addBookWord({
    wordid: params.wordid,
    bookid: params.bookid
  }, (res) => {
    result = res;
  });

  if(result) {
    ctx.body = result;
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取指定单词的例句
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getSequence = async function (ctx, next) {
  let params = ctx.params,
      isTrue = false,
      result,
      id = params.id;

  await WordModel.getSequence({
    wordid: id
  },(res) => {
    result = res;
  });

  if(result) {
    ctx.body = JSON.stringify(result);
  } else{
    ctx.body = '-1';
  }
}

/**
 * 添加新单词
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let addWord = async function (ctx, next) {
  let params = ctx.request.body,
      words = params.words;

  console.log(words);
  await WordModel.addWord({
    words: words
  }, (res) => {
    console.log(res);
  })
  ctx.body = "1";
}

/**
 * 添加例句
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let addSeq = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue = false,
      result;
  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          if(reply && reply === params.token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  })
  .then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    ctx.throw(401)
    return;
  }

  let name;
  if(params.cover) {
    name = md5(params.wordid + Date.now());
    let path = './public/images/seq/' + name + '.png';
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
  // 添加例句
  await WordModel.addSeq({
    wordid: params.wordid,
    orgin: params.orgin,
    meaning: params.meaning,
    ref: params.ref,
    cover: name ? 'http://localhost:3000/images/seq/' + name + '.png' : '',
    creator: params.username
  }, (res) => {
    result = res;
  });

  if(result) {
    ctx.body = "1";
  } else {
    ctx.body = "-1";
  }
}

module.exports = {
  getWord,
  searchWordByJ,
  searchWordByC,
  finishOneTest,
  getRelateWord,
  addBookWord,
  getSequence,
  addWord,
  addSeq
}