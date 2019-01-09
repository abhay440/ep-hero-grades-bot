require('dotenv').config()
const fs = require('fs')
const Discord = require('discord.js')
const prefix = process.env.PREFIX
const token = process.env.TOKEN

const client = new Discord.Client()
client.commands = new Discord.Collection()

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}

client.once('ready', () => {
  console.log(`Ready!`)
})

client.on('guildMemberAdd', member => {
  // Send the message to a designated channel on a server:
  const channel = member.guild.channels.find(ch => ch.name === 'general')
  const welcomeChannel = member.guild.channels.find(ch => ch.name === 'welcome')

  // Do nothing if the channel wasn't found on this server
  if (!channel) return
  // Send the message, mentioning the member
  channel.send(`Welcome to the ${member.guild.name} Discord server, ${member}! Be sure to check out the ${welcomeChannel} channel for helpful server information.`)
})

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return
  const args = message.content.slice(prefix.length).split(/ +/)
  const commandName = args.shift().toLowerCase()
  if (!client.commands.has(commandName)) return
  const command = client.commands.get(commandName)
  console.log(`Executing command: ${command.name} ...`)
    try {
      command.execute(message, args)
    }
    catch (err) {
      console.error('Something went wrong while executing the command', err)
    }
})

client.login(token).then(() => console.log('Successfully logged in')).catch(error => console.error(error))
