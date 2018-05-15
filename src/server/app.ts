import * as express from 'express';
import * as http from 'http';
import * as md5 from 'md5';
import * as util from 'util';
const writeFile = util.promisify(require('fs').writeFile)
const unlink = util.promisify(require('fs').unlink)
const exec = util.promisify(require('child_process').exec)
const app: express.Express = express();

app.use(express.static('public'));

const port = process.env.PORT;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

app.get('/q', async (req, res) => {
  const input = req.query.li.split(".png")[0]
  const fileName = md5(`${Date.now()} ${input}`)
  await generatePng(input, fileName).catch((err) => {
    res.send(err.stderr).status(404).end()
  })
  res.sendFile(__dirname + `/${fileName}.png`, () => { deleteFiles(fileName) })
})

const generatePng = async (input, fileName) => {
  console.log(`${input} ${fileName}.png`)
  await writeFile(`${fileName}.ly`, `{${input}}\\header{tagline=""}`)
  await exec(`lilypond -fpng -dresolution=200 ${fileName}.ly`)
  await exec(`convert ${fileName}.png -trim +repage -splice 10x10 -gravity southeast -splice 10x10 ./dist/server/${fileName}.png`)
}

const deleteFiles = (fileName) => {
  unlink(`${fileName}.ly`)
  unlink(`${fileName}.png`)
  unlink(`./dist/server/${fileName}.png`)
}
