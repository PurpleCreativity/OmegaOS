import { GuildMember, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";

const setPoints = new Command({
    name: "setpoints",
    description: "Set points for a user",
    permissions: [],
    customPermissions: ["PointsManager"],
    options: [
        new SlashCommandStringOption()
            .setName("username")
            .setDescription("The user to set the points for")
            .setRequired(true),
        new SlashCommandNumberOption()
            .setName("new-points")
            .setDescription("The amount of points to set")
            .setRequired(true)
    ],
    dmpermission: false,
    
    execute: async (interaction) => {
        if (!interaction.guild) return;

        const username = interaction.options.getString("username", true).toLowerCase().trim();
        const newPoints = interaction.options.getNumber("new-points", true);

        let robloxData;
        try {
            robloxData = await client.wrapblox.fetchUserByName(username);
        } catch (error) {
            return interaction.reply({ embeds: [
                client.Functions.makeErrorEmbed({
                    title: "An error occurred",
                    description: (error as Error).message || "An error occurred while fetching the user"
                })
            ]
        });
        }
        if (!robloxData) {
            return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "User not found",
                        description: `I couldn't find a user with the name \`${username}\``
                    })
                ]
            });
        }

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const oldPoints = (await guildDataProfile.getUser(robloxData.id.toString())).points;
        await guildDataProfile.setUserPoints(robloxData.id.toString(), newPoints);

        interaction.reply({ embeds: [
                client.Functions.makeSuccessEmbed({
                    title: "Points Set",
                    description: `Points set for \`${robloxData.name}\`!`,
                    fields: [
                        {
                            name: "Old Points",
                            value: `\`${oldPoints}\``,
                            inline: true
                        },
                        {
                            name: "New Points",
                            value: `\`${newPoints}\``,
                            inline: true
                        }
                    ]
                })
            ]
        });
    }
});

export default setPoints;