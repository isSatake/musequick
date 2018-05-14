import * as express from 'express';
import * as http from 'http';
const util = require('util')
const writeFile = util.promisify(require('fs').writeFile)
const exec = util.promisify(require('child_process').exec)
const app: express.Express = express();

app.use(express.static('public'));

const port = "3000";
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

app.get('/q', async (req, res) => {
  res.send(await getPng(req.query.li)).status(200).end()
})

app.get('/img/q', async (req, res) => {
  res.send(`<img src="data:image/png;base64,${await getPng(req.query.li)}">`).status(200).end()
})

const getPng = async (input) => {
  console.log(input)
  await writeFile('test.ly', input)
  await exec('lilypond -fpng -dresolution=200 test.ly').catch((err) => {
    //文法エラーはそのまま返す
    console.error(err.stderr)
    process.exit(1)
  })
  await exec('convert test.png -trim +repage -splice 10x10 -gravity southeast -splice 10x10 out.png')

  const { stdout } = await exec('base64 out.png')
  return stdout
}
