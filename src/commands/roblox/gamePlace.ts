import { ButtonStyle, EmbedBuilder, SlashCommandSubcommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import Modal from "../../classes/Modal.js";
import { AxiosError } from "axios";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { MaterialEmojis, MaterialIcons } from "../../assets/materialIcons.js";
import { info } from "console";

const gamePlace = new Command({
    name: "place",
    description: "Roblox place management",
    dmpermission: false,
    userApp: false,
    permissions: [],
    customPermissions: ["RobloxModerator"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Add a place to the database")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Remove a place from the database")
            .addStringOption(option => option.setName("place").setDescription("The place to remove").setRequired(true).setAutocomplete(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("list")
            .setDescription("List all places in the database")
        ,

        new SlashCommandSubcommandBuilder()
            .setName("ban")
            .setDescription("Ban a user from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to ban the user from").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to ban").setRequired(true))
            .addStringOption(option => option.setName("display-reason").setDescription("Reason shown to the user on join").setMaxLength(400).setRequired(true))
            .addStringOption(option => option.setName("private-reason").setDescription("Private reason for the ban").setMaxLength(300).setRequired(true))
            .addStringOption(option => option.setName("duration").setDescription("Duration of the ban (e.g. 1d, 1h, 1m, 1s, 1y, inf, perm)").setRequired(true))
            .addBooleanOption(option => option.setName("exclude-alt-accounts").setDescription("Exclude alt accounts from the ban").setRequired(false))
            .addBooleanOption(option => option.setName("inherited").setDescription("Whether to inherit the ban from the parent universe or not").setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalban")
            .setDescription("Ban a user from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to ban").setRequired(true))
            .addStringOption(option => option.setName("display-reason").setDescription("Reason shown to the user on join").setMaxLength(400).setRequired(true))
            .addStringOption(option => option.setName("private-reason").setDescription("Private reason for the ban").setMaxLength(300).setRequired(true))
            .addStringOption(option => option.setName("duration").setDescription("Duration of the ban (e.g. 1d, 1h, 1m, 1s, 1y, inf, perm)").setRequired(true))
            .addBooleanOption(option => option.setName("exclude-alt-accounts").setDescription("Exclude alt accounts from the ban").setRequired(false))
            .addBooleanOption(option => option.setName("inherited").setDescription("Whether to inherit the ban from the parent universe or not").setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("unban")
            .setDescription("Unban a user from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to unban the user from").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to unban").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalunban")
            .setDescription("Unban a user from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to unban").setRequired(true))

        ,

        new SlashCommandSubcommandBuilder()
            .setName("checkban")
            .setDescription("Check if a user is banned from a place")
            .addStringOption(option => option.setName("place").setDescription("The place to check the ban for").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("username").setDescription("The user to check the ban for").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("globalcheckban")
            .setDescription("Check if a user is banned from all places")
            .addStringOption(option => option.setName("username").setDescription("The user to check the ban for").setRequired(true))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("servers")
            .setDescription("Returns a list of active game servers")
            .addStringOption(option => option.setName("place").setDescription("The place in which the server is").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("sorting-order").setDescription("The server to manage").addChoices([
                { name: "Ascending", value: "asc" },
                { name: "Descending", value: "des" }
            ]).setRequired(true))
            .addNumberOption(option => option.setName("limit").setDescription("The amount of servers to return").addChoices([
                { name: "10", value: 10 },
                { name: "25", value: 25 },
                { name: "50", value: 50 },
                { name: "100", value: 100 },
            ]).setRequired(false))
        ,

        new SlashCommandSubcommandBuilder()
            .setName("getlogs")
            .setDescription("Returns a server's astralogs")
            .addStringOption(option => option.setName("place").setDescription("The place in which the server is").setAutocomplete(true).setRequired(true))
            .addStringOption(option => option.setName("server-id").setDescription("The server to get the logs for").setAutocomplete(true).setRequired(true))
        ,
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(true);
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, true);

        const convertStringToSeconds = (timeString: string): number => {
            const timeRegex = /(\d+)([smhdMy])/g;
            const timeUnits: { [key: string]: number } = {
                s: 1,
                m: 60,
                h: 3600,
                d: 86400,
                M: 2592000,
                y: 31536000,
            };
        
            let totalSeconds = 0;
            let match;
        
            while ((match = timeRegex.exec(timeString))) {
                const value = parseInt(match[1]);
                const unit = match[2];
        
                if (timeUnits.hasOwnProperty(unit)) {
                    totalSeconds += value * timeUnits[unit];
                }
            }
        
            return totalSeconds;
        };

        const convertToEpochTimestamp = (dateString: string): number => {
            let date = new Date(dateString) as unknown as number;
            date = Math.round(date / 1000);
            
            return date;
        };

        const checkBan = async (placeName: string, userId: number) => {
            const place = guildDataProfile.roblox.places.get(placeName);
            if (!place) throw new Error("Place not found");

            const universeId = await client.Functions.ConvertPlaceIDToUniverseID(Number.parseInt(place.id))
            const placeKey = client.Functions.Decrypt(place.key, guildDataProfile.iv);

            const request = await client.axios.request({
                method: 'GET',
                url: `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': placeKey
                },
            })

            return request
        };

        const placeBan = async (placeName: string, userId: number, banActive: boolean, displayReason?: string, privateReason?: string, duration?: number, excludeAltAccounts?: boolean, inherited?: boolean) => {
            duration = duration || 0;
            excludeAltAccounts = excludeAltAccounts || false;
            inherited = inherited || true;

            const place = guildDataProfile.roblox.places.get(placeName);
            if (!place) throw new Error("Place not found");

            const universeId = await client.Functions.ConvertPlaceIDToUniverseID(Number.parseInt(place.id))
            const placeKey = client.Functions.Decrypt(place.key, guildDataProfile.iv);

            let data = {};

            if (banActive !== true) {
                data = {
                    gameJoinRestriction: {
                        active: false,
                    }
                }
            } else if (duration === 0) {
                data = {
                    gameJoinRestriction: {
                        active: true,
                        privateReason: privateReason,
                        displayReason: displayReason,
                        excludeAltAccounts: excludeAltAccounts,
                        inherited: inherited
                    }
                }
            } else {
                data = {
                    gameJoinRestriction: {
                        active: true,
                        duration: `${duration}s`,
                        privateReason: privateReason,
                        displayReason: displayReason,
                        excludeAltAccounts: excludeAltAccounts,
                        inherited: inherited
                    }
                }
            }

            const request = await client.axios.request({
                method: 'PATCH',
                url: `https://apis.roblox.com/cloud/v2/universes/${universeId}/user-restrictions/${userId}`,
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': placeKey
                },
                data: data
            })

            return request
        };

        switch (subcommand) {
            case "add": {
                if (guildDataProfile.roblox.places.size >= 25) return await interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({ title: "Couldn't add place", description: "You have reached the maximum amount of allowed places (\`10\`)" })
                ] });
                
                const modal = new Modal({
                    Title: "Add a place",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("name")
                            .setLabel("Place Name")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(10)
                            .setRequired(true)
                        ,

                        new TextInputBuilder()
                            .setCustomId("id")
                            .setLabel("Place Id")
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(20)
                            .setRequired(true)
                        ,

                        new TextInputBuilder()
                            .setCustomId("key")
                            .setLabel("Place API Key")
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(2000)
                            .setRequired(true)
                        ,
                    ]
                });

                const response = await client.Functions.PromptModal(interaction, modal.getModal());
//                await response.deferReply();

                if (!response) return;

                const placeName = response.fields.getTextInputValue("name");
                const placeId = response.fields.getTextInputValue("id");
                const placeKey = client.Functions.Encypt(response.fields.getTextInputValue("key"), guildDataProfile.iv).text;

                guildDataProfile.roblox.places.set(placeName, { name: placeName, id: placeId, key: placeKey });
                await guildDataProfile.save();

                return response.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Place added", description: `Successfully added \`${placeName}\` to the place list` })] });
            }

            case "remove": {
                const placeName = interaction.options.getString("place", true);

                if (!guildDataProfile.roblox.places.has(placeName)) return await interaction.reply({ content: `Place "${placeName}" does not exist in the database` });

                guildDataProfile.roblox.places.delete(placeName);
                await guildDataProfile.save();

                return await interaction.reply({ embeds: [client.Functions.makeSuccessEmbed({ title: "Place removed", description: `Successfully removed "${placeName}" from the place list` })] });
            }

            case "list": {
                const infoEmbed = client.Functions.makeInfoEmbed({
                    title: "Place List",
                    description: `Here is a list of all places in the database`
                })

                guildDataProfile.roblox.places.forEach((place) => {
                    infoEmbed.addFields({ name: place.name, value: `Id: \`${place.id}\`\n[Game Page](https://www.roblox.com/games/${place.id})` });
                });

                return await interaction.reply({ embeds: [infoEmbed] });
            }

            case "ban": {
                const placeName = interaction.options.getString("place", true);
                const username = interaction.options.getString("username", true);
                const displayReason = interaction.options.getString("display-reason", true);
                const privateReason = interaction.options.getString("private-reason", true) + `\nModerator: ${interaction.user.username}\nBanned via the discord`;
                const durationString = interaction.options.getString("duration", true);
                const duration = convertStringToSeconds(durationString);
                const excludeAltAccounts = interaction.options.getBoolean("exclude-alt-accounts", false) || false;
                const inherited = interaction.options.getBoolean("inherited", false) || true;

                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: "Place not found"
                    })
                ]})

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                try {
                    const existingBan = await checkBan(place.name, robloxUser.id);

                    if (existingBan.data.gameJoinRestriction.active) {
                        const banDuration = existingBan.data.gameJoinRestriction.duration ? Number.parseInt(existingBan.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                        const bannedOn = convertToEpochTimestamp(existingBan.data.gameJoinRestriction.startTime);
                        const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                        const baseEmbed = client.Functions.makeWarnEmbed({
                            title: "User already banned",
                            description: `User [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) is already banned from the place \`${place.name}\` (\`${place.id}\`)`,
                            fields: [
                                { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                                { name: "Expires", value: banDuration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : `**(Permanent)**`, inline: true },
                                { name: "Display Reason", value: `\`${existingBan.data.gameJoinRestriction.displayReason}\``, inline: false },
                                { name: "Private Reason", value: `\`${existingBan.data.gameJoinRestriction.privateReason}\``, inline: false },
                                { name: "Excludes Alt Accounts", value: `\`${existingBan.data.gameJoinRestriction.excludeAltAccounts}\``, inline: true },
                                { name: "Inherited", value: `\`${existingBan.data.gameJoinRestriction.inherited}\``, inline: true },
                            ]
                        })

                        const buttonEmbed = new ButtonEmbed(baseEmbed)

                        buttonEmbed.addButton({
                            label: "Overwrite Ban",
                            style: ButtonStyle.Success,
                            customId: client.Functions.GenerateID(),
                            allowedUsers: [interaction.user.id],
                            
                            function: async (ButtonInteraction) => {
                                try {
                                    const ban = await placeBan(place.name, robloxUser.id, true, displayReason, privateReason, duration, excludeAltAccounts, inherited)
                                    const expiresOn = duration !== 0 ? Math.floor(convertToEpochTimestamp(ban.data.gameJoinRestriction.startTime) + duration) : 0;
                
                                    const embed = client.Functions.makeSuccessEmbed({
                                        title: "Ban overwrite successful",
                                        description: `Successfully banned [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) from the place \`${place.name}\` (\`${place.id}\`)`,
                                        fields: [
                                            { name: "Expires", value: expiresOn !== 0 ? `<t:${expiresOn}:R>\n<t:${expiresOn}:R>` : `**(Permanent)**`, inline: false },
                                            { name: "Display Reason", value: `\`${displayReason}\``, inline: false },
                                            { name: "Private Reason", value: `\`${privateReason}\``, inline: false },
                                            { name: "Excludes Alt Accounts", value: `\`${excludeAltAccounts}\``, inline: true },
                                            { name: "Inherited", value: `\`${inherited}\``, inline: true },
                                        ]
                                    })
                
                                    return await interaction.editReply({ embeds: [embed], components: [] });
                                } catch (error) {
                                    console.log(error)
                                    if (error instanceof AxiosError) {
                                        return await interaction.followUp({ embeds: [
                                            client.Functions.makeErrorEmbed({
                                                title: "An error occured",
                                                description: error.response?.data.message || "Unknown error"
                                            })
                                        ]})
                                    }
                
                                    return await interaction.followUp({ embeds: [
                                        client.Functions.makeErrorEmbed({
                                            title: "An error occured",
                                            description: `\`${JSON.stringify(error)}\``  || "Unknown error"
                                        })
                                    ]})
                                }
                            }
                        })

                        buttonEmbed.addButton({
                            label: "Cancel",
                            style: ButtonStyle.Danger,
                            customId: client.Functions.GenerateID(),
                            allowedUsers: [interaction.user.id],
                            
                            function: async (ButtonInteraction) => {
                                const cancelEmbed = new EmbedBuilder(baseEmbed.data)
                                cancelEmbed.setAuthor({ name: "Cancelled", iconURL: MaterialIcons.omegaerror });
                                cancelEmbed.setColor(0xff0000)

                                return await interaction.editReply({ embeds: [cancelEmbed], components: [] });
                            }
                        })

                        await interaction.reply(buttonEmbed.getMessageData())
                    } else {
                        try {
                            const ban = await placeBan(place.name, robloxUser.id, true, displayReason, privateReason, duration, excludeAltAccounts, inherited)
                            const expiresOn = duration !== 0 ? Math.floor(convertToEpochTimestamp(ban.data.gameJoinRestriction.startTime) + duration) : 0;
        
                            const embed = client.Functions.makeSuccessEmbed({
                                title: "Ban successful",
                                description: `Successfully banned [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) from the place \`${place.name}\` (\`${place.id}\`)`,
                                fields: [
                                    { name: "Expires", value: expiresOn !== 0 ? `<t:${expiresOn}:R>\n<t:${expiresOn}:R>` : `**(Permanent)**`, inline: false },
                                    { name: "Display Reason", value: `\`${displayReason}\``, inline: false },
                                    { name: "Private Reason", value: `\`${privateReason}\``, inline: false },
                                    { name: "Excludes Alt Accounts", value: `\`${excludeAltAccounts}\``, inline: true },
                                    { name: "Inherited", value: `\`${inherited}\``, inline: true },
                                ]
                            })
        
                            return await interaction.reply({ embeds: [embed]})
                        } catch (error) {
                            console.log(error)
                            if (error instanceof AxiosError) {
                                return await interaction.reply({ embeds: [
                                    client.Functions.makeErrorEmbed({
                                        title: "An error occured",
                                        description: error.response?.data.message || "Unknown error"
                                    })
                                ]})
                            }
        
                            return await interaction.reply({ embeds: [
                                client.Functions.makeErrorEmbed({
                                    title: "An error occured",
                                    description: `\`${JSON.stringify(error)}\``  || "Unknown error"
                                })
                            ]})
                        }

                        break;
                    }
                } catch (error) {
                    console.log(error)
                    if (error instanceof AxiosError) {
                        return await interaction.reply({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occured",
                                description: error.response?.data.message || "Unknown error"
                            })
                        ]})
                    }

                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `\`${JSON.stringify(error)}\``  || "Unknown error"
                        })
                    ]})
                }

                break;
            }

            case "globalban": {
                const username = interaction.options.getString("username", true);
                const displayReason = interaction.options.getString("display-reason", true);
                const privateReason = interaction.options.getString("private-reason", true) + `\nModerator: ${interaction.user.username}\nGlobal Banned via the discord`;
                const durationString = interaction.options.getString("duration", true);
                const duration = convertStringToSeconds(durationString);
                const excludeAltAccounts = interaction.options.getBoolean("exclude-alt-accounts", false) || false;
                const inherited = interaction.options.getBoolean("inherited", false) || true;

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                await interaction.deferReply();

                const infoEmbed = client.Functions.makeInfoEmbed({ title: `Global Banned \`${robloxUser.name}\``, description: `\`${robloxUser.name}\` has been banned from the following places:` });

                for (const place of guildDataProfile.roblox.places.values()) {
                    try {
                        const ban = await placeBan(place.name, robloxUser.id, true, displayReason, privateReason, duration, excludeAltAccounts, inherited)

                        const bannedOn = convertToEpochTimestamp(ban.data.gameJoinRestriction.startTime);
                        const expiresOn = duration !== 0 ? Math.floor(convertToEpochTimestamp(ban.data.gameJoinRestriction.startTime) + duration) : 0;

                        infoEmbed.addFields({ name: `✅ \`${place.name}\``, value: `Banned successfully` });
                    } catch (error) {
                        infoEmbed.addFields({ name: `⚠️ \`${place.name}\``, value: `Error while banning: \`${error}\`` });
                    }
                }

                return interaction.editReply({ embeds: [infoEmbed] });
            }

            case "unban": {
                const placeName = interaction.options.getString("place", true);
                const username = interaction.options.getString("username", true);

                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: "Place not found"
                    })
                ]})

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                try {
                    const existingBan = await checkBan(place.name, robloxUser.id);

                    if (!existingBan.data.gameJoinRestriction.active) {
                        return interaction.reply({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "Ban entry not found",
                                description: `User [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) is not banned from the place \`${place.name}\` (\`${place.id}\`)`
                            })
                        ]})
                    }

                    const banDuration = existingBan.data.gameJoinRestriction.duration ? Number.parseInt(existingBan.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                        const bannedOn = convertToEpochTimestamp(existingBan.data.gameJoinRestriction.startTime);
                        const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                        const baseEmbed = client.Functions.makeWarnEmbed({
                            title: "Ban entry found",
                            description: `User [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) is currently banned from the place \`${place.name}\` (\`${place.id}\`)`,
                            fields: [
                                { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                                { name: "Expires", value: banDuration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : `**(Permanent)**`, inline: true },
                                { name: "Display Reason", value: `\`${existingBan.data.gameJoinRestriction.displayReason}\``, inline: false },
                                { name: "Private Reason", value: `\`${existingBan.data.gameJoinRestriction.privateReason}\``, inline: false },
                                { name: "Excludes Alt Accounts", value: `\`${existingBan.data.gameJoinRestriction.excludeAltAccounts}\``, inline: true },
                                { name: "Inherited", value: `\`${existingBan.data.gameJoinRestriction.inherited}\``, inline: true },
                            ]
                        })

                        const buttonEmbed = new ButtonEmbed(baseEmbed)

                        buttonEmbed.addButton({
                            label: "Unban",
                            style: ButtonStyle.Success,
                            customId: client.Functions.GenerateID(),
                            allowedUsers: [interaction.user.id],

                            function: async (ButtonInteraction) => {
                                const unban = await placeBan(place.name, robloxUser.id, false)

                                const embed = client.Functions.makeSuccessEmbed({
                                    title: "Unban successful",
                                    description: `Successfully unbanned [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) from the place \`${place.name}\` (\`${place.id}\`)`
                                })

                                return await interaction.editReply({ embeds: [embed], components: [] });
                            }
                        })

                        buttonEmbed.addButton({
                            label: "Cancel",
                            style: ButtonStyle.Danger,
                            customId: client.Functions.GenerateID(),
                            allowedUsers: [interaction.user.id],

                            function: async (ButtonInteraction) => {
                                const cancelEmbed = new EmbedBuilder(baseEmbed.data)
                                cancelEmbed.setAuthor({ name: "Cancelled", iconURL: MaterialIcons.omegaerror });
                                cancelEmbed.setColor(0xff0000)

                                return await interaction.editReply({ embeds: [cancelEmbed], components: [] });
                            }
                        })

                        await interaction.reply(buttonEmbed.getMessageData())
                } catch (error) {
                    console.log(error)
                    if (error instanceof AxiosError) {
                        return await interaction.reply({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occured",
                                description: error.response?.data.message || "Unknown error"
                            })
                        ]})
                    }

                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `\`${JSON.stringify(error)}\``  || "Unknown error"
                        })
                    ]})
                }

                break;
            }

            case "globalunban": {
                const username = interaction.options.getString("username", true);

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                await interaction.deferReply();

                const infoEmbed = client.Functions.makeInfoEmbed({ title: `Global Unbanned \`${robloxUser.name}\``, description: `\`${robloxUser.name}\` has been unbanned from the following places:` });

                for (const place of guildDataProfile.roblox.places.values()) {
                    try {
                        const unban = await placeBan(place.name, robloxUser.id, false)

                        infoEmbed.addFields({ name: `✅ \`${place.name}\``, value: `Unbanned successfully` });
                    } catch (error) {
                        infoEmbed.addFields({ name: `⚠️ \`${place.name}\``, value: `Error while unbanning: \`${error}\`` });
                    }
                }

                return interaction.editReply({ embeds: [infoEmbed] });

                break;
            }

            case "checkban": {
                const placeName = interaction.options.getString("place", true);
                const username = interaction.options.getString("username", true);

                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: "Place not found"
                    })
                ]})

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                try {
                    const existingBan = await checkBan(place.name, robloxUser.id);

                    if (!existingBan.data.gameJoinRestriction.active) {
                        return interaction.reply({ embeds: [
                            client.Functions.makeInfoEmbed({
                                title: "User not banned",
                                description: `User [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) is not banned from the place \`${place.name}\` (\`${place.id}\`)`
                            })
                        ]})
                    }

                    const banDuration = existingBan.data.gameJoinRestriction.duration ? Number.parseInt(existingBan.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                    const bannedOn = convertToEpochTimestamp(existingBan.data.gameJoinRestriction.startTime);
                    const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                    const embed = client.Functions.makeWarnEmbed({
                        title: "User banned",
                        description: `User [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile) is currently banned from the place \`${place.name}\` (\`${place.id}\`)`,
                        fields: [
                            { name: "Banned", value: `<t:${bannedOn}:F>\n<t:${bannedOn}:R>`, inline: true },
                            { name: "Expires", value: banDuration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : `**(Permanent)**`, inline: true },
                            { name: "Display Reason", value: `\`${existingBan.data.gameJoinRestriction.displayReason}\``, inline: false },
                            { name: "Private Reason", value: `\`${existingBan.data.gameJoinRestriction.privateReason}\``, inline: false },
                            { name: "Excludes Alt Accounts", value: `\`${existingBan.data.gameJoinRestriction.excludeAltAccounts}\``, inline: true },
                            { name: "Inherited", value: `\`${existingBan.data.gameJoinRestriction.inherited}\``, inline: true },
                        ]
                    })

                    return await interaction.reply({ embeds: [embed] })
                } catch (error) {
                    console.log(error)
                    if (error instanceof AxiosError) {
                        return await interaction.reply({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occured",
                                description: error.response?.data.message || "Unknown error"
                            })
                        ]})
                    }

                    return await interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `\`${JSON.stringify(error)}\``  || "Unknown error"
                        })
                    ]})
                }

                break;
            }

            case "globalcheckban": {
                const username = interaction.options.getString("username", true);

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: `User not found`,
                        })
                    ]})
                }

                const infoEmbed = client.Functions.makeInfoEmbed({ title: `Global Ban Check for \`${robloxUser.name}\`` });

                await interaction.deferReply();

                for (const place of guildDataProfile.roblox.places.values()) {
                    try {
                        const banCheck = await checkBan(place.name, robloxUser.id);

                        if (!banCheck.data.gameJoinRestriction.active) {
                            infoEmbed.addFields({ name: `❌ \`${place.name}\``, value: "Not banned" });
                            continue;
                        }

                        const banDuration = banCheck.data.gameJoinRestriction.duration ? Number.parseInt(banCheck.data.gameJoinRestriction.duration.slice(0, -1)) : 0;
                        const bannedOn = convertToEpochTimestamp(banCheck.data.gameJoinRestriction.startTime);
                        const expiresOn = (banDuration && banDuration !== 0) ? Math.floor(bannedOn + banDuration) : 0;

                        infoEmbed.addFields({ name: `✅ \`${place.name}\``, value: `Banned: <t:${bannedOn}:F> [<t:${bannedOn}:R>]\nExpires: ${banDuration !== 0 ? `<t:${expiresOn}:F>\n<t:${expiresOn}:R>` : "**(Permanent)**"}\n\nDisplay Reason: \`\`\`${banCheck.data.gameJoinRestriction.displayReason.slice(0, 400)}\`\`\`\n\nPrivate Reason: \`\`\`${banCheck.data.gameJoinRestriction.privateReason.slice(0, 350)}\`\`\`\n\nExcludes Alt Accounts: \`${banCheck.data.gameJoinRestriction.excludeAltAccounts}\`\nInherited: \`${banCheck.data.gameJoinRestriction.inherited}\`` });
                    } catch (error) {
                        infoEmbed.addFields({ name: `⚠️ \`${place.name}\``, value: `Error while checking ban: \`${error}\`` });
                    }
                }

                return interaction.editReply({ embeds: [infoEmbed] });

                break;
            }

            case "getlogs": {
                const placeName = interaction.options.getString("place", true);
                const serverId = interaction.options.getString("server-id", true);

                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: "Place not found"
                    })
                ]})

                interaction.deferReply();

                try {
                    const robloxRequest =  await guildDataProfile.robloxRequest(placeName, serverId, "getastralogs");

                    const logs = robloxRequest.req.body.Return;
                    if (!logs) return interaction.editReply({ content: "No logs found" });

                    const convertTimestamp = (timestamp: number): string => {
                        const date = new Date(timestamp);
                        const hours = date.getHours().toString().padStart(2, "0");
                        const minutes = date.getMinutes().toString().padStart(2, "0");
                        const seconds = date.getSeconds().toString().padStart(2, "0");
                        return `${hours}:${minutes}:${seconds}`;
                    };

                    const chatLogs = logs.ChatLogs.map((log: { Time: number; Text: any; }) => `[${convertTimestamp(log.Time)}] ${log.Text}`).join("\n");;
                    const commandLogs = logs.CommandLogs.map((log: { Time: number; Text: any; Desc: any }) => `[${convertTimestamp(log.Time)}] ${log.Text} ${log.Desc}`).join("\n");
                    const exploitLogs = logs.ExploitLogs.map((log: { Time: number; Text: any; }) => `[${convertTimestamp(log.Time)}] ${log.Text}`).join("\n");
                    const joinLogs = logs.JoinLogs.map((log: { Time: number; Text: any; Desc: any }) => `[${convertTimestamp(log.Time)}] ${log.Text}: ${log.Desc}`).join("\n");
                    const leaveLogs = logs.LeaveLogs.map((log: { Time: number; Text: any; Desc: any }) => `[${convertTimestamp(log.Time)}] ${log.Text}: ${log.Desc}`).join("\n");
            
                    await interaction.editReply({ content: "Successfully exported gamelogs", files: [
                            { attachment: Buffer.from(chatLogs || "No logs found"), name: `chatlogs_${serverId}.txt` },
                            { attachment: Buffer.from(commandLogs || "No logs found"), name: `commandlogs_${serverId}.txt` },
                            { attachment: Buffer.from(exploitLogs || "No logs found"), name: `exploitlogs_${serverId}.txt` },
                            { attachment: Buffer.from(joinLogs || "No logs found"), name: `joinlogs_${serverId}.txt` },
                            { attachment: Buffer.from(leaveLogs || "No logs found"), name: `leavelogs_${serverId}.txt` }
                        ]
                    });
                } catch (error) {
                    await interaction.editReply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred while trying to get the logs",
                            description: `An error occurred while trying to get the logs: ${error}`
                        })
                    ]})
                }

                break;
            }

            case "servers": {
                const placeName = interaction.options.getString("place", true);
                const sortingOrder = interaction.options.getString("sorting-order", true);
                const limit = interaction.options.getNumber("limit", false) || 10;

                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "An error occured",
                        description: "Place not found"
                    })
                ]})

                let servers;
                try {
                    servers = await client.axios.get(`https://games.roblox.com/v1/games/${place.id}/servers/Public?sortOrder=${sortingOrder}&limit=${limit}`)
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: "An error occured while trying to fetch the servers"
                        })
                    ] })
                }

                const serverlist = servers.data.data
                const serverEmbeds = [] as ButtonEmbed[];

                for (const server of serverlist) {
                    const baseEmbed = client.Functions.makeInfoEmbed({
                        title: `\`${server.id}\``,
                        fields: [
                            { name: "Players", value: `${server.playing}/${server.maxPlayers}`, inline: true },
                            { name: "Ping", value: `${server.ping}ms`, inline: true },
                            { name: "FPS", value: `${server.fps}`, inline: true },
                        ]
                    })

                    const buttonEmbed = new ButtonEmbed(baseEmbed)

                    buttonEmbed.addButton({
                        label: "Join",
                        style: ButtonStyle.Link,
                        link: `${client.config.branding.baseURL}/api/v1/roblox/experiences/start?placeId=${place.id}&gameInstanceId=${server.id}`
                    })

                    serverEmbeds.push(buttonEmbed)
                }

                if (serverlist.length === 0) return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "No servers found",
                        description: "No servers were found for this place"
                    })
                ]})

                const infoEmbed = new ButtonEmbed(client.Functions.makeInfoEmbed({
                    title: "Server List",
                    description: `Here is a list of servers for the place \`${placeName}\` (\`${place.id}\`)`
                }));

                infoEmbed.addButton({
                    label: "Join Random",
                    style: ButtonStyle.Link,
                    link: `${client.config.branding.baseURL}/api/v1/roblox/experiences/start?placeId=${place.id}`
                });

                await interaction.reply(infoEmbed.getMessageData());

                try {
                    for (const embed of serverEmbeds) {
                        await interaction.channel?.send(embed.getMessageData());
                    }
                } catch (error) {
                    await interaction.followUp({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occured",
                            description: "An error occured while trying to send the server list"
                        })
                    ] })
                }

                break;
            }
        }
    },

    // @ts-ignore
    autocomplete: async (interaction) => {
        if (!interaction.guild) return;

        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(true);
        const currentOption = interaction.options.getFocused(true);

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, true);

        switch (currentOption.name) {
            case "place": {
                const places = [] as Object[];

                for (const place of guildDataProfile.roblox.places.values()) {
                    places.push({ name: place.name, value: place.name });
                }
        
                return places;
            }

            case "server-id": {
                const placeName = interaction.options.getString("place", true);
                const place = guildDataProfile.roblox.places.get(placeName);
                if (!place) return [];

                const servers = [] as Object[];
                try {
                    const serverList = await client.axios.get(`https://games.roblox.com/v1/games/${place.id}/servers/Public?sortOrder=Des&limit=100`)

                    for (const server of serverList.data.data) {
                        servers.push({ name: `Server ${server.id} | ${server.playing}/${server.maxPlayers} Players | ${Math.round(server.fps)} FPS | ${Math.round(server.ping)} Ping`, value: server.id });
                    }
                } catch (error) {
                    servers.push({ name: "error", value: "error" });
                }

                return servers;
            }
        }

        return [];
    }
});

export default gamePlace;