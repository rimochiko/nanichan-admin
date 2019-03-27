const router = require('koa-router')()
const tool = require('../utils/tool.js')

const BookCon = require('../controller/BookCon');
const TypeCon = require('../controller/TypeCon');

router.prefix('/book')

// 获取单词书分类
router.get('/types', TypeCon.getBookType);
// 获取单词书列表
router.get('/book/:type', BookCon.getBook);
// 获取所有书籍
router.get('/book', BookCon.getBook);
// 获取某个单词书信息
router.post('/bookdetail', BookCon.getBookDetail)
// 获取单词书某页
router.post('/word',BookCon.getBookWord)
// 获取用户创建的单词书
router.post('/mybook', BookCon.getUserBook)
// 用户创建新的单词书
router.post('/newbook', BookCon.createBook)
// 用户修改单词书
router.post('/updatebook', BookCon.updateBook)
// 用户共享单词书
router.post('/sharebook', BookCon.shareBook)
// 用户删除单词书
router.post('/removebook', BookCon.removeBook)

module.exports = router


