require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require("fs");
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

var botLogChannel = '705223347650297870';
var botLog;

var tutorRoleID = '705200153220350002';
var joinNewTableChannelID = '710609317279039508';

var botCommandsChannel = '705898349638713384';
var joinFriendChannelID = '705909455962898542';

var maxRoomSize = 1;
var roomSizeCounter = 0;

var maxTables = 50;
var tableNumber = 0;
var tableVoiceIDs = [];
var tableTextIDs = [];
var tableRoleIDs = [];
var tableCategoryIDs = [];

var prevAssignedRoom;
var emptyRoomVoiceIDs = [];

var tutorHotlineID = '705984934799474708';

var anonQChannelID = '705572507536719923';
var anonQLogChannelID = '706346422743728141';
var guildID = '705200009817358407';
var guildObject;
var adminCommandsChannelID = '706346075858141227';

bot.on('ready', () => {
	console.info(`Logged in as ${bot.user.tag}!`);
	botLog = bot.channels.cache.get(botLogChannel);
	
	for (var i = 0; i < maxTables; i++){
		tableVoiceIDs.push('0');
		tableTextIDs.push('0');
		tableRoleIDs.push('0');
		tableCategoryIDs.push('0');
	}
	fs.readFile('tableVoiceIDs','utf8', function(err, contents) {
		if (!err){
			var temp = contents.split(',');
			for (var i = 0; i < (temp.length<maxTables?temp.length:maxTables); i++){
				tableVoiceIDs[i] = temp[i];
			}
		}
		prevAssignedRoom = tableVoiceIDs[0];
		tableNumber = tableVoiceIDs.indexOf('0');
		console.log(`${tableNumber} tables loaded`);
		//console.log(tableVoiceIDs);
	});
	fs.readFile('tableTextIDs','utf8', function(err, contents) {
		if (!err){
			var temp = contents.split(',');
			for (var i = 0; i < (temp.length<maxTables?temp.length:maxTables); i++){
				tableTextIDs[i] = temp[i];
			}
		}
		//console.log(tableTextIDs);
	});
	fs.readFile('tableRoleIDs','utf8', function(err, contents) {
		if (!err){
			var temp = contents.split(',');
			for (var i = 0; i < (temp.length<maxTables?temp.length:maxTables); i++){
				tableRoleIDs[i] = temp[i];
			}
		}
		//console.log(tableRoleIDs);
	});
	fs.readFile('tableCategoryIDs','utf8', function(err, contents) {
		if (!err){
			var temp = contents.split(',');
			for (var i = 0; i < (temp.length<maxTables?temp.length:maxTables); i++){
				tableCategoryIDs[i] = temp[i];
			}
		}
		//console.log(tableCategoryIDs);
	});
	fs.readFile('roomSizeLimit','utf8', function(err, contents) {
		if (!err){
			maxRoomSize = contents;
		}
		console.log(maxRoomSize);
	});
	//console.log();
});

function loadIDs(){
	
}

function loadArray(fileName, varName){
	fs.readFile(fileName,'utf8', function(err, contents) {
		if (!err){
			var temp = contents.split(',');
			for (var i = 0; i < (temp.length<maxTables?temp.length:maxTables); i++){
				varName[i] = temp[i];
			}
		}
		//console.log(tableCategoryIDs);
	});
}

