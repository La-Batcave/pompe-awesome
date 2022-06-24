const axios = require('axios');
const fs = require('fs');
const { resolve } = require('path');
const path = require('path');

var v = '';
var contentPath = '';
var localDir = '';
var filesToDL = [];
const datasURL = 'https://site-assets.fontawesome.com/releases/';

return axios
	.get('https://registry.npmjs.org/@fortawesome/fontawesome-free')
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
		return axios.get(contentPath + '/css/all.css');
	})
	.then((cssContent) => {
		var assets = cssContent.data.match(/(?<=url\()(.*?)(?=\))/gm);
		var additionnalFiles = [
			'sprites/brands.svg',
			'sprites/duotone.svg',
			'sprites/light.svg',
			'sprites/regular.svg',
			'sprites/solid.svg',
			'sprites/thin.svg',
			'css/all.css',
		];
		for (let a of assets.concat(additionnalFiles)) {
			filesToDL.push({
				url: contentPath + '/' + a.replace('../', ''),
				localPath: path.join(localDir, a.replace('../', '')),
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
