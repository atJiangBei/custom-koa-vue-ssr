const KoaBody = require('koa-body')

module.exports = app => {
  app.proxy = true

  const server = require('http').createServer(app.callback())
console.log(10000)
  app.use((ctx, next) => { // 跨域处理
      ctx.set('Access-Control-Allow-Origin', '*')
      ctx.set('Access-Control-Allow-Headers', 'Authorization, DNT, User-Agent, Keep-Alive, Origin, X-Requested-With, Content-Type, Accept, x-clientid')
      ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS')
      if (ctx.method === 'OPTIONS') {
        ctx.status = 200
        ctx.body = ''
      }
      return next()
    })
    .use(KoaBody({
      multipart: true, // 开启对multipart/form-data的支持
      strict: false, // 取消严格模式，parse GET, HEAD, DELETE requests
      formidable: { // 设置上传参数
        // uploadDir: path.join(__dirname, '../assets/uploads/tmpfile')
      },
      jsonLimit: '10mb', // application/json 限制，default 1mb 1mb
      formLimit: '10mb', // multipart/form-data 限制，default 56kb
      textLimit: '10mb' // application/x-www-urlencoded 限制，default 56kb
    }))
    .use((ctx, next) => {
      if (/^\/api/.test(ctx.url)) {
        ctx.body = 'World' // 测试用
      }
      next()
    })
  return server
}
