const {log} = require('../Utils');
const request = require('request');

module.exports = {
  name: 'trackaw',
  description: 'Track AW scores',
  args: true,
  execute(message, args) {

    var argsString = args.join(" ");

    if (args.length != 5) {
      log("Invalid Arguments: " + args.length);
      message.reply("Invalid command. Sample command !trackaw panda 7000 7dd 6000 arrows");
      // (\S+)\s+(\d+)\s+(\S+)\s+(\d+)\s+(\S+)
      return;
    }

    var alliance = args[0];
    var allianceScore = args[1];
    var opponent = args[2];
    var opponentScore = args[3];
    var warType = args[4];

    log("Received attachments: " + message.attachments.size);
    if (message.attachments.size == 1) {
      log(`Received file name: ${message.attachments.first().filename}`)
      log(`Received file size: ${message.attachments.first().filesize}`)
      log(`Received file url : ${message.attachments.first().url}`)

      trackData(message, alliance, allianceScore, opponent, opponentScore, warType);
    }
  }
}

async function trackData(message, alliance, allianceScore, opponent, opponentScore, warType) {
  var filename = message.channel.name + '.jpg';
  await compressImage(message.attachments.first().url, filename);
  log("Compressed");
  await sleep(1000)
  log("Processing");

  var parsedText = await ocr(filename);
  if (parsedText && parsedText !== false && parsedText.length > 0) {
    sendToGoogleSheets(parsedText, alliance, allianceScore, opponent, opponentScore, warType)
    .catch(err => {
      message.channel.send(`Error: ${err}`)
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
        image.quality(95).write(filename)
        );
    })
    .catch(err => {
      throw err;
    });
  });
}

function sendToGoogleSheets(parsedText, alliance, allianceScore, opponent, opponentScore, warType) {
  log("Sending to Google");
  return new Promise ((resolve, reject) => {
    var form = {
      data: parsedText,
      alliance: alliance,
      allianceScore: allianceScore,
      opponent: opponent,
      opponentScore: opponentScore,
      warType: warType
    };

    // Send to new sheet
    var newUrl = process.env.AWSHEET;
    var r = request.post({ url: newUrl, followAllRedirects: true, form: form }, function optionalCallback (err, httpResponse, body) {
      if (err) {
        log('upload failed:' + err);
        reject(err);
        return;
      }
      log(`Success: sent to new Google sheet`);
      var jsonBody = JSON.parse(body);
      if (jsonBody.error === true) {
        reject(jsonBody.errorMessage);
        return;
      } else {
        return;
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

function ocr(filename) {
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
    form.append('file', fs.createReadStream(path.join(__dirname + '/../', filename)));
  });
}