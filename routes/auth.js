const router = require('koa-router')()
const UserCon = require('../controller/UserCon')

router.prefix('/auth')

// 登录
router.post('/login', UserCon.login)
// 注册
router.post('/register', UserCon.register)
// 获取邮箱验证码
router.post('/getcode', UserCon.verifyMail)
// 检查邮箱验证码
router.post('/checkCode', UserCon.checkMail)
// 检查用户名是否存在
router.post('/checkName', UserCon.checkName)
// 进行token验证，更新header
router.post('/checkToken', UserCon.checkToken)

// 注销
module.exports = router