var fs = require('fs');
const Discord = require("discord.js");
const bot = new Discord.Client();

const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));

bot.on('ready', () => {
    console.log(`MoofBot ready. Logged in as ${bot.user.username}#${bot.user.discriminator}`);
});

bot.on('message', msg => {
    if(msg.channel.type === 'dm') return;
    if (msg.content == null || msg.author.bot || msg.content.charAt(0) != '.') return;

    while (msg.content.charAt(0) === '.') { //remove prefix character(s)
        msg.content = msg.content.substr(1);
    }

    if (msg.content === "yt") {
        msg.channel.sendMessage("Hello, world!");
    }
});

bot.login(keys.discord);
