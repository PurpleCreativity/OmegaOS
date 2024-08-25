import { ButtonStyle, SlashCommandSubcommandBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { APIKey } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";
import StringSelector from "../../classes/StringSelector.js";

const permissionOptions = [
    new StringSelectMenuOptionBuilder().setLabel("Administrator").setDescription("Grants all permissions").setValue("Administrator"),
    new StringSelectMenuOptionBuilder().setLabel("ViewPoints").setDescription("View points for any user").setValue("ViewPoints"),
    new StringSelectMenuOptionBuilder().setLabel("ViewSchedule").setDescription("View scheduled events").setValue("ViewSchedule"),
    new StringSelectMenuOptionBuilder().setLabel("Moderation").setDescription("Moderation related routes").setValue("Moderation"),
    new StringSelectMenuOptionBuilder().setLabel("CreatePointLogs").setDescription("Grants permission to make pointlogs").setValue("CreatePointLogs"),
    new StringSelectMenuOptionBuilder().setLabel("Roblox").setDescription("Grants roblox-related permissions, required for robloxreturn").setValue("Roblox")
]

const manageAPI = new Command({
    name: "api",
    description: "Manage the API",
    dmpermission: false,
    permissions: ["Administrator"],
    customPermissions: ["Administrator"],

    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("createkey")
            .setDescription("Create an API key")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("deletekey")
            .setDescription("Delete an API key")
            .addStringOption(option => option.setName("name").setDescription("The key's name to delete").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("managekey")
            .setDescription("Manage an API key")
            .addStringOption(option => option.setName("name").setDescription("The key's name to manage").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("listkeys")
            .setDescription("List all API keys")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("keyinfo")
            .setDescription("Get information about an API key")
            .addStringOption(option => option.setName("name").setDescription("The key's name to get information about").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("toggle")
            .setDescription("Toggle the API access to your server")
            .addBooleanOption(option => option.setName("enabled").setDescription("Enable or disable the API").setRequired(true))
        ,
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        const selectedCommand = interaction.options.getSubcommand(true);

        switch (selectedCommand) {
            case "createkey": {
                const keys = guildDataProfile.API.keys;
                if (keys.size >= 25) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Too many keys", description: "You can only have a maximum of 25 keys per guild." })] });

                let currentKey = {
                    name: "",
                    key: "",

                    createdAt: Math.round(Date.now() / 1000),
                    createdBy: interaction.user.id,
                    
                    enabled: true,
                    permissions: [],
                } as APIKey;

                const baseEmbed = client.Functions.makeInfoEmbed({
                    title: "API Key Creator",
                    description: "You are about to create a new API key. This key will be used to authenticate requests to the API. This key will be unique and cannot be changed after creation. You can manage this key later on."
                })
                
                const buttonEmbed = new ButtonEmbed(baseEmbed);

                let generateButton = "";
                const updateEmbed = async () => {
                    const embed = buttonEmbed.Embed;

                    embed.setFields([]);

                    embed.addFields([
                        { name : "Key Name", value: currentKey.name !== "" ? currentKey.name : "\`Unset\`", inline: true },
                        { name : "Enabled", value: currentKey.enabled ? "\`Yes\`" : "\`No\`", inline: true },
                        { name : "Permissions", value: currentKey.permissions.length > 0 ? currentKey.permissions.map(p => `\`${p}\``).join(", ") : "\`None\`", inline: false },
                    ])

                    if (currentKey.name !== "") buttonEmbed.enableButton(generateButton); else buttonEmbed.disableButton(generateButton); 
                }

                await updateEmbed();

                buttonEmbed.addButton({
                    label: "Set Name",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        const modal = new Modal({
                            Title: "Set Name",
                            Inputs: [
                                new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(32)
                            ]
                        })
        
                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const newName = response.fields.getTextInputValue("name");

                        currentKey.name = newName;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Add Permissions",
                    style: ButtonStyle.Secondary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        const Selector = new StringSelector({
                            Placeholder: "Select permissions to add",
                            allowedUsers: [interaction.user.id],
                            Options: permissionOptions,
                            MinValues: 1,
                            MaxValues: permissionOptions.length,
                        })

                        const response = await Selector.Prompt(buttoninteraction, { content: "Select permissions to add to the key." });
                        const permissions = response.values;

                        response.deferUpdate();
                        await response.message.delete();

                        for (const selectedPerm of permissions) {
                            if (!currentKey.permissions.includes(selectedPerm)) currentKey.permissions.push(selectedPerm);
                        }

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.addButton({
                    label: "Clear Permissions",
                    style: ButtonStyle.Danger,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        currentKey.permissions = [];
                        buttoninteraction.deferUpdate();
                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                generateButton = buttonEmbed.addButton({
                    label: "Generate Key",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        const actualKey = client.API.GenerateKey();
                        currentKey.key = client.Functions.Encypt(actualKey, guildDataProfile.iv).text;
                        buttoninteraction.deferUpdate();

                        try {
                            const baseEmbed2 = client.Functions.makeWarnEmbed({
                                title: "API Key Generated",
                                description: "Your API key has been generated. Please keep this key safe and do not share it with anyone. This key will be used to authenticate requests to the API.",
                                fields: [
                                    { name: "Key Name", value: currentKey.name, inline: false },
                                    { name: "Key", value: `Click the button below to reveal, __**ONE-TIME!**__`, inline: false },
                                    { name : "Permissions", value: currentKey.permissions.length > 0 ? currentKey.permissions.map(p => `\`${p}\``).join(", ") : "\`None\`", inline: false },
                                ]
                            })

                            const buttonEmbed2 = new ButtonEmbed(baseEmbed2);

                            buttonEmbed2.addButton({
                                label: "Reveal Key",
                                style: ButtonStyle.Danger,
                                allowedUsers: [interaction.user.id],

                                function: async (buttoninteraction2) => {
                                    buttoninteraction2.message.edit({ embeds: [
                                        client.Functions.makeWarnEmbed({
                                            title: "API Key Generated",
                                            description: "Your API key has been generated. Please keep this key safe and do not share it with anyone. This key will be used to authenticate requests to the API.",
                                            fields: [
                                                { name: "Key Name", value: currentKey.name, inline: false },
                                                { name: "Key", value: `__**REVEALED, NO LONGER POSSIBLE**__`, inline: false },
                                                { name : "Permissions", value: currentKey.permissions.length > 0 ? currentKey.permissions.map(p => `\`${p}\``).join(", ") : "\`None\`", inline: false },
                                            ]
                                        })
                                    ], components: [] });
                                    buttoninteraction2.reply({content: `\`\`\`${actualKey}\`\`\``, ephemeral: true});
                                }
                            })

                            await interaction.user.send(buttonEmbed2.getMessageData());

                            guildDataProfile.API.keys.set(currentKey.name, currentKey);
                            await guildDataProfile.save();

                            await interaction.editReply({ embeds: [
                                client.Functions.makeSuccessEmbed({
                                    title: "API Key Generated",
                                    description: "Your API key has been generated. Please check your DMs for the key."
                                })
                            ], components: []})
                        } catch (error) {
                            interaction.followUp({ content: "I was unable to send you a DM, please make sure your DMs are open or add me as a user app.", ephemeral: true });
                            return;
                        }
                    }
                })

                await interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "deletekey": {
                const keyName = interaction.options.getString("name", true);

                guildDataProfile.API.keys.delete(keyName);
                await guildDataProfile.save();

                await interaction.reply({ embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "API Key Deleted",
                        description: `The API key \`${keyName}\` has been deleted.`
                    })
                ]})

                break;
            }

            case "managekey": {
                const keyName = interaction.options.getString("name", true);
                const keyData = guildDataProfile.API.keys.get(keyName);
                if (!keyData) return interaction.reply({ content: "That key does not exist.", ephemeral: true });

                let currentKey = JSON.parse(JSON.stringify(keyData));

                const baseEmbed = client.Functions.makeInfoEmbed({
                    title: "API Key Manager",
                    description: "You are about to manage an API key. This key is used to authenticate requests to the API. You can manage the permissions and other settings of this key."
                })

                const buttonEmbed = new ButtonEmbed(baseEmbed);

                let saveChanges = "";
                const updateEmbed = async () => {
                    const embed = buttonEmbed.Embed;

                    embed.setFields([]);

                    embed.addFields([
                        { name : "Key Name", value: currentKey.name, inline: true },
                        { name : "Enabled", value: currentKey.enabled ? "\`Yes\`" : "\`No\`", inline: true },
                        { name : "Permissions", value: currentKey.permissions.length > 0 ? currentKey.permissions.map((p: any) => `\`${p}\``).join(", ") : "\`None\`", inline: false },
                    ])

                    const diff = {
                        name: currentKey.name !== keyData.name,
                        enabled: currentKey.enabled !== keyData.enabled,
                        permissions: currentKey.permissions.length !== keyData.permissions.length || currentKey.permissions.some((p: any) => !keyData.permissions.includes(p))
                    };
                
                    const diffFields = Object.entries(diff)
                        .filter(([_, value]) => value)
                        .map(([key]) => key);
        
                    if (diffFields.length === 0) {
                        buttonEmbed.disableButton(saveChanges);
                    } else {
                        buttonEmbed.enableButton(saveChanges);
                    }
                }

                await updateEmbed();

                buttonEmbed.addButton({
                    label: "Set Name",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        const modal = new Modal({
                            Title: "Set Name",
                            Inputs: [
                                new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(32)
                            ]
                        })
        
                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const newName = response.fields.getTextInputValue("name");

                        currentKey.name = newName;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Add Permissions",
                    style: ButtonStyle.Secondary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        const Selector = new StringSelector({
                            Placeholder: "Select permissions to add",
                            allowedUsers: [interaction.user.id],
                            Options: permissionOptions,
                            MinValues: 1,
                            MaxValues: permissionOptions.length,
                        })

                        const response = await Selector.Prompt(buttoninteraction, { content: "Select permissions to add to the key." });
                        const permissions = response.values;

                        response.deferUpdate();
                        await response.message.delete();

                        for (const selectedPerm of permissions) {
                            if (!currentKey.permissions.includes(selectedPerm)) currentKey.permissions.push(selectedPerm);
                        }

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.addButton({
                    label: "Clear Permissions",
                    style: ButtonStyle.Danger,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        currentKey.permissions = [];
                        buttoninteraction.deferUpdate();
                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Toggle Enabled",
                    style: ButtonStyle.Secondary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        currentKey.enabled = !currentKey.enabled;
                        buttoninteraction.deferUpdate();
                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                });  
                
                buttonEmbed.nextRow();

                saveChanges = buttonEmbed.addButton({
                    label: "Save Changes",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        guildDataProfile.API.keys.set(keyName, currentKey);
                        await guildDataProfile.save();

                        await interaction.editReply({ embeds: [
                            client.Functions.makeSuccessEmbed({
                                title: "API Key Updated",
                                description: `The API key \`${keyName}\` has been updated.`
                            })
                        ], components: []})
                    }
                });

                interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "listkeys": {
                const keys = guildDataProfile.API.keys

                const embed = client.Functions.makeInfoEmbed({title: "API Keys", description: `There are currently \`${keys.size}\` keys in this guild.`});
                keys.forEach((key) => {
                    embed.addFields({ 
                        name: key.name, 
                        value: `Created by: <@${key.createdBy}> on <t:${key.createdAt}>\n\nEnabled: \`${key.enabled ? "Yes" : "No"}\`\nPermissions: ${key.permissions.length > 0 ? key.permissions.map(p => `\`${p}\``).join(", ") : "\`None\`"}`, 
                        inline: true 
                    });
                })

                await interaction.reply({ embeds: [embed] });

                break;
            }

            case "keyinfo": {
                const keyName = interaction.options.getString("name", true);
                const keyData = guildDataProfile.API.keys.get(keyName);
                if (!keyData) return interaction.reply({ content: "That key does not exist.", ephemeral: true });

                const embed = client.Functions.makeInfoEmbed({
                    title: "API Key Information",
                    description: `Here is the information for the key \`${keyName}\`.`,
                    fields: [
                        { name: "Created by", value: `<@${keyData.createdBy}>`, inline: true },
                        { name: "Created at", value: `<t:${keyData.createdAt}>`, inline: true },
                        { name: "Enabled", value: keyData.enabled ? "\`Yes\`" : "\`No\`", inline: false },
                        { name: "Permissions", value: keyData.permissions.length > 0 ? keyData.permissions.map(p => `\`${p}\``).join(", ") : "\`None\`", inline: false }
                    ]
                });

                await interaction.reply({ embeds: [embed] });
                
                break;
            }

            case "toggle": {
                const enabled = interaction.options.getBoolean("enabled", true);

                guildDataProfile.API.enabled = enabled;
                await guildDataProfile.save();

                await interaction.reply({ embeds: [
                    client.Functions.makeInfoEmbed({
                        title: "API Toggled",
                        description: `The API has been ${enabled ? "enabled" : "disabled"} for this server.`
                    })
                ]})
                break;
            }
        }
    },

    // @ts-ignore
    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const currentOption = interaction.options.getFocused(true);
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);

        switch (currentOption.name) {
            case "name": {
                let options = [] as any;

                const apiKeys = guildDataProfile.API.keys.forEach((key) => {
                    options.push({ name: key.name, value: key.name });
                });

                return options;
            }
        }
    }
})

export default manageAPI;