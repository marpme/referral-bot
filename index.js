const Discord = require('discord.js')
const client = new Discord.Client()
const jf = require('jsonfile-promised')
const moment = require('moment')

jf.readFile('./referrals.json').then(referrals => {
	let guild
	let invites
	let newReferrals

	client.on('ready', () => {
		console.log(`Connected as ${client.user.tag}`)
		guild = client.guilds.find('id', '348155543199678468')
		newReferrals = referrals
		invites = guild.fetchInvites().then(collection =>
			collection.map(({ code, uses }) => ({
				[code]: uses,
			}))
		)

		setInterval(() => {
			console.log('fetch new invites!')
			invites = guild.fetchInvites().then(collection =>
				collection.map(({ code, uses }) => ({
					[code]: uses,
				}))
			)
		}, 10000)
	})

	client.on('guildMemberAdd', member => {
		Promise.all([
			guild.fetchInvites(),
			invites,
		]).then(([collection, myinvites]) => {
			const usedInvite = collection
				.array()
				.find(
					(invite, index) => myinvites[index][invite.code] + 1 === invite.uses
				)

			let userid = usedInvite && usedInvite.inviter && usedInvite.inviter.id

			const isAlreadyReferred = newReferrals[userid].includes(
				String(member.user.id)
			)
			const isOldEnough =
				moment().diff(moment(member.user.createdTimestamp), 'days') > 30

			if (!isAlreadyReferred && isOldEnough) {
				newReferrals = {
					...newReferrals,
					[userid]: [...newReferrals[userid], String(member.user.id)],
				}
				jf.writeFile('./referrals.json', newReferrals)
			} else {
				console.log(
					`member join ${member.user
						.tag}, but he has been referred by ${userid} or is too young (${moment().diff(
						moment(member.user.createdTimestamp),
						'days'
					)} days old)`
				)
			}
		})
	})
	client.login('MzY5OTA4OTA0MDcyNzA4MDk4.DMfejA.jAIgRUC1duUMaSiM-XDA6R7i0Wo')
})
