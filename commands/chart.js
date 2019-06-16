const {
    log
} = require('../Utils');
const request = require('request');

module.exports = {
    name: 'chart',
    description: 'Charts',
    args: true,
    execute(message, args) {

        if (args.length != 2) {
            log("Invalid Arguments: " + args.length);
            message.reply("Invalid command. Sample command !chart panda titan1");
            return;
        }

        var alliance = args[0];
        var chartType = args[1];

        getChart(alliance, chartType)
            .then(chart => {
                message.channel.send("Summary", {
                    files: [{
                        attachment: chart,
                        name: 'chart.png'
                    }]
                });
            })
            .catch(err => {
                message.channel.send(`Error: ${err}`)
            });

        function getChart(alliance, chartType) {
            log("Sending to Google");
            return new Promise((resolve, reject) => {
                var params = {
                    chart: chartType,
                    alliance: alliance
                };

                // Send to new sheet
                var newUrl = process.env.TITANSHEET;
                var r = request.get({
                    url: newUrl,
                    followAllRedirects: true,
                    qs: params
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        log('Request failed:' + err);
                        reject(err);
                        return;
                    }
                    var jsonBody = JSON.parse(body);
                    if (jsonBody.error === true) {
                        reject(jsonBody.errorMessage);
                        return;
                    } else {
                        var imageBuffer = decodeBase64Image(jsonBody.chart.image);
                        resolve(imageBuffer.data);
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
    },
}