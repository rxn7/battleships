import Bao, {Context} from 'baojs'
import Game from './game'
import serveStatic from 'serve-static-bun'

const app: Bao = new Bao()
const game: Game = new Game()

app.get('/static/*any', serveStatic('static', {middlewareMode: 'bao', stripFromPathname: '/static'}))
app.get('/', (ctx: Context) => ctx.sendRaw(new Response(Bun.file('static/index.html'))))

game.setupRoutes(app)

const options: any = {port: process.env.PORT ? parseInt(process.env.PORT) : 3000}
app.listen(options)
console.log(`Running at localhost:${options.port}`)
