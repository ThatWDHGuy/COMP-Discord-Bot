require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

var botLogChannel = '705223347650297870';
var botLog;

var tutorRoleID = '705200153220350002';
var joinNewTableChannelID = '705201152249167953';

var botCommandsChannel = '705898349638713384';
var joinFriendChannelID = '705909455962898542';

var tableNumber = 0;
var tableVoiceIDs = [];
var tableTextIDs = [];
var tableRoleIDs = [];

var tutorHotlineID = '705984934799474708';

bot.on('ready', () => {
	console.info(`Logged in as ${bot.user.tag}!`);
	botLog = bot.channels.cache.get(botLogChannel);
});

bot.on("message", msg => {
	if(msg.author.bot) return;
	if (msg.content == "!calltutor") {
		var tutorHotlineChannel = msg.guild.channels.cache.get(tutorHotlineID);
		tutorHotlineChannel.send(`${msg.author} in ${msg.channel.name} requires help\nPlease react if you are going to respond to this`).then(message => {
			const collector = message.createReactionCollector(confirmReact, {time:3600000});
			message.react('✅');
			collector.on('collect', (reaction, user) => {
				var member = message.guild.members.cache.get(user.id);
				message.edit(`${member} is responding to: ${msg.author} in ${msg.channel.name}`);
				//console.log(`Collected ${reaction.emoji.name} from ${member.id}`);
			});
			
			collector.on('end', collected => {
				message.delete();
			});
			
		}).catch(console.error);
		msg.channel.send("The tutors have been notified, someone will be with you as soon as possible");
	} else
	if (msg.content.startsWith("!clear")) {
		var number = 99;
		if (msg.content.length > 6){
			number = msg.content.split(' ')[1];
		}
		
		if (!msg.member.hasPermission("MANAGE_MESSAGES")) {
			msg.channel.send("You dont have permission to do that");
			return;
		}
		if (number > 99 || number < 1) {msg.channel.send("Invalid number to delete, must be between 1 and 99");return;} 
		number = Number(number) + 1
		
		msg.channel.bulkDelete(number).catch(console.error);;
			
	} else
	if (msg.channel.id === botCommandsChannel){
		if (msg.content == "!closeall") {
			for (var i = 0; i < tableVoiceIDs.length; i++){
				checkEmpty(tableVoiceIDs[i], tableTextIDs[i], tableRoleIDs[i], true);
			}
			if (tableVoiceIDs.length == 0) tableNumber = 0;
		} else
		if (msg.content == "!enabletables") {
			var joinTableChan = msg.guild.channels.cache.get(joinNewTableChannelID);
			var joinFriendChannel = msg.guild.channels.cache.get(joinFriendChannelID);
			joinFriendChannel.updateOverwrite(msg.guild.roles.everyone, { VIEW_CHANNEL: true });
			joinTableChan.updateOverwrite(msg.guild.roles.everyone, { VIEW_CHANNEL: true });
		} else
		if (msg.content == "!disabletables") {
			var joinTableChan = msg.guild.channels.cache.get(joinNewTableChannelID);
			var joinFriendChannel = msg.guild.channels.cache.get(joinFriendChannelID);
			joinFriendChannel.updateOverwrite(msg.guild.roles.everyone, { VIEW_CHANNEL: false });
			joinTableChan.updateOverwrite(msg.guild.roles.everyone, { VIEW_CHANNEL: false });
		}
	} else
	if (msg.channel.id === joinFriendChannelID){
		console.log(msg);
		if (msg.content.startsWith("!join ")) {
			var guild = msg.channel.guild;
			var friend = msg.mentions.users.array()[0];
			console.log(friend);
			if (friend != undefined){
				guild.members.cache.get(friend.id).roles.cache.array().forEach(role => {if (tableRoleIDs.includes(role.id)){
					guild.members.cache.get(msg.author.id).roles.add(role);
				}});
			}			
		} 
	}
});

const confirmReact = (reaction, user) => {
	return reaction.emoji.name === '✅';
};

function checkEmpty(voiceRoomID, textRoomID, roleID, override){
	if(bot.channels.cache.get(voiceRoomID).members.size == 0 || override == true){
		var guild = bot.channels.cache.get(voiceRoomID).guild;
		guild.channels.cache.get(voiceRoomID).delete().catch(console.error);
		tableVoiceIDs.splice(tableVoiceIDs.indexOf(voiceRoomID), 1);//remove table voice chat from list of current voice tables
		
		guild.channels.cache.get(textRoomID).delete().catch(console.error);
		tableTextIDs.splice(tableTextIDs.indexOf(textRoomID), 1); //remove table text chat from list of current text tables
				
		guild.roles.cache.get(roleID).delete().catch(console.error);
		tableRoleIDs.splice(tableRoleIDs.indexOf(roleID), 1); //remove role from list of roles
	}
}

function assignRoom(member){
	tableNumber++;
	var newVC = null;
	var newTC = null;
	
	//make text channel
	member.guild.channels.create(`Table ${tableNumber}`, { type: 'text'}) //make text channel
	.then(tChannel => {
		let category = member.guild.channels.cache.find(c => c.name == "tables" && c.type == "category"); //move channel to category

		if (!category) throw new Error("Category channel does not exist");
		tChannel.setParent(category.id);
		tableTextIDs.push(tChannel.id);
		newTC = tChannel;
		
		//make Voice channel
		member.guild.channels.create(`Table ${tableNumber}`, { type: 'voice'}) //make voice channel
		.then(vChannel => {
			
			let category = member.guild.channels.cache.find(c => c.name == "tables" && c.type == "category"); //move channel to category

			if (!category) throw new Error("Category channel does not exist");
			vChannel.setParent(category.id);
			tableVoiceIDs.push(vChannel.id);
			member.setChannel(vChannel.id); 
			newVC = vChannel;
			
			//make role
			member.guild.roles.create({data: {name: `Table ${tableNumber}`, color: 'BLUE'}, reason:`moved into room: Table ${tableNumber}`, position: 0})
			.then(role => {
				member.guild.members.cache.get(member.id).roles.add(role.id, `moved into room: Table ${tableNumber}`)
				tableRoleIDs.push(role.id);

				var tutors = member.guild.roles.cache.get(tutorRoleID);
				newVC.updateOverwrite(role, { VIEW_CHANNEL: true })
				newVC.updateOverwrite(tutors, { VIEW_CHANNEL: true });
				newVC.updateOverwrite(member.guild.roles.everyone, { VIEW_CHANNEL: false });
				newTC.updateOverwrite(role, { VIEW_CHANNEL: true });
				newTC.updateOverwrite(tutors, { VIEW_CHANNEL: true })
				newTC.updateOverwrite(member.guild.roles.everyone, { VIEW_CHANNEL: false });
				
			}).catch(console.error);
		}).catch(console.error);
	}).catch(console.error);
}

var membersInRoom;
bot.on('voiceStateUpdate', (oldMember, newMember) => {
	
	for (var i = 0; i < tableVoiceIDs.length; i++){
		checkEmpty(tableVoiceIDs[i], tableTextIDs[i], tableRoleIDs[i], false);
	}
	if (tableVoiceIDs.length == 0) tableNumber = 0;
	
	if (newMember.channelID == joinNewTableChannelID){
		assignRoom(newMember);
	}
	
});