import Command from "../../classes/Command.js";
import client from "../../index.js";

const stats = new Command({
    name: "stats",
    description: "Get bot stats",
    dmpermission: true,
    userApp: true,

    execute: async (interaction) => {
        if (client.uptime === null) throw new Error("Uptime is undefined");

        const startTime = Date.now();
		await client.axios.get(`${client.config.branding.baseURL}/api/v1/info`);
		const elapsed = Date.now() - startTime;

        const embed = client.Functions.makeInfoEmbed({
            title: `OmegaOS - v${client.config.version}`,
            description: "Bot stats",
            thumbnail: client.user?.displayAvatarURL(),
            fields: [
                {
                    name: "Uptime",
                    value: `${Math.floor(client.uptime / 1000 / 60 / 60)} hours, ${Math.floor(client.uptime / 1000 / 60) % 60} minutes, ${Math.floor(client.uptime / 1000) % 60} seconds`,
                    inline: false
                },
                {
                    name: "Memory Usage",
                    value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
                    inline: true
                },
                {
                    name: "Bot Ping",
                    value: `${Math.floor(client.ws.ping)} ms`,
                    inline: true
                },
                {
                    name: "Webserver Ping",
                    value: `${Math.floor(elapsed)}ms`,
                    inline: true
                },
                {
                    name: "Caches",
                    value: `${client.users.cache.size} users\n${client.channels.cache.size} channels\n${client.guilds.cache.size} guilds`,
                    inline: false
                }
            ]
        });

        await interaction.reply({ embeds: [embed] });
    }
});

export default stats;