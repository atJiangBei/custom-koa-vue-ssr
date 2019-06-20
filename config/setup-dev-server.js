const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const MFS = require('memory-fs')
const webpack = require('webpack')
const chokidar = require('chokidar')
const serverConfig = require('./webpack.server.config')
const clientConfig = require('./webpack.web.config')
const webpackDevMiddleware = require('./koa/dev')
const webpackHotMiddleware = require('./koa/hot')
const readline = require('readline')


const readFile = (fs, file) => fs.readFileSync(path.join(clientConfig.output.path, file), 'utf-8');

module.exports = (app, cb) => {
  let apiMain, bundle, template, clientManifest, webTime;

  const clearConsole = () => {//清除
    if (process.stdout.isTTY) {
      const blank = '\n'.repeat(process.stdout.rows)
      console.log(blank)
      readline.cursorTo(process.stdout, 0, 0)
      readline.clearScreenDown(process.stdout)
    }
  }

const update = () => {
	if (bundle && template && clientManifest) {
		cb(bundle, {template,clientManifest})
	}
}

const templatePath = path.resolve(__dirname, '../public/index.html')
template = fs.readFileSync(templatePath, 'utf-8')
chokidar.watch(templatePath).on('change', () => {
	template = fs.readFileSync(templatePath, 'utf-8')
	update()
})
clientConfig.entry.app = ['webpack-hot-middleware/client', clientConfig.entry.app]
  clientConfig.output.filename = '[name].js'
  clientConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )
  const clientCompiler = webpack(clientConfig)
  const devMiddleware = webpackDevMiddleware(clientCompiler, {
    stats: { 
      colors: true
    },
    reporter: (middlewareOptions, options) => {
      const { log, state, stats } = options
      if (state) {
        clearConsole()
        update()
      }
    },
    noInfo: true, 
    serverSideRender: false
  })
  app.use(devMiddleware)
///////////////////////////////////////////////////////


  clientCompiler.plugin('done', stats => {
    stats = stats.toJson()
    if (stats.errors.length) return
    clientManifest = JSON.parse(readFile(devMiddleware.fileSystem,'vue-ssr-client-manifest.json'))
    webTime = stats.time
  })
  app.use(webpackHotMiddleware(clientCompiler))

  // web server for ssr
const serverCompiler = webpack(serverConfig)
const mfs = new MFS()
serverCompiler.outputFileSystem = mfs
serverCompiler.watch({}, (err, stats) => {
	if (err) throw err
	stats = stats.toJson()
	if (stats.errors.length) return
	bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json'))
	update()
})
 
}
