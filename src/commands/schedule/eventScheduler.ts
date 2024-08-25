import { ActionRowBuilder, ButtonInteraction, ButtonStyle, EmbedBuilder, GuildMember, Options, SelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle, User } from "discord.js";
import Command from "../../classes/Command.js";
import StringSelector from "../../classes/StringSelector.js";
import { ScheduleEvent, ScheduleEventType } from "../../schemas/guildProfile.js";
import client from "../../index.js";
import { MaterialIcons } from "../../assets/materialIcons.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Modal from "../../classes/Modal.js";
import { response } from "express";

const EventScheduler = new Command({
    name: "eventscheduler",
    description: "Schedule an event",
    permissions: [],
    customPermissions: ["EventScheduler"],
    dmpermission: false,

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);

        const robloxId = await client.Functions.ConvertDiscordIdtoRobloxId(interaction.user.id);
        if (!robloxId) {
            return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "You are not verified",
                        description: "You need to verify yourself to use this command"
                    })
                ], ephemeral: true
            });
        }

        let robloxData;
        try {
            robloxData = await client.wrapblox.fetchUser(Number.parseInt(robloxId));
        } catch (error) {
            return interaction.reply({ content: "An error occured while fetching your roblox data", ephemeral: true });
        }

        if (!guildDataProfile.schedule.types.size || guildDataProfile.schedule.types.size === 0) {
            return interaction.reply({ content: "No event types have been created", ephemeral: true });
        }

        let currentEvent = {
            eventType: "",
            game: {
                id: 0,
                name: "",
            },
            time: 0,
            duration: 0,
            notes: "",
            host: {
                id: robloxData.id,
                name: robloxData.name,
            },

            ongoing: false,
            id: client.Functions.GenerateID(),
        } as ScheduleEvent;

        const baseEmbed = client.Functions.makeBaseEmbed({
            title: "Event Scheduler",
            fields: [
                { name: "Time", value: "\`Unset\`", inline: true },
                { name: "Duration", value: "\`Unset\`", inline: true },

                { name: "Host", value: `[${robloxData.name}](https://www.roblox.com/users/${robloxData.id}/profile)`, inline: false },

                { name: "Type", value: "\`Unset\`", inline: true },

                { name: "Notes", value: "\`Unset\`", inline: false },
            ],
            footer: { text: currentEvent.id }
        });

        const buttonEmbed = new ButtonEmbed(baseEmbed)

        let CreateEventButton = "";
        const updateEmbed = async () => {
            const embed = buttonEmbed.Embed;

            embed.setFields([]);

            embed.addFields(
                { name: "Time", value: currentEvent.time === 0 ? "\`Unset\`" : `<t:${currentEvent.time}:F>\n<t:${currentEvent.time}:R>`, inline: true },
                { name: "Duration", value: currentEvent.duration === 0 ? "\`Unset\`" : `${currentEvent.duration} minutes`, inline: true },

                { name: "Host", value: `[${robloxData.name}](https://www.roblox.com/users/${robloxData.id}/profile)`, inline: false },

                { name: "Type", value: currentEvent.eventType == "" ? "\`Unset\`" : `${currentEvent.eventType}`, inline: true },

                { name: "Notes", value: currentEvent.notes == "" ? "\`Unset\`" : `${currentEvent.notes}`, inline: false },
            );

            buttonEmbed.setEmbed(embed);

            if (
                currentEvent.time !== 0 &&
                currentEvent.duration !== 0 &&
                currentEvent.eventType !== ""
            ) buttonEmbed.enableButton(CreateEventButton); else buttonEmbed.disableButton(CreateEventButton);
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

        buttonEmbed.addButton({
            label: "Set Time",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set time",
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
        });

        buttonEmbed.addButton({
            label: "Set Duration",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Duration",
                    Inputs: [
                        new TextInputBuilder().setCustomId("duration").setLabel("Minutes").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                })

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                const duration = Math.round(Number.parseInt(response.fields.getTextInputValue("duration")));
                
                response.deferUpdate();
                
                if (isNaN(duration) || duration <= 0 || duration > 1000)  {
                    return buttoninteraction.followUp({ content: "Invalid duration", ephemeral: true });
                }
                
                currentEvent.duration = duration;
                await updateEmbed();
                await buttoninteraction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Set Type",
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

        buttonEmbed.addButton({
            label: "Set Note",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Note",
                    Inputs: [
                        new TextInputBuilder().setCustomId("note").setLabel("Note").setRequired(false).setStyle(TextInputStyle.Paragraph).setMaxLength(1022)
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

        CreateEventButton = buttonEmbed.addButton({
            label: "Create Event",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],
            customId: client.Functions.GenerateID(),

            function: async (buttoninteraction) => {
                try {
                    await guildDataProfile.addScheduleEvent(currentEvent);

                    return await interaction.editReply({ embeds: [
                        client.Functions.makeSuccessEmbed({
                            title: "Event Scheduled",
                            description: `Event has been scheduled for <t:${currentEvent.time}:F>, <t:${currentEvent.time}:R>`,
                            footer: { text: currentEvent.id }
                        })
                    ], components: [] });
                } catch (error) {
                    if (!(error instanceof Error)) return;
                    client.Logs.LogError(error as Error);
                    return await interaction.editReply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "Event Scheduler",
                            description: `An error occured while scheduling the event: \n\`\`\`${error.message || "unknown error"}\`\`\``
                        })
                    ] });
                }
            }
        })

        buttonEmbed.addButton({
            label: "Cancel",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],
            customId: client.Functions.GenerateID(),

            function: async (buttoninteraction) => {
                return await interaction.editReply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Event Scheduler",
                        description: "Event creation cancelled"
                    })
                ], components: [] });
            }
        })

        buttonEmbed.disableButton(CreateEventButton);

        await interaction.reply(buttonEmbed.getMessageData())
    }
})

export default EventScheduler;