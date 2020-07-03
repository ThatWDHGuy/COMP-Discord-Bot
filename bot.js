require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
var arraylist = require("arraylist");

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

var botLogChannel = '705223347650297870';

var botLog;

bot.on('ready', () => {
	console.info(`Logged in as ${bot.user.tag}!`);
	botLog = bot.channels.cache.get(botLogChannel);
	console.log(`${botLog}`);
});

bot.on("message", msg => {
	if(msg.author.bot) return;
	if (msg.channel.id === botLogChannel){
		if (msg.content == "!clear") {
			if (msg.member.hasPermission("MANAGE_MESSAGES")) {
				msg.channel.bulkDelete(100).catch(console.error);;
			}
		}
	}
});


var tRooms = [	'705201285959254076',
				'705206668551651449',
				'705206752341393479',
				'705206770271911978',
				'705206790698172438',
				'705206805617180773'];

var tChatRooms = [	'705332973322502144',
					'705333395781058570',
					'705333441847361566',
					'705333471031066664',
					'705333504489291796',
					'705333546557898752'];

var tRoomRoles = [	'705320709127405619',
					'705333064699478067',
					'705333119460311062',
					'705333101789839431',
					'705333176830001154',
					'705333233805426699'];

function checkEmpty(roomID, roomChatID){
	
	if(bot.channels.cache.get(roomID).members.size == 0){
		bot.channels.cache.get(roomChatID).bulkDelete(100).then(messages => {if (messages.size > 0){console.log(`Bulk deleted ${messages.size} messages`);}}).catch(console.error);
	}
}

function updateRoles(roomID, roleID){
	bot.channels.cache.get(roomID).members.forEach(member => {
		member.roles.add(roleID);
		membersInRoom.push(member.id);
	});
}

var membersInRoom;
bot.on('voiceStateUpdate', (oldMember, newMember) => {
	//console.log(bot.channels.fetch(tRoom1));
	membersInRoom = [];
	
	for (var i = 0; i < tRooms.length; i++){
		checkEmpty(tRooms[i], tChatRooms[i]);
		updateRoles(tRooms[i], tRoomRoles[i]);
	}
	
	newMember.guild.members.cache.forEach(member => {
		if (!membersInRoom.includes(member.id)){
			//console.log(`${member.id} not in tutor room`);
			member.roles.remove(tRoomRoles)
		} else {
			//console.log(`${member.id} currently in tutor room`);
		}
	});
	
});