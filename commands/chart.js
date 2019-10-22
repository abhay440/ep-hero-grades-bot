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
        .then(dashboardUrl => {
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