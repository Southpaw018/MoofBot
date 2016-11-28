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

    if (msg.content === "yt") {
        msg.channel.sendMessage("Hello, world!");
    }
    if (msg.content == "cat" || msg.content == "kitten" || msg.content == "kitteh") {
        request('http://random.cat/meow', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var photo = JSON.parse(body).file;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomCatEmoji());
            }
        });
    }
    if (msg.content == "dog" || msg.content == "puppy" || msg.content == "doggo" || msg.content == "pupper") {
        request('http://random.dog/woof', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var photo = "http://random.dog/" + body;
                msg.channel.sendFile(photo, photo.slice(photo.lastIndexOf('/') + 1), randomDogEmoji());
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
