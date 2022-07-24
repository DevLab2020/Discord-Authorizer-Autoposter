require('dotenv').config();
const Discord = require("discord.js");
const config = require("./config.json");
const schedule = require('node-schedule');
const fs = require('fs');
const client = new Discord.Client({
	partials: ["MESSAGE","CHANNEL", "REACTION"],
	intents: ["GUILDS", "GUILD_MESSAGES","GUILD_MESSAGE_REACTIONS"]
});
//command prefix, change for your bot to react to different message prefixes. !command ~command /command
const prefix = "/";
//load unique IDs from environment file
const roleID = process.env.roleID;
const messageID = process.env.messageID;
const channelID = process.env.channelID;
const guildID = process.env.guildID;
const tagDir = process.env.tagDir;
postNum = 0;
//subreddit list, must be 3
subList = ['technology', 'tech', 'futurology'];
subNum = 0;
sub = subList[subNum];

// Initialize the bot
client.once('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
//      post every minute debugger	
//	schedule.scheduleJob('*/1 * * * *',function(triggerEvent){
//		newTechPost();
//	});
	schedule.scheduleJob('0,41 */2 * * *',function(triggerEvent){
		console.log('event1: '+triggerEvent);
		newTechPost();
	});
	schedule.scheduleJob('21 1,3,5,7,9,11,13,15,17,19,21,23 * * *',function(triggerEvent2){
		console.log('event2: '+triggerEvent2);
		newTechPost();
	});
});

//advance the json index for next pull
function nextPost(){
if(postNum < 2){
                postNum += 1;
        }
        else{
                postNum = 0;
                if(subNum < 2){
                        subNum +=1;
                }else{
                        subNum = 0;
                }
                sub = subList[subNum];
        }
}

//new article post initializer
function newTechPost(){
	const guild = client.guilds.cache.get(guildID);
	const channel = client.channels.cache.get(channelID);
	//console.log(subNum);
	getAndReply(postNum, guild, channel, sub);
	nextPost();
}

// Check if the post has already been posted
function checkIfPosted(obj){
        let checkerVar = false;
        let jsonCheck = fs.readFileSync(tagDir+'alreadyPosted.json');
        postPosted = JSON.parse(jsonCheck);
        //compare every URL in alreadyPosted with obj.url
        for(var i=0;i<postPosted.length;i++){
                if(postPosted[i].URL===obj.URL){
                        checkerVar = true;
                }
        }
        if(checkerVar === true){
                nextPost();
                return true;
        }else{
                return false;
        }
}

// Main post function
function getAndReply(postNum, guild, channel, sub){
        fs.readFile(tagDir+'datadump-'+sub+'.json', 'utf8', function(err, data){
                json = JSON.parse(data);
                for(let i = postNum; i < (postNum+1); i++) {
                        let obj = json[i];
			var hasBeenPosted = checkIfPosted(obj);
			if(hasBeenPosted === true){
				break;
			}
                        let msgText = obj.text.toString()+"\n";
                        let msgLink = obj.link.toString()+"\n";
                        let redditUrl = "<https://reddit.com/"+obj.URL.toString()+">\n";
			channel.send(msgText+msgLink+redditUrl);
			let jsonImport = fs.readFileSync(tagDir+'alreadyPosted.json');
			newData = JSON.parse(jsonImport);
			newData.push(obj);
			let jsonData = JSON.stringify(newData,null,2);
			fs.writeFileSync(tagDir+'alreadyPosted.json',jsonData);
		}
	});
}

// reaction event capture initializer
const events = {
	MESSAGE_REACTION_ADD: 'messageReactionAdd',
};

// Function when a client adds the reaction
client.on('messageReactionAdd', async (reaction, user) => {
	if (reaction.message.partial) {
		try {
			await reaction.message.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message: ', error);
		}
	}

	console.log(`${user.username} reacted with "${reaction.emoji.name}".`);
// The only working method I found to match was to copy and paste the emoji
	if (reaction.emoji.name ==='💻'){
		const guild = client.guilds.cache.get(guildID);
		guild.members.fetch(user.id).then(guildmember => guildmember.roles.add(roleID));
	}

});

// Capture messages
// Custom bot commands
client.on("messageCreate", function(message) {
	if (message.author.client) return;
	if (!message.content.startsWith(prefix)) return;

	const commandBody = message.content.slice(prefix.length);
	const args = commandBody.split(' ');
	const command = args.shift().toLowerCase();

	if (command === "ping") {
		const timeTaken = Date.now() - message.createdTimestamp;
		message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
	}

	else if (command === "sum") {
		const numArgs = args.map(x => parseFloat(x));
		const sum = numArgs.reduce((counter, x) => counter += x);
		message.reply(`The sum of all the arguments you provided is ${sum}!`);
	}

	else if (command === "help"){
		message.reply("This will be a help menu, type /commands for a list of commands.")}
	else if (command === "commands"){
		message.reply("commands:"+"\n"+"/ping"+"\n"+"/sum");
	}

});

client.login(config.BOT_TOKEN);
