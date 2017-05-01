const fs = require('fs');
const request = require('superagent');
const moment = require("moment");

const Discord = require("discord.js");
const bot = new Discord.Client();

const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));

var botChannel;
bot.on('ready', () => {
    console.log(`MoofBot ready. Logged in as ${bot.user.username}#${bot.user.discriminator}`);
    if ((typeof keys.botChannel) !== null) { //botChannel set
         botChannel = bot.channels.get(keys.botChannel);
    }
});

bot.on('message', msg => {
    if(msg.channel.type === 'dm') return;
    if (msg.content == null || msg.author.bot || msg.content.charAt(0) != '.') return;

    while (msg.content.charAt(0) === '.') { //remove prefix character(s)
        msg.content = msg.content.substr(1);
    }

    if (msg.content == "ping") {
        log("Ping.", msg.author);
        msg.channel.sendMessage("Pong");
    }

    if (msg.content == "cat" || msg.content.match(/kitte(?:n|h)/) !== null) {
        log("Cat requested.", msg.author);
        request.get('http://random.cat/meow').end(function (error, response) {
            if (!error && response.ok) {
                var photo = response.body.file;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomCatEmoji());
            }
        });
    }
    if (msg.content.match(/^dog(?:go|e|gy)?/) !== null || msg.content.match(/^pupp(?:y|er)/) !== null) {
        log("Dog requested.", msg.author);
        request.get('http://random.dog/woof').end(function (error, response) {
            if (!error && response.ok) {
                var photo = "http://random.dog/" + response.text;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomDogEmoji());
            }
        });
    }

    if (msg.content.match(/^r(?:eddit)?img /) !== null) {
        var subreddit = msg.content.split(' ')[1];
        log("Reddit image requested: " + subreddit, msg.author);

        if (keys.bannedSubreddits.indexOf(subreddit) > -1) {
            msg.channel.sendMessage("Sorry, I can't get images from that subreddit.");
            return;
        }

        request.get('https://api.imgur.com/3/gallery/r/' + subreddit)
        .set('Authorization', 'Client-ID ' + keys.imgur)
        .end(function (error, response) { //TODO: make this smart
            if (!error && response.ok) {
                try {
                    var photos = response.body.data;
                    photo = randomArrayItem(photos);
                    if (photo.is_album) {
                        request.get(`https://api.imgur.com/3/album/${photo.id}`)
                        .set('Authorization', 'Client-ID ' + keys.imgur)
                        .end(function (error, response) {
                            photo = randomArrayItem(response.body.data.images);
                            //TODO: if photo.title == "null" omit
                            msg.channel.sendFile(photo.link, photo.link.slice(photo.link.lastIndexOf('/') + 1), photo.title);
                        });
                        return;
                    }
                    if (photo.animated || photo.size >= 8388608) { //8MiB
                        msg.channel.sendMessage(photo.title + '\n' + photo.link);
                        return;
                    }
                    msg.channel.sendFile(photo.link, photo.link.slice(photo.link.lastIndexOf('/') + 1), photo.title);
                } catch (error) {
                    msg.channel.sendMessage("Sorry, an error occurred while getting photos from that subreddit. Try again later.");
                }
            }
        });
    }

    if (msg.content.startsWith('dice')) {
        var dice = msg.content.slice(msg.content.indexOf(' '));
        log(`Dice roll requested: ${dice}`, msg.author);
        request.get('https://rolz.org/api/?' + encodeURIComponent(dice) + '.json')
        .end(function(error, response) {
            if (!error && response.ok) {
                var roll = response.body;
                msg.channel.sendMessage(`${roll.input}: ${roll.result} ${roll.details}`);
            } else {
                msg.channel.sendMessage("Sorry, there was an error computing your dice roll.");
            }
        });
    }

    if (msg.content.startsWith('8ball')) {
        var question = msg.content.slice(msg.content.indexOf(' ') + 1);
        if (question.lastIndexOf('?') != question.length - 1) {
            msg.channel.sendMessage("That is not a question.");
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
                var tmp = msg.channel.sendMessage(`The Magic 8-Ball says: ${reply.answer}`)
                .then(message => {
                    message.react(disposition);
                });
            } else {
                msg.channel.sendMessage("The Magic 8-Ball's window is cloudy.");
            }
        });
    }
});

bot.on('voiceStateUpdate', (oldGuildMember, newGuildMember) => {
    var isJoining = false;
    var isLeaving = false;
    if (typeof(oldGuildMember.voiceChannel) === 'undefined') {isJoining = true;}
    if (typeof(newGuildMember.voiceChannel) === 'undefined') {isLeaving = true;}

    if (isJoining && isLeaving) {return;} //wat
    if ((typeof oldGuildMember.user !== 'undefined' && oldGuildMember.user.bot) ||
        (typeof newGuildMember.user !== 'undefined' && newGuildMember.user.bot)) {
            return; //don't alert for bots
    }

    var now = moment().format('h:mm');
    if (!isJoining && !isLeaving) { //moving
        if (oldGuildMember.voiceChannel.id == newGuildMember.voiceChannel.id) {return;} //muting or something
        botChannel.sendMessage(`[${now}] <@${oldGuildMember.id}> moved from <#${oldGuildMember.voiceChannel.id}> to <#${newGuildMember.voiceChannel.id}>`);
        log(`[${now}] Voice channel move`, oldGuildMember.user);
        return;
    }
    if (isJoining) {
        botChannel.sendMessage(`[${now}] <@${newGuildMember.id}> joined <#${newGuildMember.voiceChannel.id}>`);
        log(`[${now}] Voice channel connect`, newGuildMember.user);
        return;
    }
    if (isLeaving) {
        botChannel.sendMessage(`[${now}] <@${oldGuildMember.id}> left <#${oldGuildMember.voiceChannel.id}>`);
        log(`[${now}] Voice channel disconnect`, oldGuildMember.user);
        return;
    }
});

bot.login(keys.discord);

function randomCatEmoji() {
    return randomArrayItem(["🐱", "🐈", "🐾", "😺", "😸", "😻", "😼", "😽", "🙀", "😾"]);
}

function randomDogEmoji() {
    return randomArrayItem(["🐶", "🐕", "🐾"]);
}

function log(message, requestor) {
    console.log(`${message} [${requestor.username}#${requestor.discriminator}]`);
}

function randomArrayItem(arrayPicker) {
    return arrayPicker[Math.floor(Math.random() * arrayPicker.length)];
}
