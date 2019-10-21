const {log} = require('../Utils');
const request = require('request');

module.exports = {
  name: 'track',
  description: 'Track Titan scores',
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

    if (isNaN(stars) || stars < 0 || stars > 14) {
      log("Invalid stars: " + stars);
      message.reply("Invalid command. Sample command !track panda 12 nature");
      return;
    }

    if (titan !== 'ice' && titan !== 'nature' && titan !== 'fire' && titan !== 'holy' && titan !== 'dark' && titan !== 'aw') {
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
        // log('parsedText: ' + JSON.stringify(parsedText));
        if (parsedText && parsedText !== false && parsedText.length > 0) {
          sendToGoogleSheets(parsedText, alliance, stars, titan)
          .then (dashboardUrl => {
            const puppeteer = require('puppeteer');
            (async () => {
              const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});;
              const page = await browser.newPage();
              await page.setViewport({
                width: 1128,
                height: 1020,
                deviceScaleFactor: 1,
              });
              await page.goto(dashboardUrl, {waitUntil: 'networkidle2'});
              var dashboardFileName = alliance + 'Dashboard.png';
              await page.screenshot({path: dashboardFileName});
              await browser.close();
              message.channel.send("Dashboard", {files: ['./' + dashboardFileName]});
            })();
          })
          .catch(err => {
            message.channel.send(`Error: ${err}`)
          });
        } else {
          log('No respose from OCR');
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
              image.quality(95).write(filename)
              );
          })
          .catch(err => {
            throw err;
          });
        });
      }

      function saveImage(imageUrl, filename) {
        log("Saving Image");
        var Jimp = require('jimp');
        return new Promise((resolve, reject) => {
          Jimp.read(imageUrl)
          .then(image => {
            resolve(
              image.write(filename)
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
          var form = {
            data: parsedText,
            stars: stars,
            titan: titan,
            alliance: alliance
          };

          // Send to new sheet
          var newUrl = process.env.TITANSHEET;
          var r = request.post({ url: newUrl, followAllRedirects: true, form: form }, function optionalCallback (err, httpResponse, body) {
            if (err) {
              log('upload failed:' + err);
              reject(err);
              return;
            }
            log(`Success: sent to new Google sheet`);
            var jsonBody = JSON.parse(body);
            log("Google Response: " + JSON.stringify(jsonBody));
            if (jsonBody.error === true) {
              reject(jsonBody.errorMessage);
              return;
            } else {
              // var imageBuffer = decodeBase64Image(jsonBody.chart.image);
              resolve(jsonBody.dashboardUrl);
            }
          });
          return;
        });
      }

      function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var response = {};

        if (matches.length !== 3) 
        {
          return new Error('Invalid input string');
        }

        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');

        return response;
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
            var jsonBody = JSON.parse(body);
            if (jsonBody.IsErroredOnProcessing === false) {
              var parsedText = jsonBody.ParsedResults[0].ParsedText;
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