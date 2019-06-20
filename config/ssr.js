const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const LRU = require('lru-cache')
const {createBundleRenderer} = require('vue-server-renderer')
const isProd = process.env.NODE_ENV === 'production'
const setUpDevServer = require('./setup-dev-server')
const HtmlMinifier = require('html-minifier').minify
const pathResolve = file => path.resolve(__dirname, file)

module.exports = app => {
  return new Promise((resolve, reject) => {
    const createRenderer = (bundle, options) => {
      return createBundleRenderer(bundle, Object.assign(options, {
        cache: LRU({
          max: 1000,
          maxAge: 1000 * 60 * 15
        }),
        basedir: pathResolve('../dist/web'),
        runInNewContext: false
      }))
    }

    let renderer = null
    if (isProd) {
      // prod mode
      const template = HtmlMinifier(fs.readFileSync(pathResolve('../public/index.html'), 'utf-8'), {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: false
      })
      const bundle = require(pathResolve('../dist/web/vue-ssr-server-bundle.json'))
      const clientManifest = require(pathResolve('../dist/web/vue-ssr-client-manifest.json'))
      renderer = createRenderer(bundle, {
        template,
        clientManifest
      })
    } else {
      // dev mode
			
      setUpDevServer(app, (bundle, options) => {
        try {
          renderer = createRenderer(bundle, options)
          resolve()
        } catch (e) {
          console.log(chalk.red('\nServer error'), e)
        }
      })
    }

    app.use(async (ctx, next) => {
			console.log(54,ctx.url)
      if (!renderer) {
				console.log("没有renderer")
        ctx.type = 'html'
        ctx.body = 'waiting for compilation... refresh in a moment.'
        next()
        return
      }

      let status = 200
      let html = null
      const context = {
        url: ctx.url,
        title: 'OK'
      }
			try {
			  status = 200
			  html = await renderer.renderToString(context)
			} catch (e) {
			  if (e.message === '404') {
			    status = 404
			    html = '404 | Not Found'
			  } else {
			    status = 500
			    console.log(chalk.red('\nError: '), e.message)
			    html = '500 || Internal Server Error'
			  }
			}
			ctx.type = 'html'
			ctx.status = status || ctx.status
			ctx.body = html
      return next()
    })

    if (isProd) {
      resolve()
    }
  })
}
