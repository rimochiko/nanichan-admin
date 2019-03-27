const router = require('koa-router')()
const UserCon = require('../controller/UserCon.js')
const PlanCon = require('../controller/PlanCon.js')
router.prefix('/user')

// 获取某个用户基本信息
router.get('/info/:id', UserCon.getProfile)
// 用户添加计划
router.post('/addplan', PlanCon.addPlan)
// 用户获取今日计划
router.post('/gettodayplan', PlanCon.getTodayPlan)
// 用户获取复习计划
router.post('/getreviewplan', PlanCon.getReviewPlan)
// 用户获取所有计划
router.post('/getplan', PlanCon.getAllPlan)
// 用户修改信息
router.post('/updateInfo', UserCon.updateInfo)
// 用户修改头像
router.post('/updateAvatar', UserCon.updateAvatar)
// 用户修改计划
router.post('/updatePlan', PlanCon.updatePlan)
// 用户获取学习记录
router.post('/record', UserCon.getRecord)
// 获取所有用户的学习记录
router.get('/allrecord', UserCon.getAllRecord)
// 用户添加学习记录
router.post('/addrecord', UserCon.addRecord)
// 用户添加学习记录
router.post('/getdata', UserCon.getData)
// 设置默认计划
router.post('/setdefaultplan', PlanCon.setDefaultPlan)
// 计算该用户计划结束的日期
router.post('/calplan', PlanCon.calPlan)
// 首页的排行
router.get('/getrank', UserCon.getRank)
module.exports = router
