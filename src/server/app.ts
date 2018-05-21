import * as express from 'express';
import * as http from 'http';
import * as md5 from 'md5';
import * as util from 'util';
import * as dotenv from 'dotenv';
import {convertJPNtoEN} from "./tools";

dotenv.load()

const PATH_LILYPOND = process.env.PATH_LILYPOND || "lilypond"
const PATH_CONVERT = process.env.PATH_CONVERT || "convert"
const PATH_TIMIDITY = process.env.PATH_TIMIDITY || "timidity"
const PATH_LAME = process.env.PATH_LAME || "lame"

const writeFile = util.promisify(require('fs').writeFile)
const exec = util.promisify(require('child_process').exec)
const app: express.Express = express();

app.use(express.static('public'));

const port = process.env.PORT;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

app.get('/q', async (req, res) => {
    const query = req.query.li.split(/\.(png|mp3)/)
    const extension = query[1] || "png"
    const fileName = md5(`${Date.now()} ${query[0]}`)

    try {
        if(extension === "mp3"){
            await generateMp3(convertJPNtoEN(query[0]), fileName, 200)
        }else{
            await generatePng(convertJPNtoEN(query[0]), fileName)
        }
    }catch (err) {
        res.send(err.stderr).status(404).end()
        deleteFiles(fileName)
        return
    }

    res.sendFile(`${fileName}.${extension}`, { root: __dirname }, () => {
        deleteFiles(fileName)
    })
})

const generateMp3 = async (input, fileName, tempo) => {
    console.log(`MP3: ${input} ${fileName}.mp3`)
    await writeFile(`${__dirname}/${fileName}.ly`, `\\score{{${input}}\\midi{\\tempo4=${tempo}}}`)
    await exec(`${PATH_LILYPOND}  -o ${__dirname} ${__dirname}/${fileName}.ly`)
    await exec(`${PATH_TIMIDITY} ${__dirname}/${fileName}.midi -Ow -o - | ${PATH_LAME} - -b 64 ${__dirname}/${fileName}.mp3`)
}

const generatePng = async (input, fileName) => {
    console.log(`PNG: ${input} ${fileName}.png`)
    await writeFile(`${__dirname}/${fileName}.ly`, `{${input}}\\header{tagline=""}`)
    await exec(`${PATH_LILYPOND} -fpng -dresolution=200 -o ${__dirname} ${__dirname}/${fileName}.ly`)
    await exec(`${PATH_CONVERT} ${__dirname}/${fileName}.png -trim +repage -splice 10x10 -gravity southeast -splice 10x10 ${__dirname}/${fileName}.png`)
}

const deleteFiles = (fileName) => {
    exec(`rm ${__dirname}/${fileName}.*`)
}
