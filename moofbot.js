const fs = require('fs');
const request = require('superagent');
const moment = require("moment");

const {Client, Intents} = require('discord.js');
const bot = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGES
	]
});

const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));

bot.on('ready', () => {
    log(`MoofBot ready.`, bot.user);

});

//Bot commands
bot.on('messageCreate', msg => {
    if(msg.channel.type === 'dm') return;
    if (msg.content == null || msg.author.bot || msg.content.charAt(0) != '.') return;

    while (msg.content.charAt(0) === '.') { //remove prefix character(s)
        msg.content = msg.content.substr(1);
    }

    if (msg.content == "ping") {
        log("Ping.", msg.author);
        msg.channel.send("Pong");
    }

    if (msg.content.startsWith('dice') || msg.content.startsWith('roll')) { //https://rolz.org/help/api
        var dice = msg.content.slice(msg.content.indexOf(' ') + 1).replace(/\s/g, '');
        log(`Dice roll requested: ${dice}`, msg.author);
        request.get('https://rolz.org/api/?' + dice + '.json')
        .end(function(error, response) {
            if (!error && response.ok) {
                var roll = response.body;
				if (roll.details.length > 100) {
					msg.channel.send(`${roll.input}: ${roll.result} (Details over 100 characters. Skipping.)`);
				}
				else {
					msg.channel.send(`${roll.input}: ${roll.result} ${roll.details}`);
				}
            } else {
                msg.channel.send("Sorry, there was an error computing your dice roll.");
            }
        });
    }

    if (msg.content.startsWith('8ball')) { //https://8ball.delegator.com/
        var question = msg.content.slice(msg.content.indexOf(' ') + 1);
        if (question.lastIndexOf('?') != question.length - 1) {
            msg.channel.send("That is not a question.");
            return;
        }
        log(`Magic 8 Ball: ${question}`, msg.author);
        request.get('https://8ball.delegator.com/magic/JSON/' + encodeURIComponent(question))
        .end(function(error, response) {
            if (!error && response.ok) {
                var reply = response.body.magic;
                var disposition;
                switch (reply.type) {
                    case "Affirmative":
                        disposition = "😃";
                        break;
                    case "Contrary":
                        disposition = "🙁";
                        break;
                    default: //"Neutral"
                        disposition = "😐";
                        break;
                }
                var tmp = msg.channel.send(`The Magic 8-Ball says: ${reply.answer}`)
                .then(message => {
                    message.react(disposition);
                });
            } else {
                msg.channel.send("The Magic 8-Ball's window is cloudy.");
            }
        });
    }
});

//Steam link rewriter
bot.on('messageCreate', msg =>  {
	if (msg.author.bot) return;
    var storeLinkTest = msg.content.match(/https:\/\/store\.steampowered\.com\/app\/(\d+)\/.*/);
    if (storeLinkTest !== null)  {
        log("Rewriting Steam store link: app " + storeLinkTest[1], msg.author);
        msg.channel.send("Steam client link: steam://advertise/" + storeLinkTest[1]);
    }
    var storeLinkTest = msg.content.match(/https:\/\/store\.steampowered\.com\/bundle\/(\d+)\/.*/);
    if (storeLinkTest !== null)  {
        log("Rewriting Steam store link: bundle " + storeLinkTest[1], msg.author);
        msg.channel.send("Steam client link: steam://openurl/"+ storeLinkTest[0]);
    }

});

//Connection logging
bot.on('shardDisconnect', (CloseEvent) => {
    log(`Bot disconnected.`, bot);
    bot.login(keys.discord);
});
bot.on('shardError', (ErrorEvent) => {
    log(`Bot connection error.`, bot);
    //bot.login(keys.discord);
});
bot.on('shardReconnecting', () => {
    log(`Bot reconnecting....`, bot);
});
bot.on('shardResume', () => {
    log(`Bot connection restored.`, bot);
});
bot.on('shardReady', () => {
    log(`Bot connection ready.`, bot);
});

//Code's done, log in
bot.login(keys.discord);

//Support functions
function log(message, requestor) {
    var now = moment().format('h:mm');
    if (typeof requestor !== 'object') {
        console.log(`[${now}] ${message} [null]`);
        return;
    }
    if (typeof message.channel !== 'object') {
        console.log(`[${now}] ${message} [${requestor.username}#${requestor.discriminator}]`);
        return;
    }

    console.log(`[${now}] ${message.guild.name}${message.channel.name}: ${message} [${requestor.username}#${requestor.discriminator}]`);
}
