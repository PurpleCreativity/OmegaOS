import { AutocompleteInteraction, ButtonStyle, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";

const groupCommand = new Command({
    name: "group",
    description: "Manage your roblox group",
    dmpermission: false,
    customPermissions: ["RobloxGroupManager"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("info")
            .setDescription("Get information about the group"),

        new SlashCommandSubcommandBuilder()
            .setName("link")
            .setDescription("Link your roblox group")
            .addStringOption(option => option.setName("group-id").setDescription("The group to link").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("unlink")
            .setDescription("Unlink your roblox group"),

        new SlashCommandSubcommandBuilder()
            .setName("roles")
            .setDescription("A list of the group roles."),

        new SlashCommandSubcommandBuilder()
            .setName("exile")
            .setDescription("Exile a user from the group")
            .addStringOption(option => option.setName("user").setDescription("The user to exile").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("setrank")
            .setDescription("Set the rank of a user")
            .addStringOption(option => option.setName("user").setDescription("The user to set the rank for").setRequired(true))
            .addStringOption(option => option.setName("rank").setDescription("The rank to set").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("getrole")
            .setDescription("Get the rank of a user")
            .addStringOption(option => option.setName("user").setDescription("The user to get the rank for").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("deletepost")
            .setDescription("Delete a post from the group wall")
            .addStringOption(option => option.setName("post-id").setDescription("The id of the post to delete").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("deleteposts")
            .setDescription("Delete all posts from the group wall sent by a user")
            .addStringOption(option => option.setName("user").setDescription("The user to delete posts from").setRequired(true)),

        new SlashCommandSubcommandBuilder()
            .setName("joinrequest")
            .setDescription("Accept or decline a join request")
            .addStringOption(option => option.setName("user").setDescription("The user to accept or decline").setRequired(true))
            .addBooleanOption(option => option.setName("accept").setDescription("Whether to accept or decline the request").setRequired(true)),     

        new SlashCommandSubcommandBuilder()
            .setName("shout")
            .setDescription("Set the group shout")
            .addStringOption(option => option.setName("message").setDescription("The message to set (pass in CLEAR to delete the shout)").setMaxLength(500).setRequired(true)),
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const selectedCommand = interaction.options.getSubcommand();

        if (selectedCommand == "link" || selectedCommand == "unlink") {
            if (!(interaction.user.id === client.config.ownerId || client.config.devlist.includes(interaction.user.id))) {
                return await interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({ title: "Error", description: "You must be a bot developer to use this command" })
                ]})
            }
        }

        if ((!guildDataProfile.roblox.groupId || guildDataProfile.roblox.groupId === 0) && selectedCommand !== "link") {
            return await interaction.reply({ embeds: [
                client.Functions.makeErrorEmbed({ title: "Group not linked", description: "You need to link your group before you can use this command." })
            ]})
        }
        
        switch (selectedCommand) {
            case "info": {
                let robloxGroup;
                try {
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxGroup) return;

                const groupOwner = await robloxGroup.fetchOwner();

                await interaction.reply({ embeds: [
                    client.Functions.makeInfoEmbed({
                        title: robloxGroup.name,
                        description: "Here is some information about the group",
                        url: `https://www.roblox.com/groups/${robloxGroup.id}`,
                        fields: [
                            {
                                name: "Description",
                                value: robloxGroup.description || "(No group description found)",
                                inline: false
                            },
                            {
                                name: "Owner",
                                value: `[${groupOwner.name}](https://www.roblox.com/users/${groupOwner.id})`,
                                inline: true
                            },
                            {
                                name: "Member count",
                                value: `\`${robloxGroup.rawdata.memberCount}\``,
                                inline: true
                            },
                            {
                                name: "Shout",
                                value: robloxGroup.rawdata.shout.body ? `[${robloxGroup.rawdata.shout.poster.username}](https://www.roblox.com/users/${robloxGroup.rawdata.shout.poster.userId}): ${robloxGroup.rawdata.shout.body}` : "No shout found",
                                inline: false
                            }
                        ],
                        thumbnail: await robloxGroup.fetchIcon()
                    })
                ]})

                break;
            }

            case "roles": {
                let robloxGroup;
                try {
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxGroup) return;

                const roles = await robloxGroup.fetchRoles();
                roles.sort((a, b) => b.rank - a.rank);
                const rolesString = roles.map(role => `${role.name} (\`${role.rank}\`)`).join("\n");

                await interaction.reply({ embeds: [
                    client.Functions.makeInfoEmbed({
                        title: "Group roles",
                        description: `Here is a list of the group roles`,
                        fields: [
                            {
                                name: "Roles",
                                value: rolesString,
                                inline: false
                            }
                        ]
                    })
                ]})

                break;
            }

            case "link": {
                const groupId = interaction.options.getString("group-id", true);

                let robloxGroup;
                try {
                    robloxGroup = await client.wrapblox.fetchGroup(Number.parseInt(groupId));
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxGroup) return;

                const groupOwner = await robloxGroup.fetchOwner();

                const buttonEmbed = new ButtonEmbed(
                    client.Functions.makeInfoEmbed({
                        title: robloxGroup.name,
                        description: "**Are you sure you want to link this group?**",
                        url: `https://www.roblox.com/groups/${groupId}`,
                        fields: [
                            {
                                name: "Description",
                                value: robloxGroup.description || "(No group description found)",
                                inline: false
                            },
                            {
                                name: "Owner",
                                value: `[${groupOwner.name}](https://www.roblox.com/users/${groupOwner.id})`,
                                inline: false
                            }
                        ],
                        thumbnail: await robloxGroup.fetchIcon()
                    })
                );

                buttonEmbed.addButton({
                    label: "Link Group",
                    style: ButtonStyle.Success,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        try {
                            await guildDataProfile.linkRobloxGroup(robloxGroup.id);

                            await interaction.editReply({ embeds: [
                                client.Functions.makeSuccessEmbed({ title: "Group linked", description: `Successfully linked group \`${robloxGroup.name}\` (\`${robloxGroup.id}\`)` })
                            ], components: [] });
                        } catch (error) {
                            buttonInteraction.reply({ embeds: [
                                client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                            ]})
                        }
                    }
                })

                buttonEmbed.addButton({
                    label: "Cancel",
                    style: ButtonStyle.Danger,
                    allowedUsers: [interaction.user.id],

                    function: async (buttonInteraction) => {
                        interaction.editReply({ embeds: [
                            client.Functions.makeInfoEmbed({ title: "Operation cancelled", description: "Cancelled group link" })
                        ], components: [] })
                    }
                });

                await interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "unlink": {
                try {
                    await guildDataProfile.linkRobloxGroup(0);

                    await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Group unlinked", description: "Successfully unlinked the group" })
                    ]})
                } catch (error) {
                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "exile": {
                const targetName = interaction.options.getString("user", true);

                let robloxData;
                let robloxGroup;
                try {
                    robloxData = await client.wrapblox.fetchUserByName(targetName);
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxData || !robloxGroup) return;

                try {
                    await client.wrapblox.fetchHandler.fetch("DELETE", "Groups", `/groups/${robloxGroup.id}/users/${robloxData.id}`)

                    return await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Operation successful", description: `Successfully exiled \`${robloxData.name}\` from the group.` })
                    ]})
                } catch (error) {
                    client.error(`An error occurred while exiling user ${robloxData.name} from group ${robloxGroup.name}: ${error}`);

                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "setrank": {
                const targetName = interaction.options.getString("user", true);
                const TargetRole = interaction.options.getString("rank", true).trim().toLowerCase();

                let robloxData;
                let robloxGroup;
                try {
                    robloxData = await client.wrapblox.fetchUserByName(targetName);
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxData || !robloxGroup) return;

                const groupRoles = await robloxGroup.fetchRoles();

                let targetRole = groupRoles.find(role => role.name.toLowerCase() === TargetRole);
                if (!targetRole) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "Role not found", description: "The role you provided was not found in the group." })
                    ]})
                }

                try {
                    await client.wrapblox.fetchHandler.fetch("PATCH", "Groups", `/groups/${robloxGroup.id}/users/${robloxData.id}`, 
                        {
                            body: {
                                roleId: targetRole.id
                            }
                        }
                    )

                    return await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Operation successful", description: `Successfully set the rank of \`${robloxData.name}\` to \`${targetRole.name}\` (\`${targetRole.id}\`)` })
                    ]})
                } catch (error) {
                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "deletepost": {
                const postId = interaction.options.getString("post-id", true);

                let robloxGroup;
                try {
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxGroup) return;

                try {
                    await client.wrapblox.fetchHandler.fetch("DELETE", "Groups", `/groups/${robloxGroup.id}/wall/posts/${postId}`)

                    await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Operation successful", description: `Successfully deleted post \`${postId}\`` })
                    ]})
                } catch (error) {
                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "deleteposts": {
                const targetName = interaction.options.getString("user", true);

                let robloxData;
                let robloxGroup;

                try {
                    robloxData = await client.wrapblox.fetchUserByName(targetName);
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxData || !robloxGroup) return;

                try {
                    await client.wrapblox.fetchHandler.fetch("DELETE", "Groups", `/groups/${robloxGroup.id}/wall/users/${robloxData.id}/posts`)

                    await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Operation successful", description: `Successfully deleted all posts from \`${robloxData.name}\`` })
                    ]})
                } catch (error) {
                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "joinrequest": {
                const targetName = interaction.options.getString("user", true);
                const accept = interaction.options.getBoolean("accept", true);

                let robloxData;
                let robloxGroup;
                try {
                    robloxData = await client.wrapblox.fetchUserByName(targetName);
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxData || !robloxGroup) return;

                try {
                    if (accept) {
                        await client.wrapblox.fetchHandler.fetch("POST", "Groups", `/groups/${robloxGroup.id}/join-requests/users/${robloxData.id}`)
                    } else {
                        await client.wrapblox.fetchHandler.fetch("DELETE", "Groups", `/groups/${robloxGroup.id}/join-requests/users/${robloxData.id}`)
                    }

                    return await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({ title: "Operation successful", description: `Successfully ${accept ? "accepted" : "declined"} the join request from \`${robloxData.name}\`` })
                    ]})
                } catch (error) {
                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }

            case "getrole": {
                const targetName = interaction.options.getString("user", true).trim().toLowerCase();
                
                let robloxData;
                let robloxGroup;
                try {
                    robloxData = await client.wrapblox.fetchUserByName(targetName);
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxData || !robloxGroup) return;

                if (!await robloxData.inGroup(guildDataProfile.roblox.groupId)) return await interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({ title: "User not in group", description: "The user you provided is not in the group." })
                ] });

                const members = await robloxGroup.fetchMembers();
                const member = members.find(member => member.userId === robloxData.id);

                if (!member) return await interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({ title: "User not found", description: "The user you provided was not found in the group." })
                ] });

                await interaction.reply({ embeds: [
                    client.Functions.makeInfoEmbed({
                        title: "User rank",
                        description: `\`${robloxData.name}\` is ranked as \`${member.role.name}\` (\`${member.role.rank}\`) in the group`,
                    })
                ]})

                break;
            }

            case "shout": {
                const userMessage = interaction.options.getString("message", true);

                let robloxGroup;
                try {
                    robloxGroup = await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId);
                } catch (error) {
                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                if (!robloxGroup) return;

                try {
                    await client.wrapblox.fetchHandler.fetch("PATCH", "Groups", `/groups/${robloxGroup.id}/status`,
                        {
                            body: {
                                message: userMessage !== "CLEAR" ? userMessage : "",
                            }
                        }
                    )

                    await interaction.reply({ embeds: [
                        client.Functions.makeSuccessEmbed({
                            title: "Operation successful",
                            description: userMessage !== "CLEAR" ? `Successfully set the group shout to: \`${userMessage}\`` : "Successfully cleared the group shout",
                            footer: { text: "May look diffrent on roblox due to roblox's filter" }
                        })
                    ]})
                } catch (error) {
                    client.error(error)

                    await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "An error occurred", description: (error as Error).message })
                    ]})
                }

                break;
            }
        }
    },
});

export default groupCommand;