const heroes = require('../heroes')
const Chance = require('chance');

const chance = new Chance();

const pullType = {
  CLASSIC: ['Legendary', 'Epic', 'Rare'],
  ATLANTIS: ['Legendary', 'Epic', 'Rare', 'Rare Atlantis', 'Epic Atlantis', 'Legendary Atlantis', 'Featured Legendary'],
  GRIMFOREST: ['Legendary', 'Epic', 'Rare', 'Epic Grimforest', 'Legendary Grimforest'],
  PIRATES: ['Legendary', 'Epic', 'Rare', 'Epic Pirates', 'Legendary Pirates'],
  AVALON: ['Legendary', 'Epic', 'Rare', 'Epic Avalon', 'Legendary Avalon'],
  GUARDIANS: ['Legendary', 'Epic', 'Rare', 'Epic Guardians', 'Legendary Guardians'],
  WONDERLAND: ['Legendary', 'Epic', 'Rare', 'Epic Wonderland', 'Legendary Wonderland', 'Rare Wonderland']
}

const appearanceRates = {
  CLASSIC: [1.5, 26.5, 72],
  ATLANTIS: [1, 11.9, 21.8, 49.2, 14.6, 0.2, 1.3],
  GRIMFOREST: [1.5, 20.8, 71, 5.7, 1],
  PIRATES: [1.5, 20.8, 71, 5.7, 1],
  AVALON: [1.5, 20.8, 71, 5.7, 1],
  GUARDIANS: [1.5, 20.8, 71, 5.7, 1],
  WONDERLAND: [1.5, 20.8, 63.1, 5.7, 1, 7.9]
}

const events = {
  GRIMFOREST: 'GRIMFOREST',
  FABLES: 'GRIMFOREST',
  PIRATES: 'PIRATES',
  CORELLIA: 'PIRATES',
  AVALON: 'AVALON',
  KNIGHTS: 'AVALON',
  GUARDIANS: 'GUARDIANS',
  TELTOC: 'GUARDIANS',
  WONDERLAND: 'WONDERLAND',
  RIDDLES: 'WONDERLAND',
  ATLANTIS: 'ATLANTIS',
  CLASSIC: 'CLASSIC'
}

const eventTypes = {
  CLASSIC: 'Epic',
  ATLANTIS: 'Atlantis',
  GRIMFOREST: 'Fables of Grimforest',
  PIRATES: 'Pirates of Corellia',
  AVALON: 'Knights of Avalon',
  GUARDIANS: 'Guardians of Teltoc',
  WONDERLAND: 'Riddles of Wonderland'
}

/**
 * Represents a summon
 * @constructor
 * @param {string} optional count of 10
 * @param {string} optional option - One of [classic, atlantis]
 */
class Summon {
  constructor(count = '1', option = 'CLASSIC') {
    this.option = option.toUpperCase()
    this.count = count
  }

  static rarity(opt) {
    return chance.weighted(pullType[opt], appearanceRates[opt])
  }

  static allowBonusDraw() {
    return chance.weighted([true, false],[1.3, 98.7])
  }

  static getHero(opt) {

    let option = opt
    let r = Summon.rarity(option);
    let hero = `${chance.pickone(heroes[r])} (**${r}**)`
    let allowBonus = Summon.allowBonusDraw()
    let result = hero
    if (allowBonus !== false) {
      result = hero.concat(` + BONUS HOTM`)
    }
    return result
  }

  pull() {
    var summonOption;
    if (this.count === '10' || this.count === '30') {
      summonOption = this.option.toUpperCase();
    } else {
      summonOption = this.count.toUpperCase();
    }

    if (Object.keys(events).indexOf(summonOption) != -1) {
      summonOption = events[summonOption]
    }

    if (Object.keys(pullType).indexOf(summonOption) == -1) {
      summonOption = 'CLASSIC';
    }

    const msg = `Here is the result of your ${eventTypes[summonOption]} summon: \n`
    const heroes = []

    if (this.count === '10') {
      let x = 10
      for (let i = 0; i < x; i++) {
        heroes.push(`${i + 1}) ${Summon.getHero(summonOption)}`)
      }
      return msg + heroes.join('\n')
    }

    if (this.count === '30' && this.option === 'ATLANTIS') {
      let x = 30
      for (let i = 0; i < x; i++) {
        heroes.push(`${i + 1}) ${Summon.getHero(summonOption)}`)
      }
      return msg + heroes.join('\n')
    }

    heroes.push(Summon.getHero(summonOption))
    return msg + heroes
  }
}

module.exports = {
  name: 'summon',
  description: 'Test your luck and summon a hero without actually summoning a hero!',
  args: true,
  execute(message, args) {
    const summon = new Summon(args[0], args[1])
    message.reply(summon.pull())
  }
}
