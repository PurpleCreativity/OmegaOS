import { ButtonStyle, EmbedBuilder } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";

const myEvents = new Command({
    name: "myevents",
    description: "View your upcoming events",
    dmpermission: false,
    userCooldown: 10000,

    execute: async (interaction) => {
        if (!interaction.guild) return;
        if (!interaction.channel) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        if (!guildDataProfile) return;

        const robloxId = await client.Functions.ConvertDiscordIdtoRobloxId(interaction.user.id);
        if (!robloxId) return interaction.reply("You need to link your Roblox account to use this command.");

        let scheduledEvents = await guildDataProfile.getScheduledEventsbyUser(robloxId);
        if (!scheduledEvents || scheduledEvents.length === 0) return interaction.reply("You have no scheduled events.");

        const embeds = [] as EmbedBuilder[];

        for (const event of scheduledEvents.values()) {
            const eventType = await guildDataProfile.getEventType(event.eventType);
            if (!eventType) continue;

            const baseEmbed = client.Functions.makeBaseEmbed({
                fields: [
                    { name: "Time", value: event.time === 0 ? "\`Unset\`" : `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
                    { name: "Duration", value: event.duration === 0 ? "\`Unset\`" : `${event.duration} minutes`, inline: true },
    
                    { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },
    
                    { name: "Type", value: event.eventType == "" ? "\`Unset\`" : `${event.eventType}`, inline: true },
    
                    { name: "Notes", value: event.notes == "" ? "(No notes)" : `${event.notes}`, inline: false },
                ],
                color: eventType.color,
                footer: { text: event.id }
            })

            embeds.push(baseEmbed);
        }

        await interaction.reply("Here are your upcoming events!");
    
        const chunkSize = 10;
        const chunks = Math.ceil(embeds.length / chunkSize);

        for (let i = 0; i < chunks; i++) {
            const startIndex = i * chunkSize;
            const endIndex = startIndex + chunkSize;
            const chunk = embeds.slice(startIndex, endIndex);

            interaction.channel.send({ embeds: chunk });
        }
    }
})

export default myEvents;