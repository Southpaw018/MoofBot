const fs = require('fs');
const request = require('superagent');

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
            if (!error && response.ok) {
                var photo = response.body.file;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomCatEmoji());
            }
        });
    }
    if (msg.content == "dog" || msg.content == "doge" || msg.content == "puppy" || msg.content == "doggo" || msg.content == "pupper") {
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
        .end(function (error, response) {
            if (!error && response.ok) {
                try {
                    var photos = response.body.data;
                    photo = randomArrayItem(photos);
                    if (photo.is_album) {
                        request.get(`https://api.imgur.com/3/album/${photo.id}`)
                        .set('Authorization', 'Client-ID ' + keys.imgur)
                        .end(function (error, response) {
                            photo = randomArrayItem(response.body.data.images);
                            msg.channel.sendFile(photo.link, photo.link.slice(photo.link.lastIndexOf('/') + 1), photo.title);
                        });
                        return;
                    }
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
