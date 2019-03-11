const {log} = require('../Utils');
const request = require('request');

module.exports = {
  name: 'track',
  description: 'Track Titan/AW scores',
  args: true,
  execute(message, args) {

  	if (args.length != 3) {
  		log("Invalid Arguments: " + args.length);
  		message.reply("Invalid command. Sample command !track panda 12 nature");
  		return;
  	}

  	var alliance = args[0];
  	var stars = args[1];
  	var titan = args[2].toLowerCase();

  	if (isNaN(stars) || stars < 1 || stars > 14) {
		log("Invalid stars: " + stars);
		message.reply("Invalid command. Sample command !track panda 12 nature");
		return;
  	}

  	if (titan !== 'ice' && titan !== 'nature' && titan !== 'fire' && titan !== 'holy' && titan !== 'dark') {
  		log("Invalid Titan color: " + titan);
  		message.reply("Invalid command. Sample command !track panda 12 nature");
  		return;
  	}

  	log("Received attachments: " + message.attachments.size);
  	if (message.attachments.size == 1) {
	    log(`Received file name: ${message.attachments.first().filename}`)
	    log(`Received file size: ${message.attachments.first().filesize}`)
	    log(`Received file url : ${message.attachments.first().url}`)

	    trackData(message);

	    async function trackData(message) {
			await compressImage(message.attachments.first().url, message.channel.name + '.jpg');
			log("Compressed");
			await sleep(1000)
			log("Processing");

			var parsedText = await ocr();
			if (parsedText && parsedText !== false && parsedText.length > 0) {
				//log(`OCR Result: ${parsedText}`);
				var chartUrl = await sendToGoogleSheets(parsedText, alliance, stars, titan);
				log("chartUrl: " + chartUrl);

                await compressImage(chartUrl, "chart.jpg");
                await sleep(1000)

                message.channel.send("Summary", {
                    files: ["chart.jpg"]
                });

			} else {
				return;
			}
    	}

		function sleep(ms) {
		    return new Promise(resolve => {
		        setTimeout(resolve,ms)
		    });
		}

    	function compressImage(imageUrl, filename) {
    		log("Compressing");
			var Jimp = require('jimp');
			return new Promise((resolve, reject) => {
				Jimp.read(imageUrl)
					.then(image => {
						resolve(
							image.quality(95)
								.write(filename)
						);
					})
					.catch(err => {
						throw err;
					});
			});
    	}

    	function sendToGoogleSheets(parsedText, alliance, stars, titan) {
    		log("Sending to Google");
    		return new Promise ((resolve, reject) => {
				var url;
				var chartUrl;
    			if (alliance === 'panda') {
					url = 'https://script.google.com/macros/s/AKfycbzCKDrvrdm_IRZdZTtDkLeGCMkohZS9OEW0EDQHPuoR-VEz4yA/exec'; //panda
					chartUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSXFu4o3U9oLIU0XVLOlSS9RdX6UiaAHhYOqOcUalQ21oKgo_XsnToHUz5wQ-UndyjuxrZL2XQPPPhJ/pubchart?oid=649661949&format=image';
    			}
    			else if (alliance === 'cub') {
					url = 'https://script.google.com/macros/s/AKfycbxvpByOGedpNy8zjBWnLYaH8_q3ik-z2yifgLPD/exec'; //cub
					chartUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vScHKxJWYuWW2878Cjfj5geN-mWsiMsqMXadM2fT0I_yNQIJw5_fQAX96BMiSkxjykMhDBxojKD-k7b/pubchart?oid=649661949&format=image';
    			} else {
    				reject("Invalid Alliance");
    				return;
    			}

                chartUrl = chartUrl + "&time=" + Math.floor(Date.now() / 1000);

				//var url = 'https://script.google.com/macros/s/AKfycbzCKDrvrdm_IRZdZTtDkLeGCMkohZS9OEW0EDQHPuoR-VEz4yA/exec'; //panda
				//var url = 'https://script.google.com/macros/s/AKfycbxvpByOGedpNy8zjBWnLYaH8_q3ik-z2yifgLPD/exec'; //cub

				// pandachart = https://docs.google.com/spreadsheets/d/e/2PACX-1vSXFu4o3U9oLIU0XVLOlSS9RdX6UiaAHhYOqOcUalQ21oKgo_XsnToHUz5wQ-UndyjuxrZL2XQPPPhJ/pubchart?oid=649661949&format=image
				// cubchart = https://docs.google.com/spreadsheets/d/e/2PACX-1vScHKxJWYuWW2878Cjfj5geN-mWsiMsqMXadM2fT0I_yNQIJw5_fQAX96BMiSkxjykMhDBxojKD-k7b/pubchart?oid=649661949&format=image

				var form = {
					data: parsedText,
					stars: stars,
					titan: titan
				};

				var r = request.post({ url: url, form: form }, function optionalCallback (err, httpResponse, body) {
				  if (err) {
				  	log('upload failed:' + err);
					reject(err);
				  }
				  log(`Success: sent to Google`);
				  resolve(chartUrl);
				});
			});
    	}

		function ocr() {
			return new Promise ((resolve, reject) => {

				var fs = require('fs');
				var path = require('path');

				var url = 'https://api.ocr.space/parse/image';
				var headers = {
					'apikey': process.env.OCRSPACEAPI,
					'Content-Type': 'application/x-www-form-urlencoded'
				};

				var r = request.post({ url: url, headers: headers }, function optionalCallback (err, httpResponse, body) {
				  if (err) {
				  	log('upload failed:' + err);
					reject(err);
				  }
				  //log(`Success`);
				  var jsonBody = JSON.parse(body);
				  //log(`statusCode: ${jsonBody.IsErroredOnProcessing}`);
				  if (jsonBody.IsErroredOnProcessing === false) {
				  	var parsedText = jsonBody.ParsedResults[0].ParsedText;
					//log(`Upload successful!  Server responded with: ${parsedText}`);
					resolve(parsedText);
				  }
				  resolve(false);
				});

				var form = r.form();
				form.append('isTable', 'true');
				form.append('file', fs.createReadStream(path.join(__dirname + '/../', message.channel.name + '.jpg')));
			});
		}		
  	
  	}

  },
}