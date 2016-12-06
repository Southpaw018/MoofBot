var fs = require('fs');
var http = require('http');
var request = require('superagent');

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

    if (msg.content == "ping") {
        log("Ping.", msg.author);
        msg.channel.sendMessage("Pong");
    }

    if (msg.content == "cat" || msg.content == "kitten" || msg.content == "kitteh") {
        log("Cat requested.", msg.author);
        request.get('http://random.cat/meow').end(function (error, response) {
            if (!error && response.statusCode == 200) {
                var photo = response.body.file;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomCatEmoji());
            }
        });
    }
    if (msg.content == "dog" || msg.content == "doge" || msg.content == "puppy" || msg.content == "doggo" || msg.content == "pupper") {
        log("Dog requested.", msg.author);
        request.get('http://random.dog/woof').end(function (error, response) {
            if (!error && response.statusCode == 200) {
                var photo = "http://random.dog/" + response.text;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomDogEmoji());
            }
        });
    }

    if (msg.content.match(/^r(?:eddit)?img /) !== null) {
        var subreddit = msg.content.split(' ')[1];
        log("Reddit image requested: " + subreddit, msg.author);

        request.get('https://api.imgur.com/3/gallery/r/' + subreddit)
        .set('Authorization', 'Client-ID ' + keys.imgur)
        .end(function (error, response) {
            if (!error && response.statusCode == 200) {
                try {
                    var photos = response.body.data;
                    photo = photos[Math.floor(Math.random() * photos.length)];
                    msg.channel.sendFile(photo.link, photo.link.slice(photo.link.lastIndexOf('/') + 1), photo.title);
                } catch (error) {
                    msg.channel.sendMessage("Sorry, an error occurred while getting photos from that subreddit. Try again later.");
                }
            }
        });
    }
});

bot.login(keys.discord);

function randomCatEmoji() {
    var catEmojis = ["🐱", "🐈", "🐾", "😺", "😸", "😻", "😼", "😽", "🙀", "😾"];
    return catEmojis[Math.floor(Math.random() * catEmojis.length)];
}

function randomDogEmoji() {
    var dogEmojis = ["🐶", "🐕", "🐾"];
    return dogEmojis[Math.floor(Math.random() * dogEmojis.length)];
}

function log(message, requestor) {
    //console.log(message + " [" + requestor.username + "#" + requestor.discriminator + "]");
    console.log(`${message} [${requestor.username}#${requestor.discriminator}]`);
}
