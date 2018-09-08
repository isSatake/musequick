import * as dotenv from 'dotenv';

dotenv.load();

import * as express from 'express';
import * as http from 'http';
import * as md5 from 'md5';
import * as util from 'util';
import * as cloudinary from "cloudinary";
import {unlink} from "fs";
import {convertJPNtoEN} from "./tools";
import {IncomingMessage} from "http";


const writeFile = util.promisify(require('fs').writeFile);
const exec = util.promisify(require('child_process').exec);
const app: express.Express = express();

app.use(express.static('public'));
app.use((err, req, res, next) => {
    return res.send(err).end(404);
});

const port = process.env.PORT;
app.set('port', port);

const server = http.createServer(app);
server.listen(port);

app.get('/q', async (req, res, next) => {
    const query = req.query.li.split(/\.(png|mp3)/);
    const lyQuery = convertJPNtoEN(query[0]);
    const extension = query[1] || "png";
    const fileName = md5(lyQuery);
    const tempo = req.query.tempo;
    let url = cloudinary.url(fileName);
    console.log(`hash: ${fileName}`, `query: ${lyQuery}`);

    if (extension === "mp3") {
        try {
            await generateMp3(lyQuery, fileName, tempo || 200);
        } catch (e) {
            next(e.stderr);
        }
        return res.sendFile(`${fileName}.mp3`, {root: __dirname}, () => {
            deleteFiles(fileName);
        })
    }

    const stream: IncomingMessage | void = await getPngCache(url).catch(async (err) => {
        console.log(err.message);
    });
    if (stream) return stream.pipe(res);
    try {
        await generatePng(lyQuery, fileName);
        url = await uploadPng(`${__dirname}/${fileName}.png`);
    } catch (e) {
        deleteFiles(fileName);
        next(e.stderr);
    }
    deleteFiles(fileName);
    return (await httpget(url)).pipe(res);
});

const httpget = (url: string): Promise<IncomingMessage> => new Promise(resolve => http.get(url, resolve));

const getPngCache = async (url: string): Promise<IncomingMessage> => {
    console.log("Get imgage", url);
    const res = await httpget(url);
    const {statusCode, statusMessage} = res;
    if (statusCode === 404) throw new Error("Image not found");
    if (statusCode !== 200) throw new Error(`HTTP error: ${statusCode} ${statusMessage}`);
    console.log("Use cache");
    return res
};

const generatePng = async (input, fileName): Promise<void> => {
    console.log(`Generate png`);
    await writeFile(`${__dirname}/${fileName}.ly`, `{${input}}\\header{tagline=""}`);
    await exec(`lilypond -fpng -dresolution=200 -o ${__dirname} ${__dirname}/${fileName}.ly`);
};

const uploadPng = (path: string): Promise<string> => new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(path, {
        effect: "trim", border: "10px_solid_white", use_filename: true, unique_filename: false
    }, (err, res) => {
        if (err) throw new Error("Failed to upload PNG");
        console.log("Uploaded", res.url);
        resolve(res.url);
    });
});

const generateMp3 = async (input, fileName, tempo) => {
    console.log(`Generate mp3`);
    await writeFile(`${__dirname}/${fileName}.ly`, `\\score{{${input}}\\midi{\\tempo4=${tempo}}}`);
    await exec(`lilypond  -o ${__dirname} ${__dirname}/${fileName}.ly`);
    await exec(`timidity ${__dirname}/${fileName}.midi -Ow -o - | lame - -b 64 ${__dirname}/${fileName}.mp3`)
};

const deleteFiles = (fileName): void => {
    const path = `${__dirname}/${fileName}`;
    const exts = ["ly", "png", "midi", "mp3"];
    for (let ext of exts) {
        unlink(`${path}.${ext}`, err => {
        });
    }
};
