const {log} = require('../Utils');
const {getHeroName} = require('../Utils')

const data = {
  fire: 'S2:3-4, S2:3:8, 20-4, 19-6, 19-4, 11-6, 6-8',
  red: 'S2:3-4, S2:3:8, 20-4, 19-6, 19-4, 11-6, 6-8',
  ice: '8-7',
  blue: '8-7',
  nature: '7-5',
  green: '7-5',
  holy: '10-6, 12-9',
  yellow: '10-6, 12-9',
  dark: '7-4',
  purple: '7-4',
  farming: 'https://i.imgur.com/awcdtg1.png',
  recruits: 'https://i.imgur.com/awcdtg1.png',
  experience: 'https://i.imgur.com/awcdtg1.png',
  'adventure kits': 'https://i.imgur.com/awcdtg1.png',
  'backpacks': 'https://i.imgur.com/awcdtg1.png',
  'crude iron': 'https://i.imgur.com/awcdtg1.png',
  'large bone': 'https://i.imgur.com/awcdtg1.png',
  'roots': 'https://i.imgur.com/awcdtg1.png',
  'midnight roots': 'https://i.imgur.com/awcdtg1.png',
  'dragon bone': 'https://i.imgur.com/awcdtg1.png',
  'nugget': 'https://i.imgur.com/awcdtg1.png',
  'oricalchum nugget': 'https://i.imgur.com/awcdtg1.png',
  food: 'https://i.imgur.com/awcdtg1.png',
  iron: 'https://i.imgur.com/awcdtg1.png',
  heroes: 'https://i.imgur.com/awcdtg1.png',
  troops: 'https://i.imgur.com/awcdtg1.png'
}

const events = {
  'wonderland': 'https://i.imgur.com/YFkmaZ3.png (Mariamne)',
  'riddles of wonderland': 'https://i.imgur.com/YFkmaZ3.png (Mariamne)',
  'riddles': 'https://i.imgur.com/YFkmaZ3.png (Mariamne)',
  'knights': 'https://i.imgur.com/gu8LyAx.png (Mariamne)',
  'knights of avalon': 'https://i.imgur.com/gu8LyAx.png (Mariamne)',
  'avalon': 'https://i.imgur.com/gu8LyAx.png (Mariamne)',
  'pirates': 'https://i.imgur.com/anrcuFc.png (Mariamne)',
  'pirates of corellia': 'https://i.imgur.com/anrcuFc.png (Mariamne)',
  'corellia': 'https://i.imgur.com/anrcuFc.png (Mariamne)'
}

module.exports = {
  name: 'levels',
  aliases:['event'],
  description: 'Get best levels for filling elemental chests',
  args: true,
  execute(message, args) {
    if (args.length) {
      const name = getHeroName(args)
      let element = name.toUpperCase();

      let image = events[name.toLowerCase()];
      if (undefined !== image) {
        message.channel.send(`${image}`);
      } else {
        let levels = data[name.toLowerCase()];
        message.channel.send(`Best level(s) for ${element}: ${levels}`);
      }
    }
  }
}