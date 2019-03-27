const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('koa2-cors')

const users = require('./routes/users')
const auth = require('./routes/auth')
const book = require('./routes/book')
const word = require('./routes/word')

// error handler
onerror(app)


// 跨域处理中间件
app.use(cors({
  origin: function (ctx) {
    if(ctx.request.header.origin == 'http://localhost:8080' || ctx.request.header.origin == 'http://localhost:9528')
    return ctx.request.header.origin;
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: true,
  allowMethods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

// 提交数据处理中间件
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

var whiteRoutes = [
  '/login', '/register'
];
/* check auth
app.use(async (ctx, next) => {
  let needCheck = true;
  // 白名单
  if (1) {
    needCheck = false;
  }

  if (needCheck) {
    await new Promise (function (resolve, reject){
      redis.client.get("token_" + params.username, function (err, reply) {
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
    // 未登陆
    if(isTrue == -1) {
      ctx.body = "-1";
      return;
    }
  }
  await next()
})*/

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(users.routes(), users.allowedMethods())
app.use(auth.routes(), auth.allowedMethods())
app.use(book.routes(), book.allowedMethods())
app.use(word.routes(), word.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app