bot.on("message", msg => {
	if(msg.author.bot) return;
	if (msg.channel.type == 'dm'){
		if (msg.content.startsWith("!askAnon ")) {
			var content = '';
			if (msg.content.length > 9){
				content = msg.content.substring(9, msg.content.length);
				bot.guilds.cache.get(guildID).channels.cache.get(anonQChannelID).send(`${content}`);
				bot.guilds.cache.get(guildID).channels.cache.get(anonQLogChannelID).send(`${msg.author} asked: \n${content}\n`);
			}
			
		}
	} else
	if (msg.content == "!calltutor") {
		var tutorHotlineChannel = msg.guild.channels.cache.get(tutorHotlineID);
		tutorHotlineChannel.send(`${msg.author} in ${msg.channel.name} requires help\nPlease react if you are going to respond to this`).then(async message => {
			await message.react('✅');
			const collector = message.createReactionCollector(confirmReact, {time:3600000});
			var taken = false;
			collector.on('collect', (reaction, user) => {
				if (!taken && !user.bot){
					var member = message.guild.members.cache.get(user.id);
					message.edit(`${member} is responding to: ${msg.author} in ${msg.channel.name}`);
					taken = true;
				}
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
		
		msg.channel.bulkDelete(number).catch(console.error);
			
	} else
	if (msg.channel.id == adminCommandsChannelID){
		if (msg.content.startsWith("!maketables " )) {
			makeTables(msg).then(() => {writeIDs();});
		} else
		if (msg.content == "!deletetables") {
			console.log(tableVoiceIDs);
			console.log(tableTextIDs);
			console.log(tableRoleIDs);
			console.log(tableCategoryIDs);
			
			deleteTables(msg).then(() => {writeIDs();});
		}
	} else
	if (msg.channel.id === botCommandsChannel){
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
		} else
		if (msg.content.startsWith("!roomsize ")) {
			var number = 1;
			if (msg.content.length > 9){
				number = msg.content.split(' ')[1];
			}
			if (number < 1) {msg.channel.send("Invalid room size, must be equal to or larger than 1");return;}
			maxRoomSize = number;
			msg.channel.send(`Students assigned per room is ${maxRoomSize}`).then(() => {writeIDs();});							
		}
	} else
	if (msg.channel.id === joinFriendChannelID){
		if (msg.content.startsWith("!join ")) {
			var guild = msg.channel.guild;
			var friend = msg.mentions.users.array()[0];
			//console.log(friend);
			if (friend != undefined){
				guild.members.cache.get(friend.id).roles.cache.array().forEach(role => {if (tableRoleIDs.includes(role.id)){
					guild.members.cache.get(msg.author.id).roles.add(role);
				}});
			}			
		} 
	}
});

async function makeTables(msg){
	//return new Promise(resolve => {
		var number = 5;
		if (msg.content.length > 12){
			number = msg.content.split(' ')[1];
		}
		if (number < 1 || number > maxTables) {msg.channel.send(`Invalid number to delete, must be greater than 1 and less than ${maxTables}`);return;} 
		for (var i = 0; i < number; i++){
			await makeRoom(msg.guild);
		}
		//setTimeout(() => resolve(`Made ${number} tables`), 2000);
	//});
}

async function deleteTables(msg){
	//return new Promise(resolve => {
	for (var i = 0; i < tableNumber; i++){
		await deleteRoom(msg.guild, i);
	}
	tableNumber = 0;
		//setTimeout(() => resolve(`Made ${number} tables`), 2000);
	//});
}

function writeIDs(){
	fs.writeFile('tableVoiceIDs',tableVoiceIDs,(data)=>{
		console.log('tableVoiceIDs written');
	});
	fs.writeFile('tableTextIDs',tableTextIDs,(data)=>{
		console.log('tableTextIDs written');
	});
	fs.writeFile('tableRoleIDs',tableRoleIDs,(data)=>{
		console.log('tableRoleIDs written');
	});
	fs.writeFile('tableCategoryIDs',tableCategoryIDs,(data)=>{
		console.log('tableCategoryIDs written');
	});
	fs.writeFile('roomSizeLimit',maxRoomSize,(data)=>{
		console.log('roomSizeLimit written');
	});
}

const confirmReact = (reaction, user) => {
	return reaction.emoji.name === '✅';
};

function makeRoom(guild){
	return new Promise(resolve => {
		tableNumber++;
		var num = tableNumber;
		console.log(`making table ${num}`);
		guild.channels.create(`Table ${num}`, { type: 'category'}) //make category
		.then(category => {
			tableCategoryIDs[num-1] = category.id;
			
			//make text channel
			guild.channels.create(`Table ${num}`, { type: 'text'}) //make text channel
			.then(tChannel => {

				tChannel.setParent(category.id);
				tableTextIDs[num-1] = tChannel.id;
				
				//make Voice channel
				guild.channels.create(`Table ${num}`, { type: 'voice'}) //make voice channel
				.then(vChannel => {
					
					vChannel.setParent(category.id);
					tableVoiceIDs[num-1] = vChannel.id;
					
					//make role
					guild.roles.create({data: {name: `Table ${num}`, color: 'BLUE'}, reason:`moved into room: Table ${num}`, position: 0})
					.then(role => {
						//member.guild.members.cache.get(member.id).roles.add(role.id, `moved into room: Table ${tableNumber}`)
						tableRoleIDs[num-1] = role.id;

						var tutors = guild.roles.cache.get(tutorRoleID);
						category.updateOverwrite(role, { VIEW_CHANNEL: true });
						category.updateOverwrite(tutors, { VIEW_CHANNEL: true });
						category.updateOverwrite(guild.roles.everyone, { VIEW_CHANNEL: false });
						
						vChannel.updateOverwrite(role, { VIEW_CHANNEL: true });
						vChannel.updateOverwrite(tutors, { VIEW_CHANNEL: true });
						vChannel.updateOverwrite(guild.roles.everyone, { VIEW_CHANNEL: false });
						
						tChannel.updateOverwrite(role, { VIEW_CHANNEL: true });
						tChannel.updateOverwrite(tutors, { VIEW_CHANNEL: true });
						tChannel.updateOverwrite(guild.roles.everyone, { VIEW_CHANNEL: false });
						
						console.log(`making table ${num} complete`);
						
					}).catch(console.error);
				}).catch(console.error);
			}).catch(console.error);
		}).catch(console.error);
		setTimeout(() => resolve(`Made table ${num}`), 2000);
	});
}

/*async */function deleteRoom(guild, num){
	//return new Promise(resolve => {
		if (tableVoiceIDs[num] != '0' && tableTextIDs[num] != '0' && tableRoleIDs[num] != '0' && tableCategoryIDs[num] != '0'){
			guild.channels.cache.get(tableVoiceIDs[num]).delete().catch(console.error);
			tableVoiceIDs[num] = '0';
			
			guild.channels.cache.get(tableTextIDs[num]).delete().catch(console.error);
			tableTextIDs[num] = '0';
			
			guild.roles.cache.get(tableRoleIDs[num]).delete().catch(console.error);
			tableRoleIDs[num] = '0';
			
			guild.channels.cache.get(tableCategoryIDs[num]).delete().catch(console.error);
			tableCategoryIDs[num] = '0';
			
			console.log(`Table ${num+1} deleted`)
		}else { 
			console.log(`Table ${num+1} does not exist, skipping delete`);
		}
		//setTimeout(() => resolve(`Made table ${num}`), 2000);
	//});
}

/*function assignRoom(member){
	return new Promise(resolve => {
		for (var i = 0; i < tableNumber; i++){
			if (member.guild.channels.cache.get(tableVoiceIDs[i]).members.size < maxRoomSize){
				var role = member.guild.roles.cache.get(tableRoleIDs[i]);
				var tutors = member.guild.roles.cache.get(tutorRoleID);
				member.setChannel(tableVoiceIDs[i]);
				member.guild.channels.cache.get(tableTextIDs[i]).bulkDelete(99);
				member.guild.channels.cache.get(tableTextIDs[i]).updateOverwrite(tutors, { VIEW_CHANNEL: true });
				member.guild.channels.cache.get(tableVoiceIDs[i]).updateOverwrite(tutors, { VIEW_CHANNEL: true });
				member.guild.members.cache.get(member.id).roles.add(role.id, `moved into room: Table ${tableNumber}`);
				break;
			}
		}
		setTimeout(() => resolve(`Assigned to empty table`), 2000);
	});
}*/

function assignMemberToRoom(member){
	var index = tableVoiceIDs.indexOf(prevAssignedRoom);
	var role = member.guild.roles.cache.get(tableRoleIDs[index]);
	//var tutors = member.guild.roles.cache.get(tutorRoleID);
	member.setChannel(tableVoiceIDs[index]);
	
	//member.guild.channels.cache.get(tableTextIDs[index]).updateOverwrite(tutors, { VIEW_CHANNEL: true });
	//member.guild.channels.cache.get(tableVoiceIDs[index]).updateOverwrite(tutors, { VIEW_CHANNEL: true });
	member.guild.members.cache.get(member.id).roles.add(role.id, `moved into room: Table ${tableNumber}`);
}

function assignRandRoom(member){
	return new Promise(resolve => {
		if (roomSizeCounter >= maxRoomSize){ // prev room is at or over max capacity
			prevAssignedRoom = emptyRoomVoiceIDs[Math.floor(Math.random() * emptyRoomVoiceIDs.length)]; //update room to assign people too
			member.guild.channels.cache.get(tableTextIDs[tableVoiceIDs.indexOf(prevAssignedRoom)]).bulkDelete(99);
		}
		roomSizeCounter++;
		assignMemberToRoom(member);
		setTimeout(() => resolve(`Assigned to empty table`), 2000);
	});
}

/*async function checkEmpty(member){
	if (member.guild.channels.cache.get(member.channelID).members.size == 0 && member.guild.roles.cache.get(tableRoleIDs[index]).members.array().length != 0){
		//console.log(`${member.guild.channels.cache.get(member.channelID).name} size is 0, removing roles from people`);
		var index = tableVoiceIDs.indexOf(member.channelID);
		var tutors = member.guild.roles.cache.get(tutorRoleID);
		member.guild.channels.cache.get(tableTextIDs[index]).bulkDelete(99);
		member.guild.channels.cache.get(tableTextIDs[index]).updateOverwrite(tutors, { VIEW_CHANNEL: false });
		member.guild.channels.cache.get(tableVoiceIDs[index]).updateOverwrite(tutors, { VIEW_CHANNEL: false });
		member.guild.members.cache.get(member.id).roles.remove(tableRoleIDs[index]);
		var roleMembers = member.guild.roles.cache.get(tableRoleIDs[index]).members.array();
		for (var i = 0; i < roleMembers.length; i++){
			//console.log(`removing ${member.guild.channels.cache.get(member.channelID).name} from ${roleMembers[i].name}`);
			roleMembers[i].roles.remove(tableRoleIDs[index]);
		}
	}
}*/

async function updateEmpty(){
	emptyRoomVoiceIDs = [];
	//return new Promise(resolve => {
		for (var i = 0; i < tableNumber; i++){
			if (bot.guilds.cache.get(guildID).channels.cache.get(tableVoiceIDs[i]).members.size == 0 && bot.guilds.cache.get(guildID).roles.cache.get(tableRoleIDs[i]).members.array().length != 0){
				console.log(`${bot.guilds.cache.get(guildID).channels.cache.get(tableVoiceIDs[i]).name} size is 0, removing roles from people`);
				var tutors = bot.guilds.cache.get(guildID).roles.cache.get(tutorRoleID);
				bot.guilds.cache.get(guildID).channels.cache.get(tableTextIDs[i]).bulkDelete(99).catch(console.error);;
				//bot.guilds.cache.get(guildID).channels.cache.get(tableTextIDs[i]).updateOverwrite(tutors, { VIEW_CHANNEL: false });
				//bot.guilds.cache.get(guildID).channels.cache.get(tableVoiceIDs[i]).updateOverwrite(tutors, { VIEW_CHANNEL: false });
				var roleMembers = bot.guilds.cache.get(guildID).roles.cache.get(tableRoleIDs[i]).members.array();
				for (var x = 0; x < roleMembers.length; x++){
					console.log(`removing ${bot.guilds.cache.get(guildID).channels.cache.get(tableVoiceIDs[i]).name} from ${roleMembers[x]}`);
					//console.log(roleMembers);
					await roleMembers[x].roles.remove(tableRoleIDs[i]);
				}
			}
			if (bot.guilds.cache.get(guildID).channels.cache.get(tableVoiceIDs[i]).members.size < maxRoomSize){
				emptyRoomVoiceIDs.push(tableVoiceIDs[i]);
			}
		}
		//setTimeout(() => resolve(`Assigned to empty table`), 2000);
	//});
}

bot.on('voiceStateUpdate', async (oldMember, newMember) => {
	updateEmpty();
	
	if (newMember.channelID == joinNewTableChannelID){
		assignRandRoom(newMember);
	}
	
});