const TypeModel = require('../models/TypeModel')
const tool = require('../utils/tool.js')

let getBookType = async function (ctx, next) {
  let result;
  await TypeModel.getBookType((res) => {
    result = res;
  });

  console.log(result)
  if(result) {
    ctx.body = JSON.stringify(result);
  } else {
    ctx.body = '-1';
  }
}

module.exports = {
  getBookType
}