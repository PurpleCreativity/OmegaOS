import { ButtonStyle, GuildMember, SelectMenuInteraction, SlashCommandStringOption, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { ScheduleEvent, ScheduleEventType } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";
import StringSelector from "../../classes/StringSelector.js";

const editEvent = new Command({
    name: "editevent",
    description: "Edit an event",
    dmpermission: false,
    userCooldown: 10000,

    options: [
        new SlashCommandStringOption()
            .setName("event-id")
            .setDescription("The ID of the event to edit")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const robloxId = await client.Functions.ConvertDiscordIdtoRobloxId(interaction.user.id);
        if (!robloxId) return interaction.reply({ content: "You must link your Roblox account to use this command", ephemeral: true });

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);

        const eventId = interaction.options.getString("event-id", true);

        const event = await guildDataProfile.getScheduledEvent(eventId);
        if (!event) return interaction.reply({ content: "Event not found", ephemeral: true });

        if (event.host.id.toString() !== robloxId && !await client.Functions.checkGuildUserPermissions(interaction.guild.id, interaction.user.id, ["ScheduleManager"])) {
            interaction.reply({ content: "You do not have permission to edit this event", ephemeral: true });

            return;
        }

        const eventType = await guildDataProfile.getEventType(event.eventType);
        if (!eventType) return interaction.reply({ content: "Event type not found", ephemeral: true });

        const baseEmbed = client.Functions.makeBaseEmbed({
            fields: [
                { name: "Time", value: event.time === 0 ? "\`Unset\`" : `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
                { name: "Duration", value: event.duration === 0 ? "\`Unset\`" : `\`${event.duration}\` minutes`, inline: true },

                { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },

                { name: "Type", value: event.eventType == "" ? "\`Unset\`" : `\`${event.eventType}\``, inline: true },

                { name: "Notes", value: event.notes == "" ? "(No notes)" : `\`${event.notes}\``, inline: false },
            ],
            color: eventType.color,
            footer: { text: event.id }
        })

        const buttonEmbed = new ButtonEmbed(baseEmbed)

        let currentEvent = JSON.parse(JSON.stringify(event)) as ScheduleEvent;

        let saveButton = "";
        const updateEmbed = async () => {
            const embed = buttonEmbed.Embed;

            embed.setFields([]);

            embed.addFields(
                { name: "Time", value: currentEvent.time === 0 ? "\`Unset\`" : `<t:${currentEvent.time}:F>\n<t:${currentEvent.time}:R>`, inline: true },
                { name: "Duration", value: currentEvent.duration === 0 ? "\`Unset\`" : `${currentEvent.duration} minutes`, inline: true },

                { name: "Host", value: `[${currentEvent.host.name}](https://www.roblox.com/users/${currentEvent.host.id}/profile)`, inline: false },

                { name: "Type", value: currentEvent.eventType == "" ? "\`Unset\`" : `${currentEvent.eventType}`, inline: true },

                { name: "Notes", value: currentEvent.notes == "" ? "\`Unset\`" : `${currentEvent.notes}`, inline: false },
            );

            buttonEmbed.setEmbed(embed);

            const diff = {
                time: currentEvent.time !== event.time,
                duration: currentEvent.duration !== event.duration,
                eventType: currentEvent.eventType !== event.eventType,
                notes: currentEvent.notes !== event.notes
            };
        
            const diffFields = Object.entries(diff)
                .filter(([_, value]) => value)
                .map(([key]) => key);

            if (diffFields.length === 0) {
                buttonEmbed.disableButton(saveButton);
            } else {
                buttonEmbed.enableButton(saveButton);
            }
        }

        const getEventTypes = async (user: GuildMember) => {
            const types = await guildDataProfile.getEventTypes();
            const avaible = [] as ScheduleEventType[];

            for (const eventType of types.values()) {
                if (eventType.canSchedule.users.length === 0 && eventType.canSchedule.roles.length === 0) {
                    avaible.push(eventType);
                    continue;
                }

                if (eventType.canSchedule.users.includes(user.id)) {
                    avaible.push(eventType);
                    continue;
                }

                for (const role of eventType.canSchedule.roles) {
                    if (user.roles.cache.has(role)) {
                        avaible.push(eventType);
                        break;
                    }
                }
            }

            return avaible;
        }

        const avaibleOptions = await getEventTypes(interaction.member as GuildMember);
        if (avaibleOptions.length === 0) {
            return interaction.reply({ content: "You do not have permission to schedule any event types", ephemeral: true });
        }

        await updateEmbed();

        const editTime = buttonEmbed.addButton({
            label: "Edit Time",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Edit time",
                    Inputs: [
                        new TextInputBuilder().setCustomId("timestamp").setLabel("Epoch Timestamp").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                })

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                const timestamp = Number.parseInt(response.fields.getTextInputValue("timestamp"));

                response.deferUpdate();

                if (timestamp > 4294967295) {
                    return buttoninteraction.followUp({ content: "Timestamp exceeds the maximum value", ephemeral: true });
                }

                if (isNaN(timestamp)) {
                    return buttoninteraction.followUp({ content: "Invalid timestamp", ephemeral: true });
                }

                if (timestamp < Date.now() / 1000) {
                    return buttoninteraction.followUp({ content: "The given date is in the past", ephemeral: true });
                }

                currentEvent.time = timestamp;
                await updateEmbed();
                await buttoninteraction.editReply(buttonEmbed.getMessageData());
            }
        })

        const editDuration = buttonEmbed.addButton({
            label: "Edit Duration",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Edit duration",
                    Inputs: [
                        new TextInputBuilder().setCustomId("duration").setLabel("Duration in minutes").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                })

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                const duration = Number.parseInt(response.fields.getTextInputValue("duration"));

                response.deferUpdate();

                if (isNaN(duration)) {
                    return buttoninteraction.followUp({ content: "Invalid duration", ephemeral: true });
                }

                if (duration < 0) {
                    return buttoninteraction.followUp({ content: "Duration cannot be negative", ephemeral: true });
                }

                currentEvent.duration = duration;
                await updateEmbed();
                await buttoninteraction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        const setType = buttonEmbed.addButton({
            label: "Edit Type",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (ButtonInteraction) => {
                let options = [] as StringSelectMenuOptionBuilder[];

                const avaibleOptions = await getEventTypes(interaction.member as GuildMember);
                for (const type of avaibleOptions) {
                    options.push(new StringSelectMenuOptionBuilder().setLabel(type.name).setValue(type.name).setDescription(type.description));
                }

                if (options.length === 0) {
                    return interaction.followUp({ content: "You do not have permission to schedule any event types", ephemeral: true });
                }

                const Selector = new StringSelector({
                    Placeholder: "Select an event type",
                    allowedUsers: [interaction.user.id],
                    Options: options
                })

                const response = await Selector.Prompt(ButtonInteraction, { content: `<@${interaction.user.id}>` }) as SelectMenuInteraction;
                const eventType = response.values[0];

                await response.deferUpdate();
                await response.message.delete();

                currentEvent.eventType = eventType;
                await updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        const setNote = buttonEmbed.addButton({
            label: "Edit Note",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Edit Note",
                    Inputs: [
                        new TextInputBuilder().setCustomId("note").setLabel("Note").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(1024)
                    ]
                })

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                const note = response.fields.getTextInputValue("note");

                response.deferUpdate();

                currentEvent.notes = note || "";
                await updateEmbed();
                await buttoninteraction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Archive",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                try {
                    await guildDataProfile.cancelScheduledEvent(event.id, Number.parseInt(robloxId));

                    await interaction.editReply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Event archived", description: `The event has been archived successfully` })
                    ], components: [] });
                } catch (error) {
                    await buttoninteraction.reply(`An error occurred while archiving the event: ${error}`);
                }
            }
        });

        saveButton = buttonEmbed.addButton({
            label: "Save",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                try {
                    await guildDataProfile.editScheduledEvent(event.id, currentEvent, Number.parseInt(robloxId));

                    await interaction.editReply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Changes saved", description: `Your changes have been saved successfully`, footer: { text: event.id } })
                    ], components: [] })
                } catch (error) {
                    await buttoninteraction.reply(`An error occurred while saving the event: ${error}`);
                }
            }
        })

        if (event.ongoing) {
            buttonEmbed.disableButton(editTime);
            buttonEmbed.disableButton(editDuration);
            buttonEmbed.disableButton(setType);
            buttonEmbed.disableButton(setNote);
        }

        buttonEmbed.disableButton(saveButton);
        
        interaction.reply(buttonEmbed.getMessageData());
    }
})

export default editEvent;