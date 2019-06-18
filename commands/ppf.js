const {log} = require('../Utils');

const data = {
  fire: 'S2:3-4, S2:3:8, 20-4, 19-6, 19-4, 11-6, 6-8',
  ice: '8-7',
  nature: '7-5',
  holy: '10-6, 12-9',
  dark: '7-4'
}

module.exports = {
  name: 'ppf',
  description: 'Calculate AW ppf',
  args: true,
  execute(message, args) {

    if (args.length != 4) {
      log("Invalid Arguments: " + args.length);
      message.reply("Invalid command. Sample command !ppf 1 30 1000 60");
      return;
    }

    var half = args[0];
    var players = args[1];
    var points = args[2];
    var flagsLeft = args[3];

    if (isNaN(half) || isNaN(players) || isNaN(points) || isNaN(flagsLeft)) {
      message.reply("Invalid command. Sample command !ppf 1 30 1000 60");
    }

    var ppf = getPPF(half, players, points, flagsLeft)
    var projected = Math.round(ppf * 180);

    message.channel.send(`PPF: ${ppf}; Projected: ${projected}`)
      .catch(error => console.error(error.message))
  }
}

function getPPF(half, players, points, flagsLeft) {
    var totalFlags = players * 6;

    flagsLeft = (half == 1) ? (+flagsLeft + (totalFlags/2)) : flagsLeft;

    log(`totalFlags: ${totalFlags}; flagsLeft: ${flagsLeft}; half: ${half}`);

    var ppf = Math.round( points / ( totalFlags -  flagsLeft ) * 100 ) / 100;

    return ppf;
}