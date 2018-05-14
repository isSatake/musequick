import * as express from 'express';
import * as http from 'http';
const util = require('util')
const writeFile = util.promisify(require('fs').writeFile)
const exec = util.promisify(require('child_process').exec)
const app: express.Express = express();

app.use(express.static('public'));

const port = process.env.PORT;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

app.get('/q', async (req, res) => {
  const base64 = await getPng(req.query.li).catch((err) => {
    res.send(err.stderr).status(404).end()
  })
  res.send(base64).status(200).end()
})

app.get('/img/q', async (req, res) => {
  const base64 = await getPng(req.query.li).catch((err) => {
    res.send(err.stderr).status(404).end()
  })
  res.send(`<img src="data:image/png;base64,${base64}">`).status(200).end()
})

const getPng = async (input) => {
  console.log(input)
  await writeFile('test.ly', input)
  await exec('lilypond -fpng -dresolution=200 test.ly')
  await exec('convert test.png -trim +repage -splice 10x10 -gravity southeast -splice 10x10 out.png')

  const { stdout } = await exec('base64 out.png')
  return stdout
}
