const axios = require('axios');
const fs = require('fs');
const { resolve } = require('path');
const path = require('path');

var v = '';
var contentPath = '';
var localDir = '';
var filesToDL = [];
const datasURL = 'https://site-assets.fontawesome.com/releases/';

const fontFiles = [
    'css/all.css',
    'css/brands.css',
    'css/solid.css',
    'css/regular.css',
    'css/light.css',
    'css/thin.css',
    'css/duotone.css',
    'css/sharp-solid.css',
    'css/fontawesome.css'
]

return axios.get('https://registry.npmjs.org/@fortawesome/fontawesome-free')
.then((response) => {
    v = response.data['dist-tags']['latest'];
    localDir = path.join(__dirname, 'versions', v);
    return;
}) 
.then(() => {
    return new Promise((resolve) => {
        if (fs.existsSync(localDir)) {
            fs.rmSync(localDir, { recursive: true, force: true }, () => {
                resolve();
            });
        } else {
            resolve();
        }
    });
})
.then(() => {
    contentPath = `${datasURL}v${v}`;
    
    return Promise.all(fontFiles.map(e => { return axios.get(contentPath + '/' + e)}))
})
.then((cssContent) => {
    var assets = [] 
    for(let css of cssContent){
        if(css.data){
            assets = assets.concat(css.data.match(/(?<=url\()(.*?)(?=\))/gm))
        }
    }
    assets = [...new Set(assets)];
    var filesToGet = [
        'sprites/brands.svg',
        'sprites/duotone.svg',
        'sprites/light.svg',
        'sprites/regular.svg',
        'sprites/solid.svg',
        'sprites/thin.svg',
        ...assets.filter(e => e).map(e => e.replace('../', '')),
        ...fontFiles
    ];
    for (let a of filesToGet) {
        console.log(a)
        filesToDL.push({
            url: contentPath + '/' + a,
            localPath: path.join(localDir, a),
        });
    }

    Promise.all(
        filesToDL.map((f) => {
            return new Promise((resolve) => {
                var definitivePath = f['localPath'].substring(0, f['localPath'].lastIndexOf(path.sep))
                if(!fs.existsSync(definitivePath)){ fs.mkdirSync(definitivePath, {recursive:true}) }
                const writer = fs.createWriteStream(f['localPath'])
                axios({
                    url: f['url'],
                    method: 'GET',
                    responseType: 'stream'
                })
                .then((response)=>{
                    response.data.pipe(writer)
                    writer.on('finish', resolve)
                })
            });
        })
    );
});
