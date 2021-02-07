const Discord = require('discord.js');
const token = require("./token.js");

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//Respose example
var scrims = {};

client.on('message', msg => {
  if (msg.content.startsWith('!scrim')) {

    //Default
    var playerSlots = 6;

    //Allow grabbing number from message content
    var numberInContent = msg.content.split(" ").find(seg => !isNaN(parseInt(seg)));
    if (numberInContent) {
      playerSlots = parseInt(numberInContent);
    }

    //Create new scrim
    var promptText = `Scrim created with ${playerSlots} slots. Add Reaction to join!`;
    msg.reply(promptText).then(scrimMsg => {
      scrims[scrimMsg.id] = new Scrim(scrimMsg, playerSlots);
    })
  }
});

class Scrim {
  constructor(scrimMsg, maxPlayers) {
    this.message = scrimMsg;
    this.maxPlayers = maxPlayers;
    this.players = [];
  }

  addPlayer(id) {
    var index = this.players.indexOf(id);
    if (true /*index === -1 && this.players.length < this.maxPlayers*/) { //TODO: PUT ME BACK
      this.players.push(id);
      this.notifyChannel();
      if (this.players.length === this.maxPlayers) {
        this.handleFullMatch();
      }
    }
  }

  removePlayer(id) {
    var index = this.players.indexOf(id);
    this.players.splice(index, 1);
    this.notifyChannel();
  }

  notifyChannel() {
    var areText = this.players.length === 1 ? "is": "are";
    var playersText = this.players.length === 1 ? "player": "players";
    this.message.channel.send(`There ${areText} now ${this.players.length} ${playersText} in the Scrim.`);
  }


  handleFullMatch() {
    //Divide the teams
    var teamOne = [];
    var teamTwo = [];
    var shuffledPlayers = shuffle([...this.players]);

    shuffledPlayers.forEach((player,i) => {

      var tag = "<@" + player + ">";

      if (i % 2) {
        teamOne.push(tag);
      } else {
        teamTwo.push(tag);
      }
    });

    //Send message that the match is full
    this.message.channel.send([
      "",
      `*** SCRIM TEAMS ***`,
      `Team One: ${teamOne.join(", ")}`,
      `**VS**`,
      `Team Two: ${teamTwo.join(", ")}`
    ]).then(() => {

      this.message.edit("Scrim filled!");

      delete scrims[this.message.id]
    })
  }
}


client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
    // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
    try {
      await reaction.fetch();
    } catch (error) {
      console.log('Something went wrong when fetching the message: ', error);
      return;
    }
  }

  // Now the message has been cached and is fully available
  var scrim = scrims[reaction.message.id];
  if (scrim) {
    scrim.addPlayer(user.id);
  }
});


client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.partial) {
    // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
    try {
      await reaction.fetch();
    } catch (error) {
      console.log('Something went wrong when fetching the message: ', error);
      return;
    }
  }

  // Now the message has been cached and is fully available
  var scrim = scrims[reaction.message.id];
  if (scrim) {
    scrim.removePlayer(user.id);
  }
});


function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
//Credit: https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array


client.login(token);


