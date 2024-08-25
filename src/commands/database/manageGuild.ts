import { ButtonInteraction, ButtonStyle, Invite, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { buffer } from "stream/consumers";
import { MaterialIcons } from "../../assets/materialIcons.js";

const manageGuild = new Command({
	name: "manageguild",
	description: "Manage your guild settings and data",
	dmpermission: false,
	options: [],
	permissions: ["Administrator"],
    customPermissions: ["Administrator"],
    subcommands: [
        /*
        new SlashCommandSubcommandGroupBuilder()
            .setName("settings")
            .setDescription("Manage your guild settings")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all settings")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("info")
                    .setDescription("Get information about a setting")
                    .addStringOption(option => option.setName("setting").setDescription("The setting to get information about").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a setting")
                    .addStringOption(option => option.setName("setting").setDescription("The setting to set").setRequired(true))
                    .addStringOption(option => option.setName("value").setDescription("The value to set").setRequired(true))
            )
        ,
        */

        new SlashCommandSubcommandGroupBuilder()
            .setName("channel")
            .setDescription("Manage your guild channels")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all channels")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("info")
                    .setDescription("Get information about a channel")
                    .addStringOption(option => option
                        .setName("channel-type")
                        .setDescription("The channel to get information about")
                        .setChoices([
                            { name: "Point Logs Updates", value: "eventlogupdates" },
                            { name: "Points Database Updates", value: "pointsDBupdates" },
                            { name: "Schedule Updates", value: "scheduleupdates"},
                            { name: "Calls", value: "calls" },
                            { name: "Game Logs", value: "gameLogs" },
                        ])
                        .setRequired(true)
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("set")
                    .setDescription("Set a channel")
                    .addStringOption(option => option
                        .setName("channel-type")
                        .setDescription("The channel to set")
                        .setChoices([
                            { name: "Point Logs Updates", value: "eventlogupdates" },
                            { name: "Points Database Updates", value: "pointsDBupdates" },
                            { name: "Schedule Updates", value: "scheduleupdates"},
                            { name: "Calls", value: "calls" },
                            { name: "Game Logs", value: "gameLogs" },
                        ])
                        .setRequired(true)
                    )
                    .addChannelOption(option => option.setName("channel").setDescription("The value to set").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a channel")
                    .addStringOption(option => option
                        .setName("channel-type")
                        .setDescription("The channel to set")
                        .setChoices([
                            { name: "Point Logs Updates", value: "eventlogupdates" },
                            { name: "Points Database Updates", value: "pointsDBupdates" },
                            { name: "Schedule Updates", value: "scheduleupdates"},
                            { name: "Calls", value: "calls" },
                            { name: "Game Logs", value: "gameLogs" },
                        ])
                        .setRequired(true)
                    )
            )
        ,

        new SlashCommandSubcommandGroupBuilder()
            .setName("permissions")
            .setDescription("Manage permissions for the bot")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all permissions")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("info")
                    .setDescription("Get information about a permission")
                    .addStringOption(option => option
                        .setName("permission")
                        .setDescription("The permission to get information about")
                        .setRequired(true)
                        .setChoices([
                            { name: "Administrator", value: "Administrator" },
                            { name: "Moderator", value: "Moderator" },
                            { name: "RobloxModerator", value: "RobloxModerator" },
                            { name: "RobloxGroupManager", value: "RobloxGroupManager" },
                            { name: "PointsManager", value: "PointsManager" },
                            { name: "PointsViewer", value: "PointsViewer" },
                            { name: "CreatePointLogs", value: "CreatePointLogs" },
                            { name: "EventScheduler", value: "EventScheduler" },
                            { name: "ScheduleManager", value: "ScheduleManager" }
                        ])
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("add")
                    .setDescription("Add a permission")
                    .addStringOption(option => option
                        .setName("permission")
                        .setDescription("The permission to add")
                        .setChoices([
                            { name: "Administrator", value: "Administrator" },
                            { name: "Moderator", value: "Moderator" },
                            { name: "RobloxModerator", value: "RobloxModerator" },
                            { name: "RobloxGroupManager", value: "RobloxGroupManager" },
                            { name: "PointsManager", value: "PointsManager" },
                            { name: "PointsViewer", value: "PointsViewer" },
                            { name: "CreatePointLogs", value: "CreatePointLogs" },
                            { name: "EventScheduler", value: "EventScheduler" },
                            { name: "ScheduleManager", value: "ScheduleManager" }
                        ])
                        .setRequired(true)
                    )
                    .addRoleOption(option => option.setName("role").setDescription("The role to add").setRequired(false))
                    .addUserOption(option => option.setName("user").setDescription("The user to add").setRequired(false))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a permission")
                    .addStringOption(option => option
                        .setName("permission")
                        .setDescription("The permission to add")
                        .setChoices([
                            { name: "Administrator", value: "Administrator" },
                            { name: "Moderator", value: "Moderator" },
                            { name: "RobloxModerator", value: "RobloxModerator" },
                            { name: "RobloxGroupManager", value: "RobloxGroupManager" },
                            { name: "PointsManager", value: "PointsManager" },
                            { name: "PointsViewer", value: "PointsViewer" },
                            { name: "CreatePointLogs", value: "CreatePointLogs" },
                            { name: "EventScheduler", value: "EventScheduler" },
                            { name: "ScheduleManager", value: "ScheduleManager" }
                        ])
                        .setRequired(true)
                    )
                    .addRoleOption(option => option.setName("role").setDescription("The role to remove").setRequired(false))
                    .addUserOption(option => option.setName("user").setDescription("The user to remove").setRequired(false))
            )
        ,

        new SlashCommandSubcommandGroupBuilder()
            .setName("data")
            .setDescription("Manage your guild data")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("show")
                    .setDescription("List all data")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("deleteuser")
                    .setDescription("Delete a user's data")
                    .addStringOption(option => option.setName("user").setDescription("The user to delete").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("export")
                    .setDescription("Export this guild's data")
            )
        ,

        new SlashCommandSubcommandGroupBuilder()
            .setName("linkedguilds")
            .setDescription("Manage your linked guilds")
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("list")
                    .setDescription("List all linked guilds")
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("info")
                    .setDescription("Get information about a linked guild")
                    .addStringOption(option => option.setName("alias").setDescription("The linked guild to get information about").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("add")
                    .setDescription("Add a linked guild")
                    .addStringOption(option => option.setName("guild-id").setDescription("The linked guild to add").setRequired(true))
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName("remove")
                    .setDescription("Remove a linked guild")
                    .addStringOption(option => option.setName("alias").setDescription("The guild alias").setRequired(true))
            )
    ],

	execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const selectedCommand = interaction.options.getSubcommand();

        if (subcommandGroup === "linkedguilds" && (selectedCommand === "add" || selectedCommand === "remove")) {
            if (
                !(interaction.user.id === client.config.ownerId || client.config.devlist.includes(interaction.user.id))
            ) return interaction.reply({ embeds: [
                client.Functions.makeErrorEmbed({ title: "Error", description: "You must be a bot developer to use this command" })
            ], ephemeral: true });
        }

        switch (subcommandGroup) {
            case "settings": {
                switch (selectedCommand) {

                }

                break;
            }

            case "channel": {
                switch (selectedCommand) {
                    case "list": {
                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Channels",
                            description: "Here are all the custom channels for this guild",
                        });

                        guildDataProfile.guild.channels.forEach(channel => {
                            infoEmbed.addFields({ name: channel.name, value: (channel.id) ? `<#${channel.id}>` : "(No channel set)" });
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "info": {
                        const channelType = interaction.options.getString("channel-type", true);
                        const channelEntry = guildDataProfile.guild.channels.get(channelType);
                        if (!channelEntry) return;

                        const infoEmbed = client.Functions.makeInfoEmbed({});
                        switch (channelType) {
                            case "eventlogupdates": {
                                infoEmbed.setTitle("Point Logs Updates");
                                infoEmbed.setDescription("The channel where updates to point logs will be sent");

                                break;
                            }

                            case "pointsDBupdates": {
                                infoEmbed.setTitle("Points Database Updates");
                                infoEmbed.setDescription("The channel where updates to the points database will be sent");

                                break;
                            }

                            case "scheduleupdates": {
                                infoEmbed.setTitle("Schedule Updates");
                                infoEmbed.setDescription("The channel where updates to the schedule will be sent");

                                break;
                            }

                            case "calls": {
                                infoEmbed.setTitle("Calls");
                                infoEmbed.setDescription("The channel where calls will be sent");

                                break;
                            }

                            case "gameLogs": {
                                infoEmbed.setTitle("Game Logs");
                                infoEmbed.setDescription("The channel where game logs will be sent");

                                break;
                            }

                            default: {
                                infoEmbed.setTitle("Unknown Channel");
                                infoEmbed.setDescription("This channel does not exist");

                                break;
                            }
                        }

                        infoEmbed.addFields({ name: "Channel", value: channelEntry.id ? `<#${channelEntry.id}>` : "(No channel set)" });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "set": {
                        const channelType = interaction.options.getString("channel-type", true);
                        const channel = interaction.options.getChannel("channel", true);

                        guildDataProfile.guild.channels.set(channelType, { name: channelType, id: channel.id });
                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Channels",
                            description: `Set channel \`${channelType}\` to <#${channel.id}>`
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "remove": {
                        const channelType = interaction.options.getString("channel-type", true);

                        guildDataProfile.guild.channels.delete(channelType);
                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Channels",
                            description: `Removed channel \`${channelType}\``
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }
                }

                break;
            }

            case "permissions": {
                switch (selectedCommand) {
                    case "list": {
                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Permissions",
                            description: "Here are all the custom permissions for this guild",
                        })

                        guildDataProfile.guild.permissions.forEach(permission => {
                            const usersString = permission.users.map(user => `<@${user.trim()}>`).join(", ") || "(No users)";
                            const rolesString = permission.roles.map(role => `<@&${role.trim()}>`).join(", ") || "(No roles)";

                            infoEmbed.addFields({ name: permission.name, value: `Users: ${usersString}\nRoles: ${rolesString}` });
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "info": {
                        const permissionName = interaction.options.getString("permission", true)
                        const permission = await guildDataProfile.getPermission(permissionName);
                        if (!permission) return;

                        const infoEmbed = client.Functions.makeInfoEmbed({});

                        switch (permissionName) {
                            case "Administrator": {
                                infoEmbed.setTitle("Administrator");
                                infoEmbed.setDescription("Allows users to access any command and includes all other permissions");

                                break;
                            }

                            case "Moderator": {
                                infoEmbed.setTitle("Moderator");
                                infoEmbed.setDescription("Does nothing. This permission is a placeholder for future features");

                                break;
                            }

                            case "RobloxModerator": {
                                infoEmbed.setTitle("Roblox Moderator");
                                infoEmbed.setDescription("Allows users to use the bot's Roblox place management commands");

                                break;
                            }

                            case "RobloxGroupManager": {
                                infoEmbed.setTitle("Roblox Group Manager");
                                infoEmbed.setDescription("Allows users to use the bot's Roblox group management commands");

                                break;
                            }

                            case "PointsManager": {
                                infoEmbed.setTitle("Points Manager");
                                infoEmbed.setDescription("Allows users to manage any user's points, note, and ranklock state, as well as approve and deny pointlogs");

                                break;
                            }

                            case "PointsViewer": {
                                infoEmbed.setTitle("Points Viewer");
                                infoEmbed.setDescription("Allows users to view any user's points");

                                break;
                            }

                            case "CreatePointLogs": {
                                infoEmbed.setTitle("Create Point Logs");
                                infoEmbed.setDescription("Allows users to create new pointlogs");

                                break;
                            }

                            case "EventScheduler": {
                                infoEmbed.setTitle("Event Scheduler");
                                infoEmbed.setDescription("Allows users to schedule events");

                                break;
                            }

                            case "ScheduleManager": {
                                infoEmbed.setTitle("Schedule Manager");
                                infoEmbed.setDescription("Allows users to manage the schedule");

                                break;
                            }

                            default: {
                                infoEmbed.setTitle("Unknown Permission");
                                infoEmbed.setDescription("This permission does not exist");

                                break;
                            }
                        }

                        infoEmbed.addFields({ name: "Roles", value: permission.roles.map(role => `<@&${role}>`).join(", ") || "(No roles)" });
                        infoEmbed.addFields({ name: "Users", value: permission.users.map(user => `<@${user}>`).join(", ") || "(No users)" });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "add": {
                        const permissionName = interaction.options.getString("permission", true)
                        const role = interaction.options.getRole("role", false)
                        const user = interaction.options.getUser("user", false)

                        if (!role && !user) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Error", description: "You must provide a role or user to add a permission" })] });

                        const permission = await guildDataProfile.getPermission(permissionName);
                        if (!permission) return // ???? i have no idea how you would do this

                        if (role) {
                            if (!permission.roles.includes(role.id)) permission.roles.push(role.id)
                        };
                        if (user) {
                            if (!permission.users.includes(user.id)) permission.users.push(user.id)
                        };

                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Permissions",
                            description: `Added permission \`${permissionName}\` to `,
                            fields: [
                                {
                                    name: "Roles",
                                    value: permission.roles.map(role => `<@&${role}>`).join(", ") || "(No roles)",
                                    inline: false,
                                },
                                {
                                    name: "Users",
                                    value: permission.users.map(user => `<@${user}>`).join(", ") || "(No users)",
                                    inline: false,
                                }
                            ]
                        });

                        if (role) infoEmbed.setDescription(`${infoEmbed.data.description}, <@&${role.id}>`);
                        if (user) infoEmbed.setDescription(`${infoEmbed.data.description}, <@${user.id}>`);

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "remove": {
                        const permissionName = interaction.options.getString("permission", true)
                        const role = interaction.options.getRole("role", false)
                        const user = interaction.options.getUser("user", false)

                        if (!role && !user) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Error", description: "You must provide a role or user to remove a permission" })] });

                        const permission = await guildDataProfile.getPermission(permissionName);
                        if (!permission) return // ???? i have no idea how you would do this

                        if (role) {
                            if (permission.roles.includes(role.id)) permission.roles = permission.roles.filter(roleId => roleId !== role.id)
                        };

                        if (user) {
                            if (permission.users.includes(user.id)) permission.users = permission.users.filter(userId => userId !== user.id)
                        };

                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Permissions",
                            description: `Removed permission \`${permissionName}\` from `,
                            fields: [
                                {
                                    name: "Roles",
                                    value: permission.roles.map(role => `<@&${role}>`).join(", ") || "(No roles)",
                                    inline: false,
                                },
                                {
                                    name: "Users",
                                    value: permission.users.map(user => `<@${user}>`).join(", ") || "(No users)",
                                    inline: false,
                                }
                            ]
                        });

                        if (role) infoEmbed.setDescription(`${infoEmbed.data.description} <@&${role.id}>`);
                        if (user) infoEmbed.setDescription(`${infoEmbed.data.description} <@${user.id}>`);

                        await interaction.reply({ embeds: [infoEmbed] });
                        break;
                    }
                }

                break;
            }

            case "data": {
                switch (selectedCommand) {
                    case "show" : {
                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Data",
                            description: "Here is this guild's data",
                        })

                        infoEmbed.addFields({
                            name: "Guild",
                            value: `Name: \`${interaction.guild.name}\`\nShortname: \`${guildDataProfile.guild.shortName}\`\nId: \`${interaction.guild.id}\`\nMembers: \`${interaction.guild.memberCount}\`\nOwner: <@${interaction.guild.ownerId}>`,
                        })

                        infoEmbed.addFields({ name: "User Entries", value: `\`${guildDataProfile.users.size}\``, inline: true });
                        infoEmbed.addFields({ name: "Point Logs", value: `\`${guildDataProfile.pointlogs.size}\``, inline: true });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "deleteuser": {
                        const targetName = interaction.options.getString("user", true);
        
                        let robloxData;
                        try {
                            robloxData = await client.wrapblox.fetchUserByName(targetName);
                        } catch (error) {
                            return await interaction.reply({ embeds: [
                                client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                            ]})
                        }
        
                        if (!robloxData) return;

                        const userEntry = guildDataProfile.users.get(robloxData.id.toString());
                        if (!userEntry) return;

                        guildDataProfile.users.delete(robloxData.id.toString());
                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Data",
                            description: `Deleted user \`${robloxData.name}\``
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "export": {
                        await interaction.user.send({ content: "Below is a JSON file containing your guild's data", files: [{ attachment: Buffer.from(JSON.stringify(guildDataProfile.toJSON(), null, 2), "utf-8"), name: `guild_${interaction.guild.id}_data.json` }] });

                        await interaction.reply({ content: "Check your DMs!", ephemeral: true });
                        break;
                    }
                }
            }

            case "linkedguilds": {
                switch (selectedCommand) {
                    case "list": {
                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Linked Guilds",
                            description: "Here are all the linked guilds for this guild",
                            footer: { text: "Use /manageguild linkedguilds info <alias> to get more information about a guild", iconURL: MaterialIcons.omegainfo }
                        })

                        guildDataProfile.linkedGuilds.forEach(linkedGuild => {
                            infoEmbed.addFields({ name: `\`${linkedGuild.alias}\``, value: linkedGuild.guildId });
                        });

                        if (guildDataProfile.linkedGuilds.size === 0) infoEmbed.setDescription("This guild has no linked guilds");

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "info": {
                        const alias = interaction.options.getString("alias", true).toLowerCase();

                        const linkedGuild = await guildDataProfile.getlinkedGuild(alias);
                        if (!linkedGuild) return;

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Linked Guild",
                            description: `Here is information about linked guild \`${linkedGuild.alias}\``,
                        });

                        const actualGuild = await client.Functions.GetGuild(linkedGuild.guildId);
                        if (!actualGuild) return;

                        const guildOwner = await actualGuild.fetchOwner();
                        if (!guildOwner) return;

                        infoEmbed.addFields({
                            name: "Guild",
                            value: `Name: \`${actualGuild.name}\`\nId: \`${actualGuild.id}\`\nOwner: \`${guildOwner.user.username}\``,
                        })

                        infoEmbed.addFields({
                            name: "Settings",
                            value: linkedGuild.settings.size !== 0 ? Array.from(linkedGuild.settings.values()).map(setting => `${setting.name}: \`${setting.value}\``).join("\n") : "(No settings)",
                        });

                        const guildInvites = await actualGuild.invites.fetch();
                        if (guildInvites && guildInvites.size !== 0) {
                            guildInvites.filter(invite => invite.uses !== invite.maxUses);
                            guildInvites.filter(invite => invite.temporary !== false);
                            guildInvites.filter(invite => invite.expiresTimestamp === null);
    
                            if (guildInvites.size > 0) {
                                infoEmbed.addFields({
                                    name: "Invites",
                                    value: guildInvites.map(invite => `[${invite.code}](https://discord.gg/${invite.code})`).join("\n"),
                                })
                            }
                        }

                        infoEmbed.setThumbnail(actualGuild.iconURL());

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "add": {
                        /*
                            So OmegaOS has always traditionally limited the amount of linked guilds to 5,

                            Like many family traditions, the original intention behind the limit is shrouded in mystery,
                            yet cherished and followed with reverence.
                        */
                        if (guildDataProfile.linkedGuilds.size >= 5) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Error", description: "You can only have up to 5 linked guilds" })] });

                        const guildId = interaction.options.getString("guild-id", true);

                        const realGuild = await client.Functions.GetGuild(guildId);
                        if (!realGuild) return interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild not found", description: "The guild you provided does not exist, or the bot is not in it" })] });
                        const realGuildDataProfile = await client.Database.GetGuildProfile(realGuild.id, false);
                        if (!realGuildDataProfile) return;

                        //realGuildDataProfile.linkedGuilds.set(interaction.guild.id, { alias: alias, id: interaction.guild.id, _id: guildDataProfile._id });
                        guildDataProfile.linkedGuilds.set(realGuild.id, {
                            alias: realGuildDataProfile.guild.shortName,
                            guildId: realGuild.id,
                            _documentId: realGuildDataProfile._id,

                            settings: new Map()

                            ,
                        });

                        //await realGuildDataProfile.save();
                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Linked Guilds",
                            description: `Added linked guild \`${realGuildDataProfile.guild.shortName}\` with id \`${guildId}\``
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }

                    case "remove": {
                        const alias = interaction.options.getString("alias", true)

                        const linkedGuild = await guildDataProfile.getlinkedGuild(alias);
                        if (!linkedGuild) return;

                        const realGuild = await client.Functions.GetGuild(linkedGuild.guildId);
                        if (!realGuild) {
                            guildDataProfile.linkedGuilds.delete(alias);
                            interaction.reply({ embeds: [client.Functions.makeErrorEmbed({ title: "Guild not found", description: "The guild you provided does not exist, or the bot is not in it" })] });
                            return;
                        }

                        //const realGuildDataProfile = await client.Database.GetGuildProfile(realGuild.id, false);

                        //realGuildDataProfile.linkedGuilds.delete(interaction.guild.id);
                        guildDataProfile.linkedGuilds.delete(realGuild.id);

                        //await realGuildDataProfile.save();
                        await guildDataProfile.save();

                        const infoEmbed = client.Functions.makeInfoEmbed({
                            title: "Linked Guilds",
                            description: `Removed linked guild \`${alias}\``
                        });

                        await interaction.reply({ embeds: [infoEmbed] });

                        break;
                    }
                }
            }
        }
    }
});

export default manageGuild;