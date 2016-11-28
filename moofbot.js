var fs = require('fs');
const Discord = require("discord.js");
const bot = new Discord.Client();

const token = JSON.parse(fs.readFileSync('token.json', 'utf8')).token;

bot.on('ready', () => {
    console.log(`MoofBot ready. Logged in as ${bot.user.username}#${bot.user.discriminator}`);
});

bot.on('message', msg => {
    if(msg.channel.type === 'dm') return;
    if (msg.content != null && !msg.author.bot) {
        if (msg.content.charAt(0) == '.') { //prefix check
            while (msg.content.charAt(0) === '.') { //remove prefix character(s)
                msg.content = msg.content.substr(1);
            }

            if (msg.content === "yt") {
                msg.channel.sendMessage("Hello, world!");
            }
        }
    }
});

bot.login(token);
