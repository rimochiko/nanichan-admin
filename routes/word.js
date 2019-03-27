const router = require('koa-router')()
const WordCon = require('../controller/WordCon')
const PlanCon = require('../controller/PlanCon')
const UserCon = require('../controller/UserCon')
router.prefix('/word')

// 获取用户拥有的单词
router.post('/user', WordCon.getWord);
router.post('/today', PlanCon.getTodayPlan);
router.get('/searchj/:keyword', WordCon.searchWordByJ);
router.get('/searchc/:keyword', WordCon.searchWordByC);
router.get('/relate/:keyword', WordCon.getRelateWord);
router.get('/sequence/:id', WordCon.getSequence);
router.post('/finishonetest', WordCon.finishOneTest);
router.post('/finishonetest', WordCon.finishOneTest);
router.post('/bookadd', WordCon.addBookWord);
router.post('/addWord', WordCon.addWord);
router.post('/addSeq', WordCon.addSeq);
module.exports = router
