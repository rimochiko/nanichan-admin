const db_mysql = require('../drives/mysql.js'),
      db_redis = require('../drives/redis.js');
const PlanModel = require('../models/PlanModel');
const BookModel = require('../models/BookModel');
const WordModel = require('../models/WordModel');
const UserModel = require('../models/UserModel');
const tool = require('../utils/tool');

/**
 * 添加新计划
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let addPlan = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue;

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

  console.log(params)

  let info = {
    bookid: params.planid,
    username: params.username,
    createDate: tool.formatDate(new Date(), "YYYY-MM-DD HH:MM:SS"),
    dayNum: params.plannum
  }

  //查询是否有默认计划
  await PlanModel.getDefaultPlan({
  	username: info.username
  }, (res) => {
    if(res) {
      info.status = 0;
    } else {
      info.status = 1;
    }  	
  });
  
  //添加计划
  await PlanModel.addPlan(info, (res) => {
    isTrue = true;
  });

  if(isTrue) {
    ctx.body = "1";
  } else {
    ctx.body = "-1"
  }
}

/**
 * 获取今日计划/任务
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getTodayPlan = async function (ctx, next) {
  let params = ctx.request.body,
      isTrue,
      plan = {},
      date = tool.formatDate(new Date(), "YYYY-MM-DD");

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + params.username, function (err, reply) {
          console.log("token_" + params.username)
          console.log(reply)
          if(reply && reply === params.token) {
            resolve(1)
          } else {
            resolve(-1)
          }
    })    
  }).then(res => {
    console.log(res)
    isTrue = res;
  })

  if(isTrue == -1) {
    ctx.throw(401);
    return;
  }

  //查询是否有默认计划
  await PlanModel.getDefaultPlan({
  	username: params.username
  }, (res) => {
  	if(res) {
      plan.bookid = res.bookid;
      plan.num = res.dayNum;
    }
  })
  console.log("plan")
  console.log(plan)

  if(!plan.bookid) {
    ctx.body = "-1";
    return;
  }

  // 处理历史遗留单词
  await WordModel.fixedRemains({
    bookid: plan.bookid,
    date: date,
    username: params.username    
  })

  // 获取今日测试情况
  await UserModel.getTestStatus({
    bookid: plan.bookid,
    date: date,
    username: params.username    
  }, (res) => {
    if(res) {
      plan.testCount = res.testCount;
      plan.grade = res.grade;
    }
  })
  
  // 获取今日单词
  await PlanModel.getTodayPlan({
    bookid: plan.bookid,
    date: date,
    username: params.username,
    size: plan.num
  }, (res) => {
     plan = Object.assign({}, plan, res);
  });

  // 若第一次，插入获取单词到记忆表
  if(plan.isFirst) {
    await WordModel.addWordRem({
      id: plan.bookid,
      username: params.username,
      date: date,
      words: plan.words
    });    
  }

  // 计算出需要学习的单词个数
  let remReady = [],
      allRem = plan.words? plan.words.length : 0;
  plan.words.forEach((item, index) => {
    if(item.status != 0) {
      remReady.push(item.id);
    }
  });
  plan.num = allRem;
  plan.remReady = remReady;

  if(plan) {
    ctx.body = JSON.stringify(plan)
  } else {
    ctx.body = "-1"
  }
}

/**
 * 获取复习单词
 */
let getReviewPlan = async function (ctx, next) {
  let params = ctx.request.body,
      username = params.username,
      token = params.token,
      isTrue = false,
      result = {};

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + username, function (err, reply) {
          if(reply && reply === token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    ctx.throw(401);
    return;
  }

  let date = tool.formatDate(new Date(), "YYYY-MM-DD")
  // 获取今日复习的次数
  await PlanModel.getReviewCount({
    date: date,
    username: params.username    
  }, (res) => {
    if(res) {
      result.testCount = res.testCount;
      result.grade = res.grade;
    }
  });
  
  console.log("次数")
  console.log(result)
  // 获取要复习的单词
  await PlanModel.getTodayReview({
    date: date,
    username: params.username
  }, (res) => {
    result.words = res;
  });

  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

/**
 * 获取所有计划
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let getAllPlan = async function (ctx, next) {
  let params = ctx.request.body,
      username = params.username,
      token = params.token,
      isTrue = false,
      result = null;

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + username, function (err, reply) {
          if(reply && reply === token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    ctx.throw(401);
    return;
  }
  console.log(params)
  
  // 获取所有计划
  await PlanModel.getAllPlan({
  	username: username
  }, (res) => {
    result = res;
  });

  if(result) {
    result.forEach((item, index) => {
      item.createDate = tool.formatDate(item.createDate, "YYYY-MM-DD HH:MM:SS").slice(0, 9)
    })
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = "-1";
  }
}

let setDefaultPlan = async function (ctx, next) {
  let params = ctx.request.body,
      username = params.username,
      token = params.token,
      isTrue = false,
      result = null;

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + username, function (err, reply) {
          if(reply && reply === token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  })

  if(!isTrue) {
    ctx.throw(401);
    return;
  }

  // 设置默认任务（进行切换）
  await PlanModel.setDefaultPlan({
    username: params.username,
    planid: params.id
  }, (res) => {
    result = res;
  })
  
  if(result.affectedRows) {
    ctx.body = "1";
  } else {
    ctx.body = "-1";
  }
}

/**
 * 更新计划
 * @return {[type]} [description]
 */
let updatePlan = async function (ctx, next) {
  let params = ctx.request.body,
      username = params.username,
      token = params.token,
      isTrue = false,
      result = null;

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + username, function (err, reply) {
          if(reply && reply === token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  });

  if(!isTrue) {
    ctx.throw(401);
    return;
  }
  console.log(params)
  await PlanModel.updatePlan({
    username: params.username,
    planid: params.planid,
    num: params.plannum
  }, (res) => {
    result = res;
  });

  if(result.affectedRows > 0) {
    ctx.body = "1";
  } else {
    ctx.body = "-1";
  }
}

/**
 * 计算计划结束日期
 * @param  {[type]}   ctx  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
let calPlan = async function (ctx, next) {
  let params = ctx.request.body,
      username = params.username,
      token = params.token,
      isTrue = false,
      result = null;

  //验证token
  await new Promise (function (resolve, reject){
    db_redis.get("token_" + username, function (err, reply) {
          if(reply && reply === token) {
            resolve(true)
          } else {
            resolve(false)
          }
    })    
  }).then(res => {
    isTrue = res;
  });

  if(!isTrue) {
    ctx.throw(401);
    return;
  }

  let date = new Date();
  await PlanModel.calPlan({
    username: params.username,
    planid: params.planid,
  }, (res) => {
    if(res) {
      result = res;
      let interval = Math.ceil((result.allNum - result.readyNum) / params.plannum);
      console.log(interval)
      date.setDate(date.getDate() + interval);
    }
  });

  if(result) {
    ctx.body = tool.formatDate(date, "YYYY-MM-DD");
  } else {
    ctx.body = "-1";
  }
}

module.exports = {
  addPlan,
  getTodayPlan,
  getAllPlan,
  getReviewPlan,
  setDefaultPlan,
  updatePlan,
  calPlan
}