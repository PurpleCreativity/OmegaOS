import { SlashCommandNumberOption, EmbedBuilder, ButtonStyle, ButtonInteraction, GuildMember, StringSelectMenuOptionBuilder, SelectMenuInteraction } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import StringSelector from "../../classes/StringSelector.js";
import { AxiosError } from "axios";

const linkRoblox = new Command({
    name: "linkroblox",
    description: "Link your Roblox account to your Discord account.",
    dmpermission: true,
    userApp: true,

    execute: async (interaction) => {
        const userDataProfile = await client.Database.GetUserProfile(interaction.user.id, false);

        let avaibleOptions = [
            //new StringSelectMenuOptionBuilder().setLabel("Game Join").setDescription("Link your Roblox account by joining a game").setValue("gamejoin"),
        ];

        if (interaction.guild) {
            avaibleOptions.push(new StringSelectMenuOptionBuilder().setLabel("RoVer").setDescription("Link your Roblox account with RoVer.").setValue("rover"));
            //avaibleOptions.push(new StringSelectMenuOptionBuilder().setLabel("BloxLink").setDescription("Link your Roblox account with Bloxlink.").setValue("bloxlink"));
        }

        if (!avaibleOptions.length || avaibleOptions.length === 0) return interaction.reply({content: "There are no verification methods available at the moment.", ephemeral: true });

        const Selector = new StringSelector({
            Placeholder: "Select a verification method",
            allowedUsers: [interaction.user.id],
            Options: avaibleOptions,
        })

        const response = await Selector.Prompt(interaction, {}) as SelectMenuInteraction;
        //response.message.delete();
        //response.deferReply();
        const method = response.values[0];

        interaction.editReply({content: "Processing...", components: []});

        switch (method) {
            case "gamejoin": {
                await interaction.editReply({content: "Not yet implemented... :( ", components : []});

                break;
            }

            case "rover": {
                if (!interaction.guild) return;

                const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
                if (!guildDataProfile.roblox.roverKey) return interaction.editReply({content: "RoVer is not enabled in this server.", components: []});

                try {
                    const roVerrequest = await client.axios.get(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, { headers: { "Authorization": `Bearer ${guildDataProfile.roblox.roverKey}` } });

                    if (roVerrequest.status !== 200) return interaction.editReply({content: `An error occured while trying to link your Roblox account with RoVer:\n${roVerrequest.status}: ${roVerrequest.statusText}`, components: []});

                    const robloxUser = await client.wrapblox.fetchUser(roVerrequest.data.robloxId)

                    userDataProfile.roblox.name = robloxUser.name
					userDataProfile.roblox.id = roVerrequest.data.robloxId
					userDataProfile.roblox.verified = true
					// @ts-ignore
					userDataProfile.roblox.verifiedAt = Date.now()

                    await userDataProfile.save();

                    await interaction.editReply({ content: null, embeds: [
                        client.Functions.makeSuccessEmbed({
                            title: "Linked Roblox Account",
                            description: `Your Roblox account has been successfully linked with OmegaOS.`,
                            thumbnail: await robloxUser.fetchUserHeadshotUrl(),
                            fields: [
                                { name: "Username", value: `\`${robloxUser.name}\``, inline: true },
                                { name: "UserId", value: `\`${roVerrequest.data.robloxId}\``, inline: true },
                            ]
                        })
                    ]});

                    break;
                } catch (error) {
                    if (error instanceof AxiosError) {
                        interaction.editReply({ content: null, embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occured while trying to link your Roblox account with RoVer.",
                                description: `${error.response?.status}: ${error.response?.statusText}`,
                                footer: { text: "Please try again later, and contact a server admin if this persists." }
                            })
                        ]})
                    }
                }

                break;
            }

            case "bloxlink": {
                await interaction.editReply({content: "Not yet implemented... :( ", components : []});

                break;
            }
        }
    }
});

export default linkRoblox;