const {
    log
} = require('../Utils');
const request = require('request');

module.exports = {
    name: 'war',
    aliases:['aw'],
    description: 'Track AW hits. Usage: !war panda OPPONENT DATE',
    args: true,
    execute(message, args) {

        if (args.length != 3) {
            log("Invalid Arguments: " + args.length);
            message.reply("Invalid command. Sample command !war panda OPPONENT DATE");
            return;
        }

        var alliance = args[0];
        var opponent = args[1];
        var date = args[2];
        var timestamp = message.createdTimestamp;

        log("Received attachments: " + message.attachments.size);
        if (message.attachments.size == 0) {
            message.reply("No files attached.");
            return;
        }

        if (message.attachments.size > 0) {

            trackData(message, 0, "");

            async function trackData(message, index, errors) {
                var key = Array.from(message.attachments.keys())[index];
                var attachment = message.attachments.get(key);

                if (attachment === 'undefined' || attachment == null) {
                    message.channel.send("Errors: No attachment");
                    return;
                }

                log("Processing attachment: " + attachment.filename);

                await compressImage(attachment.url, message.channel.name + '.jpg');
                log("Compressed");
                await sleep(1000)
                log("Processing");

                var parsedText;
                for (var i = 0; i < 3; i++) {
                    parsedText = await ocr();
                    // log ("parsedText " + parsedText);
                    if (parsedText !== false) {
                        break;
                    }
                    await sleep(5000);
                }

                if (parsedText && parsedText !== false && parsedText.length > 0) {
                    sendToGoogleSheets(parsedText, alliance, opponent, date, timestamp)
                        .catch(err => {
                            errors = err;
                        });
                } else {
                    log('No respose from OCR');
                    errors = "OCR error";
                }

                log("Processed attachment: " + attachment.filename);
                if (errors.length > 0) {
                    message.channel.send("Done: " + attachment.filename + " Error: " + errors);
                } else {
                    message.channel.send("Done: " + attachment.filename);
                }
            }

            function sleep(ms) {
                return new Promise(resolve => {
                    setTimeout(resolve, ms)
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
                                //image.greyscale().invert().contrast(1).posterize(2).write(filename)
                                //image.greyscale().write(filename) //2
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

            function sendToGoogleSheets(parsedText, alliance, opponent, date, timestamp) {
                log("Sending to Google");
                return new Promise((resolve, reject) => {
                    var form = {
                        data: parsedText,
                        opponent: opponent,
                        date: date,
                        alliance: alliance,
                        timestamp: timestamp
                    };

                    // Send to new sheet
                    var newUrl = process.env.AWSHEET;
                    var r = request.post({
                        url: newUrl,
                        followAllRedirects: true,
                        form: form
                    }, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            log('Google upload failed: ' + err);
                            reject(err);
                            return;
                        }
                        log(`Success: sent to new Google sheet`);
                        var jsonBody = JSON.parse(body);
                        if (jsonBody.error === true) {
                            reject(jsonBody.errorMessage);
                            return;
                        } else {
                            resolve("Done");
                        }
                    });
                    return;
                });
            }

            function decodeBase64Image(dataString) {
                var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                var response = {};

                if (matches.length !== 3) {
                    return new Error('Invalid input string');
                }

                response.type = matches[1];
                response.data = new Buffer(matches[2], 'base64');

                return response;
            }

            function ocr() {
                return new Promise((resolve, reject) => {

                    var fs = require('fs');
                    var path = require('path');

                    var url = 'https://api.ocr.space/parse/image';
                    var headers = {
                        'apikey': process.env.OCRSPACEAPI,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    };

                    var r = request.post({
                        url: url,
                        headers: headers
                    }, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            log('OCR upload failed: ' + err);
                            resolve(false);
                            return;
                        }
                        var jsonBody = JSON.parse(body);
                        if (jsonBody.IsErroredOnProcessing === false) {
                            var parsedText = jsonBody.ParsedResults[0].ParsedText;
                            log("Scanned text size: " + parsedText.length);
                            resolve(parsedText);
                        }
                        resolve(false);
                    });

                    var form = r.form();
                    form.append('isTable', 'true');
                    form.append('scale', 'true');
                    form.append('OCREngine', '2');

                    form.append('file', fs.createReadStream(path.join(__dirname + '/../', message.channel.name + '.jpg')));
                });
            }
        }
    },
}