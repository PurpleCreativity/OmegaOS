import { ButtonStyle, TextInputBuilder, TextInputStyle } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import Modal from "../../classes/Modal.js";

const epochbuilder = new Command({
    name: "epochbuilder",
    description: "Builds an epoch",
    dmpermission: true,
    userApp: true,

    execute: async (interaction) => {
        let epoch = Math.round(Date.now() / 1000);

        const baseEmbed = client.Functions.makeInfoEmbed({
            title: "Epoch Builder",
            fields: [
                {
                    name: "Epoch",
                    value: `\`\`\`${epoch.toString()}\`\`\``,
                    inline: true
                },
                {
                    name: "Epoch Date",
                    value: `<t:${epoch}:F>\n<t:${epoch}:R>`,
                    inline: true
                }
            ]
        });

        const buttonEmbed = new ButtonEmbed(baseEmbed);

        const updateEmbed = () => {
            buttonEmbed.Embed.setFields([
                {
                    name: "Epoch",
                    value: `\`\`\`${epoch.toString()}\`\`\``,
                    inline: true
                },
                {
                    name: "Epoch Date",
                    value: `<t:${epoch}:F>\n<t:${epoch}:R>`,
                    inline: true
                }
            ]);
        }

        buttonEmbed.addButton({
            label: "Add Minutes",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Add Minutes",
                    Inputs: [
                        new TextInputBuilder().setCustomId("minutes").setLabel("Minutes").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                });

                const response = await client.Functions.PromptModal(buttonInteraction, modal.getModal());
                const minutes = Number.parseInt(response.fields.getTextInputValue("minutes"));

                await response.deferUpdate();

                epoch += minutes * 60;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.addButton({
            label: "Add Hours",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Add Hours",
                    Inputs: [
                        new TextInputBuilder().setCustomId("hours").setLabel("Hours").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                });

                const response = await client.Functions.PromptModal(buttonInteraction, modal.getModal());
                const hours = Number.parseInt(response.fields.getTextInputValue("hours"));

                await response.deferUpdate();

                epoch += hours * 60 * 60;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Add Days",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Add Days",
                    Inputs: [
                        new TextInputBuilder().setCustomId("days").setLabel("Days").setRequired(true).setStyle(TextInputStyle.Short)
                    ]
                });

                const response = await client.Functions.PromptModal(buttonInteraction, modal.getModal());
                const days = Number.parseInt(response.fields.getTextInputValue("days"));

                await response.deferUpdate();

                epoch += days * 60 * 60 * 24;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Export",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                await buttonInteraction.reply({
                    content: epoch.toString(),
                    embeds: [
                        client.Functions.makeInfoEmbed({
                            title: "Epoch Export",
                            fields: [
                                { name: "Raw", value: `\`${epoch.toString()}\``, inline: true },
                                { name: "Default", value: `\`<t:${epoch.toString()}>\`\n<t:${epoch.toString()}>`, inline: true },
                                { name: "Relative", value: `\`<t:${epoch.toString()}:R>\`\n<t:${epoch.toString()}:R>`, inline: true },

                                { name: "Time", value: `Short: \`<t:${epoch.toString()}:t>\` (<t:${epoch.toString()}:t>)\nLong: \`<t:${epoch.toString()}:T>\` (<t:${epoch.toString()}:T>)`, inline: false },

                                { name: "Date", value: `Short: \`<t:${epoch.toString()}:d>\` (<t:${epoch.toString()}:d>)\nLong: \`<t:${epoch.toString()}:D>\` (<t:${epoch.toString()}:D>)`, inline: false},

                                { name: "Time/Date", value: `Short: \`<t:${epoch.toString()}:f>\` (<t:${epoch.toString()}:f>)\nLong: \`<t:${epoch.toString()}:F>\` (<t:${epoch.toString()}:F>)`, inline: false},
                            ]
                        })
                    ], ephemeral: true
                })
            }
        })

        buttonEmbed.addButton({
            label: "Set Epoch",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Set Epoch",
                    Inputs: [
                        new TextInputBuilder().setCustomId("epoch").setLabel("Epoch").setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("Unix Timestamp").setValue(epoch.toString())
                    ]
                });

                const response = await client.Functions.PromptModal(buttonInteraction, modal.getModal());
                const newEpoch = Number.parseInt(response.fields.getTextInputValue("epoch"));

                await response.deferUpdate();

                epoch = newEpoch;
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Set Date",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                const modal = new Modal({
                    Title: "Set Date",
                    Inputs: [
                        new TextInputBuilder().setCustomId("date").setLabel("Date").setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("dd/MM/yyyy hh:mm")
                    ]
                })

                const response = await client.Functions.PromptModal(buttonInteraction, modal.getModal());
                const inputDate = response.fields.getTextInputValue("date");
                const [date, time] = inputDate.split(" ");
                const [day, month, year] = date.split("/");
                const [hour, minute] = time.split(":");

                const newDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

                await response.deferUpdate();

                epoch = Math.floor(newDate.getTime() / 1000);
                updateEmbed();

                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.addButton({
            label: "Reset",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                buttonInteraction.deferUpdate();
                epoch = Math.round(Date.now() / 1000);
                updateEmbed();
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        await interaction.reply(buttonEmbed.getMessageData());
    }
})

export default epochbuilder;