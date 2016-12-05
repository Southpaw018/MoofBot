var fs = require('fs');
var http = require('http');
var request = require('request');

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

    if (msg.content == "cat" || msg.content == "kitten" || msg.content == "kitteh") {
        log("Cat requested.", msg.author);
        request('http://random.cat/meow', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var photo = JSON.parse(body).file;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomCatEmoji());
            }
        });
    }
    if (msg.content == "dog" || msg.content == "doge" || msg.content == "puppy" || msg.content == "doggo" || msg.content == "pupper") {
        log("Dog requested.", msg.author);
        request('http://random.dog/woof', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var photo = "http://random.dog/" + body;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomDogEmoji());
            }
        });
    }

    if (msg.content.match(/^redditimg /) !== null) {
        var subreddit = msg.content.split(' ')[1];
        log("Reddit image requested: " + subreddit, msg.author);
        request({
            url: "https://api.imgur.com/3/gallery/r/" + subreddit,
            headers: {
                "Authorization": "Client-ID " + keys.imgur
            }
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var imgurList = body.replace(/^<pre>|<\/pre>$/g, '');
                try {
                    var photos = JSON.parse(imgurList).data;
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
