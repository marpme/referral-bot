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
		invites = guild.fetchInvites()

		setInterval(() => {
			console.log('fetch new invites!')
			invites = guild.fetchInvites()
		}, 10000)
	})

	client.on('message', msg => {
		if (
			msg.cleanContent.includes(']referred') &&
			msg.channel.id == '367768045759758338'
		) {
			const members = msg.mentions.members.array()
			if (members.length === 1) {
				const member = members[0]
				const myrefs = newReferrals[String(member.user.id)]
				if (myrefs) {
					const listofMembers = myrefs.map(id => `<@${id}>`).join(', ')
					msg.reply(
						`members referred: ${myrefs
							? myrefs.length
							: 0}\nList: ${listofMembers}`
					)
				} else {
					msg.reply(`no members referred, yet ... :(`)
				}
			}
		}
	})

	client.on('guildMemberAdd', member => {
		Promise.all([
			guild.fetchInvites(),
			invites,
		]).then(([collection, myinvites]) => {
			const usedInvite = collection.array().find(invite => {
				const usedinvite = myinvites.find('code', invite.code)
				const uses = (usedinvite && usedinvite.uses) || 0
				return uses + 1 === invite.uses
			})

			let userid = usedInvite && usedInvite.inviter && usedInvite.inviter.id

			const isAlreadyReferred = newReferrals[userid].includes(
				String(member.user.id)
			)
			const isNotHisSelf = member.user.id != userid
			const isOldEnough =
				moment().diff(moment(member.user.createdTimestamp), 'days') > 30

			if (!isAlreadyReferred && isOldEnough && isNotHisSelf) {
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
	client.login('')
})
