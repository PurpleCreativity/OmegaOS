import { Embed, EmbedBuilder, SlashCommandNumberOption, SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { ScheduleEvent, ScheduleEventType } from "../../schemas/guildProfile.js";
import { User } from "wrapblox";

const viewSchedule = new Command({
    name: "schedule",
    description: "View the upcoming for the week",
    dmpermission: false,
    guildCooldown: 15000,

    options: [
        new SlashCommandNumberOption()
            .setName("max")
            .setDescription("The amount of events to show (1-100)")
            .setRequired(false)
        ,

        new SlashCommandStringOption()
            .setName("type")
            .setDescription("Filter by event type")
            .setRequired(false)
            .setAutocomplete(true)
        ,

        new SlashCommandStringOption()
            .setName("host")
            .setDescription("Filter by host (roblox username)")
            .setRequired(false)
        ,
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;
        if (!interaction.channel) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        if (!guildDataProfile) return;

        let max = interaction.options.getNumber("max") ?? 10; if (max < 1) max = 1; else if (max > 100) max = 100;
        const typeName = interaction.options.getString("type");
        const hostName = interaction.options.getString("host");

        const scheduledEvents = await guildDataProfile.getScheduledEvents();
        if (scheduledEvents.length === 0) return interaction.reply({ content: "There are no scheduled events.", ephemeral: true });
        const getOngoingEvents = await guildDataProfile.getOngoingEvents();

        let actualHost: User | null = null;
        if (hostName) {
            try {
                actualHost = await client.wrapblox.fetchUserByName(hostName);
            } catch (error) {
                return interaction.reply({ content: "Couldn't find host", ephemeral: true });
            }
        }

        let actualType: ScheduleEventType | null = null;
        if (typeName) {
            try {
                actualType = await guildDataProfile.getEventType(typeName);
            } catch (error) {
                return interaction.reply({ content: "Couldn't find event type", ephemeral: true });
            }
        }

        if (typeName && !actualType) return interaction.reply({ content: "Couldn't find event type", ephemeral: false });
        if (hostName && !actualHost) return interaction.reply({ content: "Couldn't find host", ephemeral: false });

        let filteredEvents = JSON.parse(JSON.stringify(scheduledEvents)) as ScheduleEvent[];

        if (typeName) filteredEvents = scheduledEvents.filter(event => actualType && event.eventType === actualType.name);
        if (hostName) filteredEvents = scheduledEvents.filter(event => actualHost && event.host.id === actualHost.id);
        if (max !== 0) filteredEvents = filteredEvents.slice(0, max);

        if (filteredEvents.length === 0) return interaction.reply({ content: "No events found", ephemeral: false });

        const eventEmbeds = [] as EmbedBuilder[];
        for (const event of filteredEvents) {
            const eventType = await guildDataProfile.getEventType(event.eventType);
            if (!eventType) continue;

            const embed = client.Functions.makeBaseEmbed({
                author: { name: guildDataProfile.guild.shortName, iconURL: eventType.icon },
                footer: { text: event.id },
                color: eventType.color,
                fields: [
                    { name: "Time", value: `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
                    { name: "Duration", value: `${event.duration} minutes`, inline: true },

                    { name: "Host", value: event.host.name, inline: false },

                    { name: "Type", value: eventType.name || "(No type)", inline: true },
                    { name: "Notes", value: event.notes || "(No notes)", inline: false },
                ]
            })

            eventEmbeds.push(embed);
        }

        let content = `There are ${scheduledEvents.length} events scheduled.`;
        content += `\nOnly showing up to ${max} events!`;
        if (actualHost) content += `\nOnly showing events hosted by [${actualHost.name}](<https://www.roblox.com/users/${actualHost.id}/profile>).`;
        if (actualType) content += `\nOnly showing events of type \`${actualType.name}\`.`;
        for (const onGoingevent of getOngoingEvents) content += `\n🚨 There is an ongoing event hosted by ${onGoingevent.host.name} of type ${onGoingevent.eventType}!`

        await interaction.reply(content);

        const chunkSize = 10;
        const chunks = Math.ceil(eventEmbeds.length / chunkSize);

        for (let i = 0; i < chunks; i++) {
            const startIndex = i * chunkSize;
            const endIndex = startIndex + chunkSize;
            const chunk = eventEmbeds.slice(startIndex, endIndex);

            interaction.channel.send({ embeds: chunk });
        }
    },

    // @ts-ignore
    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, true);
        const currentOption = interaction.options.getFocused(true);

        switch (currentOption.name) {
            case "type": {
                const eventTypes = await guildDataProfile.getEventTypes();
                return Array.from(eventTypes.values()).map(eventType => ({ name: eventType.name, value: eventType.name }));
            }

            default: return [];
        }
    }
})

export default viewSchedule;