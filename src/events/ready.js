module.exports = {
	name: 'ready',
	once: true, // only runs once
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};