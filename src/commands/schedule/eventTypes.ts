import { ButtonStyle, ColorResolvable, Guild, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { ScheduleEventType } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";

const eventTypes = new Command({
    name: "eventtypes",
    description: "Get a list of all event types",
    customPermissions: ["ScheduleManager"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("list")
            .setDescription("List all event types")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("info")
            .setDescription("Get information about an event type")
            .addStringOption(option => option.setName("name").setDescription("The name of the event type").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Add a new event type")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("edit")
            .setDescription("Edit an event type")
            .addStringOption(option => option.setName("name").setDescription("The name of the event type").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("copy")
            .setDescription("Copy an event type and make a new one based off of it")
            .addStringOption(option => option.setName("name").setDescription("The name of the event type").setAutocomplete(true).setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Remove an event type")
            .addStringOption(option => option.setName("name").setDescription("The name of the event type").setAutocomplete(true).setRequired(true))
        ,
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        const selectedCommand = interaction.options.getSubcommand();

        switch (selectedCommand) {
            case "list": {
                const eventTypes = await guildDataProfile.getEventTypes();
                if (eventTypes.size === 0) return await interaction.reply({ content: "There are no event types in this server", ephemeral: true });

                const infoEmbed = client.Functions.makeInfoEmbed({
                    title: "Event Types"
                })

                for (const eventType of eventTypes.values()) {
                    infoEmbed.addFields({
                        name: eventType.name,
                        value: `\`${eventType.description}\``,
                        inline: false
                    })
                }

                await interaction.reply({ embeds: [infoEmbed] });

                break;
            }

            case "info": {
                const eventTypeName = interaction.options.getString("name", true).toLowerCase();
                const eventType = await guildDataProfile.getEventType(eventTypeName);
                if (!eventType) return await interaction.reply({ content: "That event type does not exist", ephemeral: true });

                const eventEmbed = client.Functions.makeBaseEmbed({
                    title: eventType.name,
                    description: eventType.description,
                    color: eventType.color,
                    author: { name: guildDataProfile.guild.shortName, iconURL: eventType.icon },
                    fields: [
                        {
                            name: "Rules",
                            value: `Can create:\nUsers: ${eventType.canSchedule.users.map(user => `<@${user.trim()}>`).join(", ") || "(No users)"}\nRoles: ${eventType.canSchedule.roles.map(role => `<@&${role.trim()}>`).join(", ") || "(No roles)"}\n-# Both empty = allow everyone (requires EventScheduler permission)`,
                            inline: false
                        }
                    ]
                })

                await interaction.reply({ embeds: [eventEmbed] });

                break;
            }

            case "add": {
                if (guildDataProfile.schedule.types.size >= 25) return await interaction.reply({ content: "You have reached the maximum amount of event types (25)", ephemeral: true });

                let currentEventType = {
                    name: "",
                    description: "",
                    color: "",
                    icon: "",

                    canSchedule: { users: [], roles: [] }
                } as ScheduleEventType;

                const baseEmbed = client.Functions.makeBaseEmbed({
                    title: "Event Type Creator",
                    description: "Interact with the buttons below to create a new event type",
                });

                const buttonEmbed = new ButtonEmbed(baseEmbed)

                let addButton = "";
                const updateEmbed = async () => {
                    const embed = buttonEmbed.Embed;

                    embed.setFields([]);

                    embed.setFields([
                        { name: "Name", value: currentEventType.name ? `\`${currentEventType.name}\`` : "\`Unset\`", inline: true },
                        { name: "Description", value: currentEventType.description !== "" ? `\`${currentEventType.description}\`` : "\`Unset\`", inline: false },
                        {
                            name: "Rules",
                            value: `
                            Can create:
                            Users: ${currentEventType.canSchedule.users.map(user => `<@${user.trim()}>`).join(", ") || "(No users)"}
                            Roles: ${currentEventType.canSchedule.roles.map(role => `<@&${role.trim()}>`).join(", ") || "(No roles)"}
                            -# Both empty = allow everyone (requires EventScheduler permission)
                            `,
                            inline: false
                        }
                    ]);

                    embed.setColor(currentEventType.color !== "" ? currentEventType.color as ColorResolvable : null);
                    if (currentEventType.icon !== "") embed.setAuthor({ name: guildDataProfile.guild.shortName, iconURL: currentEventType.icon });

                    if (
                        addButton !== "" &&
                        currentEventType.name !== "" &&
                        currentEventType.description !== "" &&
                        currentEventType.color !== "" &&
                        currentEventType.icon !== ""
                    ) buttonEmbed.enableButton(addButton);

                    buttonEmbed.setEmbed(embed);
                }

                const formatUsers = async (usersArray: string[]) => {
                    if (usersArray.length === 0) return null;

                    const actualUsers = [] as string[];

                    for (const user of usersArray) {
                        if (user.trim() === "") continue;
                        const actualUser = await client.Functions.GetUser(user.trim(), interaction.guild as Guild);
                        if (actualUser) actualUsers.push(actualUser.id);
                    }

                    return actualUsers.filter(user => user !== undefined) || [];
                }

                const formatRoles = async (rolesArray: string[]) => {
                    if (rolesArray.length === 0) return null;

                    const actualRoles = [] as string[];

                    for (const role of rolesArray) {
                        if (role === "") continue;
                        const actualRole = await client.Functions.GetRole(role, interaction.guild as Guild);
                        if (actualRole) actualRoles.push(actualRole.id);
                    }

                    return actualRoles.filter(role => role !== undefined) || [];
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
                                new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(50)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const name = response.fields.getTextInputValue("name");

                        currentEventType.name = name;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("description").setLabel("Description").setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(1000)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const description = response.fields.getTextInputValue("description");

                        currentEventType.description = description;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("color").setLabel("RGB").setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("255, 255, 255").setMaxLength(14)
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const color = response.fields.getTextInputValue("color");

                        try {
                            const hex = client.Functions.StringRGBToColorHex(color);

                            currentEventType.color = hex;

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            if (!(error instanceof Error)) return;
                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                buttonEmbed.addButton({
                    label: "Set Icon",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Icon",
                            Inputs: [
                                new TextInputBuilder().setCustomId("icon").setLabel("Icon URL").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(200).setPlaceholder("Leave blank for server icon")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const icon = response.fields.getTextInputValue("icon") || null;

                        try {
                            currentEventType.icon = icon || interaction.guild.iconURL() || "";

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            interaction.followUp({ content: "An error occurred while setting the icon", ephemeral: true });
                        }
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Set Can Schedule",
                    style: ButtonStyle.Secondary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Can Create",
                            Inputs: [
                                new TextInputBuilder().setCustomId("canCreateUsers").setLabel("Users").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Usernames separated by commas (username1,username2)"),
                                new TextInputBuilder().setCustomId("canCreateRoles").setLabel("Roles").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Role names separated by commas (rolename1,rolename2)")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const users = response.fields.getTextInputValue("canCreateUsers")?.split(",") || [];
                        const roles = response.fields.getTextInputValue("canCreateRoles")?.split(",") || [];

                        const actualUsers = await formatUsers(users);
                        const actualRoles = await formatRoles(roles);

                        currentEventType.canSchedule.users = actualUsers || [];
                        currentEventType.canSchedule.roles = actualRoles || [];

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.nextRow();

                addButton = buttonEmbed.addButton({
                    label: "Add Event Type",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        try {
                            await guildDataProfile.addEventType(currentEventType);

                            interaction.editReply({ embeds: [
                                client.Functions.makeInfoEmbed({
                                    title: "Event Type Added",
                                    description: `The event type \`${currentEventType.name}\` has been added to the server`
                                })
                        ], components: [] });
                        } catch (error) {
                            if (!(error instanceof Error)) return;
                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                buttonEmbed.disableButton(addButton);

                interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "edit": {
                const eventTypeName = interaction.options.getString("name", true).toLowerCase();
                const eventType = await guildDataProfile.getEventType(eventTypeName);
                if (!eventType) return await interaction.reply({ content: "That event type does not exist", ephemeral: true });

                let currentEventType = JSON.parse(JSON.stringify(eventType)) as ScheduleEventType;

                const baseEmbed = client.Functions.makeBaseEmbed({
                    title: "Event Type Editor",
                    description: "Interact with the buttons below to edit an event type",
                });

                const buttonEmbed = new ButtonEmbed(baseEmbed)

                const updateEmbed = async () => {
                    const embed = buttonEmbed.Embed;

                    embed.setFields([]);

                    embed.setFields([
                        { name: "Name", value: currentEventType.name ? `\`${currentEventType.name}\`` : "\`Unset\`", inline: true },
                        { name: "Description", value: currentEventType.description !== "" ? `\`${currentEventType.description}\`` : "\`Unset\`", inline: false },
                        {
                            name: "Rules",
                            value: `
                            Can create:
                            Users: ${currentEventType.canSchedule.users.map(user => `<@${user.trim()}>`).join(", ") || "(No users)"}
                            Roles: ${currentEventType.canSchedule.roles.map(role => `<@&${role.trim()}>`).join(", ") || "(No roles)"}
                            -# Both empty = allow everyone (requires EventScheduler permission)
                            `,
                            inline: false
                        }
                    ]);

                    embed.setColor(currentEventType.color as ColorResolvable || null);
                    if (currentEventType.icon !== "") embed.setAuthor({ name: guildDataProfile.guild.shortName, iconURL: currentEventType.icon });

                    buttonEmbed.setEmbed(embed);
                }

                const formatUsers = async (usersArray: string[]) => {
                    if (usersArray.length === 0) return null;

                    const actualUsers = [] as string[];

                    for (const user of usersArray) {
                        if (user.trim() === "") continue;
                        const actualUser = await client.Functions.GetUser(user.trim(), interaction.guild as Guild);
                        if (actualUser) actualUsers.push(actualUser.id);
                    }

                    return actualUsers.filter(user => user !== undefined) || [];
                }

                const formatRoles = async (rolesArray: string[]) => {
                    if (rolesArray.length === 0) return null;

                    const actualRoles = [] as string[];

                    for (const role of rolesArray) {
                        if (role === "") continue;
                        const actualRole = await client.Functions.GetRole(role, interaction.guild as Guild);
                        if (actualRole) actualRoles.push(actualRole.id);
                    }

                    return actualRoles.filter(role => role !== undefined) || [];
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
                                new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(50)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const name = response.fields.getTextInputValue("name");

                        currentEventType.name = name;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("description").setLabel("Description").setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(1000)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const description = response.fields.getTextInputValue("description");

                        currentEventType.description = description;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("color").setLabel("RGB").setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("255, 255, 255").setMaxLength(14)
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const color = response.fields.getTextInputValue("color");

                        try {
                            const hex = client.Functions.StringRGBToColorHex(color);

                            currentEventType.color = hex;

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            if (!(error instanceof Error)) return;
                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                buttonEmbed.addButton({
                    label: "Set Icon",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Icon",
                            Inputs: [
                                new TextInputBuilder().setCustomId("icon").setLabel("Icon URL").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(200).setPlaceholder("Leave blank for server icon")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const icon = response.fields.getTextInputValue("icon") || null;

                        try {
                            currentEventType.icon = icon || interaction.guild.iconURL() || "";

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            interaction.followUp({ content: "An error occurred while setting the icon", ephemeral: true });
                        }
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Set Can Create",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Can Schedule",
                            Inputs: [
                                new TextInputBuilder().setCustomId("canCreateUsers").setLabel("Users").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Usernames separated by commas (username1,username2)"),
                                new TextInputBuilder().setCustomId("canCreateRoles").setLabel("Roles").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Role names separated by commas (rolename1,rolename2)")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const users = response.fields.getTextInputValue("canCreateUsers")?.split(",") || [];
                        const roles = response.fields.getTextInputValue("canCreateRoles")?.split(",") || [];

                        const actualUsers = await formatUsers(users);
                        const actualRoles = await formatRoles(roles);

                        currentEventType.canSchedule.users = actualUsers || [];
                        currentEventType.canSchedule.roles = actualRoles || [];

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Finish",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        try {
                            guildDataProfile.editEventType(eventTypeName, currentEventType);

                            interaction.editReply({ embeds: [
                                client.Functions.makeInfoEmbed({
                                    title: "Event Type Edited",
                                    description: `The event type \`${currentEventType.name}\` has been edited`
                                })
                        ], components: [] });
                        } catch (error) {
                            if (!(error instanceof Error)) return;

                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "copy": {
                const eventTypeName = interaction.options.getString("name", true).toLowerCase();
                const eventType = await guildDataProfile.getEventType(eventTypeName);
                if (!eventType) return await interaction.reply({ content: "That event type does not exist", ephemeral: true });

                let currentEventType = JSON.parse(JSON.stringify(eventType)) as ScheduleEventType;

                const baseEmbed = client.Functions.makeBaseEmbed({
                    title: "Event Type Copier",
                    description: "Interact with the buttons below to copy an event type",
                });

                const buttonEmbed = new ButtonEmbed(baseEmbed)

                const updateEmbed = async () => {
                    const embed = buttonEmbed.Embed;

                    embed.setFields([]);

                    embed.setFields([
                        { name: "Name", value: currentEventType.name ? `\`${currentEventType.name}\`` : "\`Unset\`", inline: true },
                        { name: "Description", value: currentEventType.description !== "" ? `\`${currentEventType.description}\`` : "\`Unset\`", inline: false },
                        {
                            name: "Rules",
                            value: `
                            Can create:
                            Users: ${currentEventType.canSchedule.users.map(user => `<@${user.trim()}>`).join(", ") || "(No users)"}
                            Roles: ${currentEventType.canSchedule.roles.map(role => `<@&${role.trim()}>`).join(", ") || "(No roles)"}
                            -# Both empty = allow everyone (requires EventScheduler permission)
                            `,
                            inline: false
                        }
                    ]);

                    embed.setColor(currentEventType.color as ColorResolvable || null);
                    if (currentEventType.icon !== "") embed.setAuthor({ name: guildDataProfile.guild.shortName, iconURL: currentEventType.icon });

                    buttonEmbed.setEmbed(embed);
                }

                const formatUsers = async (usersArray: string[]) => {
                    if (usersArray.length === 0) return null;

                    const actualUsers = [] as string[];

                    for (const user of usersArray) {
                        if (user.trim() === "") continue;
                        const actualUser = await client.Functions.GetUser(user.trim(), interaction.guild as Guild);
                        if (actualUser) actualUsers.push(actualUser.id);
                    }

                    return actualUsers.filter(user => user !== undefined) || [];
                }

                const formatRoles = async (rolesArray: string[]) => {
                    if (rolesArray.length === 0) return null;

                    const actualRoles = [] as string[];

                    for (const role of rolesArray) {
                        if (role === "") continue;
                        const actualRole = await client.Functions.GetRole(role, interaction.guild as Guild);
                        if (actualRole) actualRoles.push(actualRole.id);
                    }

                    return actualRoles.filter(role => role !== undefined) || [];
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
                                new TextInputBuilder().setCustomId("name").setLabel("Name").setRequired(true).setStyle(TextInputStyle.Short).setMaxLength(50)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const name = response.fields.getTextInputValue("name");

                        currentEventType.name = name;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("description").setLabel("Description").setRequired(true).setStyle(TextInputStyle.Paragraph).setMaxLength(1000)
                            ]
                        })

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const description = response.fields.getTextInputValue("description");

                        currentEventType.description = description;

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
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
                                new TextInputBuilder().setCustomId("color").setLabel("RGB").setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder("255, 255, 255").setMaxLength(14)
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const color = response.fields.getTextInputValue("color");

                        try {
                            const hex = client.Functions.StringRGBToColorHex(color);

                            currentEventType.color = hex;

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            if (!(error instanceof Error)) return;
                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                buttonEmbed.addButton({
                    label: "Set Icon",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Icon",
                            Inputs: [
                                new TextInputBuilder().setCustomId("icon").setLabel("Icon URL").setRequired(false).setStyle(TextInputStyle.Short).setMaxLength(200).setPlaceholder("Leave blank for server icon")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const icon = response.fields.getTextInputValue("icon") || null;

                        try {
                            currentEventType.icon = icon || interaction.guild.iconURL() || "";

                            await updateEmbed();
                            interaction.editReply(buttonEmbed.getMessageData());
                        } catch (error) {
                            interaction.followUp({ content: "An error occurred while setting the icon", ephemeral: true });
                        }
                    }
                });

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Set Can Schedule",
                    style: ButtonStyle.Primary,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        const modal = new Modal({
                            Title: "Set Can Create",
                            Inputs: [
                                new TextInputBuilder().setCustomId("canCreateUsers").setLabel("Users").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Usernames separated by commas (username1,username2)"),
                                new TextInputBuilder().setCustomId("canCreateRoles").setLabel("Roles").setRequired(false).setStyle(TextInputStyle.Paragraph).setPlaceholder("Role names separated by commas (rolename1,rolename2)")
                            ]
                        });

                        const response = await client.Functions.PromptModal(buttoninteraction, modal.getModal());
                        response.deferUpdate();
                        const users = response.fields.getTextInputValue("canCreateUsers")?.split(",") || [];
                        const roles = response.fields.getTextInputValue("canCreateRoles")?.split(",") || [];

                        const actualUsers = await formatUsers(users);
                        const actualRoles = await formatRoles(roles);

                        currentEventType.canSchedule.users = actualUsers || [];
                        currentEventType.canSchedule.roles = actualRoles || [];

                        await updateEmbed();
                        interaction.editReply(buttonEmbed.getMessageData());
                    }
                })

                buttonEmbed.nextRow();

                buttonEmbed.addButton({
                    label: "Add Event Type",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttoninteraction) => {
                        if (!interaction.guild) return;

                        try {
                            if (currentEventType.name === eventType.name) throw new Error("The name of the new event type cannot be the same as the old event type");

                            await guildDataProfile.addEventType(currentEventType);
    
                            interaction.editReply({ embeds: [
                                client.Functions.makeInfoEmbed({
                                    title: "Event Type Added",
                                    description: `The event type \`${currentEventType.name}\` has been added to the server`
                                })
                            ], components: [] });
                        } catch (error) {
                            if (!(error instanceof Error)) return;
                            interaction.followUp({ content: error.message, ephemeral: true });
                        }
                    }
                });

                interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "remove": {
                const eventTypeName = interaction.options.getString("name", true).toLowerCase();
                const eventType = await guildDataProfile.getEventType(eventTypeName);
                if (!eventType) return await interaction.reply({ content: "That event type does not exist", ephemeral: true });

                guildDataProfile.schedule.types.delete(eventTypeName);
                await guildDataProfile.save();

                interaction.reply({ embeds: [
                    client.Functions.makeInfoEmbed({
                        title: "Event Type Removed",
                        description: `The event type \`${eventType.name}\` has been removed from the server`
                    })
                ] });
                
                break;
            }
        }
    },

    // @ts-ignore
    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const subcommand = interaction.options.getSubcommand(true);
        const currentOption = interaction.options.getFocused(true);

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, true);

        switch (currentOption.name) {
            case "name": {
                const eventTypes = await guildDataProfile.getEventTypes();
                let returnOptions = [] as Object[];
                
                for (const eventType of eventTypes.values()) {
                    returnOptions.push({
                        name: eventType.name,
                        value: eventType.name,
                    })
                }

                return returnOptions;
            }
        }
    }
})

export default eventTypes;