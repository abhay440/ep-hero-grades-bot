const {
    log
} = require('../Utils');
const request = require('request');
const puppeteer = require('puppeteer');

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

        if (chartType === "aw") {
            getRemoteData(process.env.AWSHEET, {alliance: alliance})
                .then(response => {
                    if (response.error === true) {
                        message.channel.send(`Error: ${response.errorMessage}`)
                    } else {

                        (async () => {
                            var charts = response.charts;
                            for (var i = 0; i < charts.length; i++) {
                              var chart = charts[i];
                              const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
                              const page = await browser.newPage();
                              await page.setViewport({
                                width: parseInt(chart.width, 10),
                                height: parseInt(chart.height, 10),
                                deviceScaleFactor: 1,
                              });
                              await page.goto(chart.url, {waitUntil: 'networkidle2'});
                              var dashboardFileName = alliance + '-' + chart.type + '.png';
                              await page.screenshot({path: dashboardFileName});
                              await browser.close();
                              message.channel.send(chart.name, {files: ['./' + dashboardFileName]});
                            }
                        })();
                    }
                })
                .catch(err => {
                    message.channel.send(`Error: ${err}`)
                })

        } else {

            getChart(alliance, chartType)
            .then(dashboardUrl => {
                (async () => {
                  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
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
        }

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
                        resolve(jsonBody.dashboardUrl);
                    }
                });
                return;
            });
        }
    },
}

function getRemoteData(url, params) {
    log("Calling remote url - " + url);
    return new Promise((resolve, reject) => {
        // Send to new sheet
        var r = request.get({
            url: url,
            followAllRedirects: true,
            qs: params
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                log('Request failed:' + err);
                reject(err);
                return;
            }
            var jsonBody = JSON.parse(body);
            resolve(jsonBody);
        });
        return;
    });
}
