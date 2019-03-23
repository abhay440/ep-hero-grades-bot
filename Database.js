const Airtable = require('airtable')
const base = new Airtable({apiKey: process.env.AIRTABLEAPI}).base(process.env.AIRTABLEBASE)
const Logger = require('./Logger')

const titanBase = base('Titan Grades')
const defenseBase = base('Defense Grades')
const offenseBase = base('Offense Grades')
const overview = base('Overview')

function getHeroData(hero, record, message) {
  const data = {};
  data.heroName = hero
  data.overallGrade = record.get('Overall')

  data.oTitan = record.get('Overall Titan')
  data.oDefense = record.get('Overall Defense')
  data.oOffense = record.get('Overall Offense')
  data.element = record.get('Element')
  data.class = record.get('Class')
  data.family = record.get('Family')
  data.stars = record.get('Stars')
  
  //data.power = record.get('Power')
  
  data.attack = record.get('Attack')
  data.defense = record.get('Defense')
  data.health = record.get('Health')

  data.special = record.get('Special')
  
  //data.specialName = record.get('Special Name')[0]
  
  data.mana = record.get('Mana')
  
  //data.limited = record.get('Limited')[0] === 'TRUE' ? 'Yes' : 'No'

  data.limited = record.get('Hero Type').toLowerCase() === 'normal' ? 'No' : 'Yes'

  return Logger.success['info'](message, data)
}

function getInfo(hero, message) {
  let count = 0
  overview.select({
    view: 'Grid view',
    filterByFormula: `TRUE({ID} = '${hero}')`,
  }).eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function (record) {
        let heroName = record.get('ID');
        if (heroName !== undefined  && heroName.toLowerCase() === hero) {
          count++
          try {
            getHeroData(heroName, record, message)
          }
          catch (err) {
            Logger.error(hero, err, message)
          }
        }
      })
      fetchNextPage()
    },
    function done(err) {
      if (err) {
        Logger.error(hero, err, message)
      }
      if (count === 0) {
        Logger.noData(message, hero)
      }
    }
  )
}

function getTitan(hero, message) {
  let count = 0
  titanBase.select({
    view: 'Grid view',
    filterByFormula: `TRUE({ID} = '${hero}')`,
  }).eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function (record) {
        let heroName = record.get('ID')
        if (heroName.toLowerCase() === hero) {
          count++
          const data = {}
          data.heroName = heroName
          data.overallGrade = record.get('Overall')
          data.stamina = record.get('Stamina')
          data.passive = record.get('Passive')
          data.direct = record.get('Direct')
          data.tiles = record.get('Tiles')
          data.versatility = record.get('Versatility')
          Logger.success['titan'](message, data)
        }
      })
      fetchNextPage()
    },
    function done(err) {
      if (err) {
        Logger.error(hero, err)
      }
      if (count === 0) {
        Logger.noData(message, hero)
      }
    }
  )
}

function getDefense(hero, message) {
  let count = 0
  defenseBase.select({
    view: 'Grid view',
    filterByFormula: `TRUE({ID} = '${hero}')`,
  }).eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function (record) {
        let heroName = record.get('ID')
        if (heroName.toLowerCase() === hero) {
          count++
          const data = {}
          data.heroName = heroName
          data.overallGrade = record.get('Overall')
          data.speed = record.get('Speed')
          data.effect = record.get('Effect')
          data.stamina = record.get('Stamina')
          data.strength = record.get('Strength')
          data.tank = record.get('Tank')
          data.support = record.get('Support')
          Logger.success['defense'](message, data)
        }
      })
      fetchNextPage()
    },
    function done(err) {
      if (err) {
        Logger.error(hero, err)
      }
      if (count === 0) {
        Logger.noData(message, hero)
      }
    }
  )
}

function getOffense(hero, message) {
  let count = 0
  offenseBase.select({
    view: 'Grid view',
    filterByFormula: `TRUE({ID} = '${hero}')`,
  }).eachPage(
    function page(records, fetchNextPage) {
      records.forEach(function (record) {
        let heroName = record.get('ID')
        if (heroName.toLowerCase() === hero) {
          count++
          const data = {}
          data.heroName = heroName
          data.overallGrade = record.get('Overall')
          data.speed = record.get('Speed')
          data.effect = record.get('Effect')
          data.stamina = record.get('Stamina')
          data.war = record.get('War')
          data.versatility = record.get('Versatility')
          Logger.success['offense'](message, data)
        }
      })
      fetchNextPage()
    },
    function done(err) {
      if (err) {
        Logger.error(hero, err)
      }
      if (count === 0) {
        Logger.noData(message, hero)
      }
    }
  )
}

module.exports = {getInfo, getTitan, getDefense, getOffense}