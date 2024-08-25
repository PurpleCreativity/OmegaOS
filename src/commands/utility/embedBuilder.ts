import { ButtonStyle, Guild, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import Modal from "../../classes/Modal.js";
import { error } from "console";

const embedBuilder = new Command({
    name: "embedbuilder",
    description: "Build an embed",
    dmpermission: false,
    customPermissions: ["Moderator"],

    guildCooldown: 60000,

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const embed = client.Functions.makeBaseEmbed({
            title: "Embed Builder",
            footer: { text: interaction.user.username, iconURL: interaction.user.avatarURL() || undefined }
        })

        const buttonEmbed = new ButtonEmbed(embed);

        buttonEmbed.addButton({
            label: "Set Title",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Title",
                    Inputs: [
                        new TextInputBuilder().setCustomId("title").setLabel("Title").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(256)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const title = response.fields.getTextInputValue("title");

                buttonEmbed.Embed.setTitle(title);
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.addButton({
            label: "Set Description",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Description",
                    Inputs: [
                        new TextInputBuilder().setCustomId("description").setLabel("Description").setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(2048)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const description = response.fields.getTextInputValue("description");

                buttonEmbed.Embed.setDescription(description);
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Set Color",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Color",
                    Inputs: [
                        new TextInputBuilder().setCustomId("color").setLabel("Color").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(7)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const color = response.fields.getTextInputValue("color") as any;

                try {
                    buttonEmbed.Embed.setColor(color);
                } catch (error) {
                    interaction.followUp({ content: "Invalid Color", ephemeral: true });
                }

                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Set URL",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set URL",
                    Inputs: [
                        new TextInputBuilder().setCustomId("url").setLabel("URL").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(2048)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const url = response.fields.getTextInputValue("url");

                try {
                    buttonEmbed.Embed.setURL(url);
                } catch (error) {
                    interaction.followUp({ content: "Invalid URL", ephemeral: true });
                }
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Set Author",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Author",
                    Inputs: [
                        new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(256),
                        new TextInputBuilder().setCustomId("icon").setLabel("Icon").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(2048)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const name = response.fields.getTextInputValue("name");
                const icon = response.fields.getTextInputValue("icon") || undefined;

                try {
                    buttonEmbed.Embed.setAuthor({ name: name, iconURL: icon });
                } catch (error) {
                    interaction.followUp({ content: "Invalid Author", ephemeral: true });
                }
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Add Field",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                if (buttonEmbed.Embed.data.fields && buttonEmbed.Embed.data.fields.length >= 25) {
                    await buttoninteraction.reply({ content: "You can only have up to 25 fields", ephemeral: true });
                    return;
                }

                const modal = new Modal({
                    Title: "Add Field",
                    Inputs: [
                        new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(256),
                        new TextInputBuilder().setCustomId("value").setLabel("Value").setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(1024),
                        new TextInputBuilder().setCustomId("inline").setLabel("Inline").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(5)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const name = response.fields.getTextInputValue("name");
                const value = response.fields.getTextInputValue("value");
                const inline = response.fields.getTextInputValue("inline");

                buttonEmbed.Embed.addFields({ name: name, value: value, inline: client.Functions.StringToBoolean(inline) });
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.addButton({
            label: "Clear Fields",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                buttoninteraction.deferUpdate();
                buttonEmbed.Embed.setFields([]);
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Set Thumbnail",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Thumbnail",
                    Inputs: [
                        new TextInputBuilder().setCustomId("thumbnail").setLabel("Thumbnail").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(2048)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const thumbnail = response.fields.getTextInputValue("thumbnail");

                try {
                    buttonEmbed.Embed.setThumbnail(thumbnail || null);
                } catch (error) {
                    interaction.followUp({ content: "Invalid Thumbnail", ephemeral: true });
                }
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.addButton({
            label: "Set Image",
            style: ButtonStyle.Secondary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Set Image",
                    Inputs: [
                        new TextInputBuilder().setCustomId("image").setLabel("Image").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(2048)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const image = response.fields.getTextInputValue("image");

                try {
                    buttonEmbed.Embed.setImage(image || null);
                } catch (error) {
                    interaction.followUp({ content: "Invalid Image", ephemeral: true });
                }
                await interaction.editReply(buttonEmbed.getMessageData());
            }
        });

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Export JSON",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const json = JSON.stringify(buttonEmbed.Embed.toJSON(), null, 2);
                
                await buttoninteraction.reply({ content: "Export in the attached file", files: [{ name: "embed.json", attachment: Buffer.from(json) }], ephemeral: true });
            }
        })

        buttonEmbed.addButton({
            label: "Import JSON",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Import JSON",
                    Inputs: [
                        new TextInputBuilder().setCustomId("json").setLabel("JSON").setRequired(true).setStyle(TextInputStyle.Paragraph)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const json = response.fields.getTextInputValue("json");

                try {
                    const parsed = JSON.parse(json);
                    buttonEmbed.Embed = client.Functions.makeBaseEmbed(parsed);
                    buttonEmbed.Embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() || undefined });
                } catch (e) {
                    if (!(e instanceof Error)) return;
                    await interaction.followUp({ content: `Invalid JSON\n\n${e.message}`, ephemeral: true });
                }

                await interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.addButton({
            label: "Send",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (buttoninteraction) => {
                const modal = new Modal({
                    Title: "Import JSON",
                    Inputs: [
                        new TextInputBuilder().setCustomId("channel").setLabel("Channel Id").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(100)
                    ]
                });

                const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                response.deferUpdate();
                const channelId = response.fields.getTextInputValue("channel");

                try {
                    const channel = await client.Functions.GetChannel(channelId, interaction.guild as Guild, true) as TextChannel;
                    if (!channel) throw new Error("Channel not found");

                    await channel.send({ embeds: [buttonEmbed.Embed] });
                    await interaction.deleteReply();
                } catch (error) {
                    await interaction.followUp({ content: "Invalid Channel", ephemeral: true });
                }
            }
        });

        await interaction.reply(buttonEmbed.getMessageData());
    }
});

export default embedBuilder;