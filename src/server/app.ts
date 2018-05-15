import * as express from 'express';
import * as http from 'http';
import * as md5 from 'md5';
import * as util from 'util';

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
    const extension = query[1]
    const fileName = md5(`${Date.now()} ${query[0]}`)

    try {
        if(extension === "mp3"){
            await generateMp3(query[0], fileName, 200)
        }else{
            await generatePng(query[0], fileName)
        }
    }catch (err) {
        res.send(err.stderr).status(404).end()
        deleteFiles(fileName)
        return
    }

    res.sendFile(__dirname + `/${fileName}.${extension}`, () => {
        deleteFiles(fileName)
    })
})

const generateMp3 = async (input, fileName, tempo) => {
    console.log(`MP3: ${input} ${fileName}.png`)
    await writeFile(`${fileName}.ly`, `\\score{{${input}}\\midi{\\tempo4=${tempo}}}`)
    await exec(`/Users/stk/bin/lilypond ${fileName}.ly`)
    await exec(`timidity ${fileName}.midi -Ow -o - | lame - -b 64 ./dist/server/${fileName}.mp3`)
}

const generatePng = async (input, fileName) => {
    console.log(`PNG: ${input} ${fileName}.png`)
    await writeFile(`${fileName}.ly`, `{${input}}\\header{tagline=""}`)
    await exec(`/Users/stk/bin/lilypond -fpng -dresolution=200 ${fileName}.ly`)
    await exec(`convert ${fileName}.png -trim +repage -splice 10x10 -gravity southeast -splice 10x10 ./dist/server/${fileName}.png`)
}

const deleteFiles = (fileName) => {
    exec(`rm ${fileName}.*`)
    exec(`rm ./dist/server/${fileName}.*`)
}
