const Router = require("koa-router")
const router = new Router()


router.get("/api",async (ctx,next)=>{
	ctx.body = "我是api"
});

module.exports = router