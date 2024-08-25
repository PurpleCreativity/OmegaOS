import client from "../../index.js";
import Command from "../../classes/Command.js";
import { ButtonStyle, GuildMember, SlashCommandMentionableOption, SlashCommandStringOption } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { Role } from "wrapblox";

const getPoints = new Command({
    name: "getpoints",
    description: "Get the points for a user",
    dmpermission: false,
    permissions: [],
    userCooldown: 15000,
    customPermissions: ["PointsViewer"],
    options: [
        new SlashCommandStringOption()
            .setName("username")
            .setDescription("The user to get the points for")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const username = interaction.options.getString("username", true).toLowerCase().trim();

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
        const userGuildData = await guildDataProfile.getUser(robloxData.id.toString());
        const pendingPoints = await guildDataProfile.calculateUserpendingPoints(robloxData.id.toString());

        let ranklockRank: Role | undefined;
        if (userGuildData.ranklock.rank !== 0) {
            try {
                ranklockRank = await (await client.wrapblox.fetchGroup(guildDataProfile.roblox.groupId)).fetchRoleByRank(userGuildData.ranklock.rank);
            } catch (error) {
                client.error(`Error fetching ranklock rank for ${robloxData.name}: ${(error as Error).message}`);
            }
        }

        const visualEmbed = new ButtonEmbed(client.Functions.makeInfoEmbed({title: `Points for \`${robloxData.name}\``}))

        visualEmbed.Embed.addFields({ name: guildDataProfile.guild.shortName, value: `\`${userGuildData.points}\` points ${pendingPoints !== 0 ? `(\`${pendingPoints}\` pending)` : ""}` });
        if (userGuildData.note.visible && userGuildData.note.text.length > 0) visualEmbed.Embed.addFields({ name: "Note", value: `\`${userGuildData.note.text}\`` });
        if (ranklockRank && !userGuildData.ranklock.shadow) visualEmbed.Embed.addFields({ name: "Ranklock", value: `Ranklocked to \`${ranklockRank.name || "(Failed to fetch)"}\` | [\`${ranklockRank.rank || "(Failed to fetch)"}\`]` });

        const button = visualEmbed.addButton({
            label: "Full Data",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                visualEmbed.disableButton(button);
                await interaction.editReply(visualEmbed.getMessageData());

                const fullEmbed = client.Functions.makeInfoEmbed({title: `Full data for \`${robloxData.name}\``});

                fullEmbed.addFields([
                    { name: "Points", value: `\`${userGuildData.points}\` points ${pendingPoints !== 0 ? `(\`${pendingPoints}\` pending)` : ""}` },
                    { name: "Notes", value: `Text: \`${userGuildData.note.text || "(No notes)"}\`\nUpdated: <t:${Math.floor(userGuildData.note.updatedAt / 1000)}:F>` },
                    { name: "Ranklock", value: ranklockRank ? `Rank: \`${ranklockRank.name || "(Failed to fetch)"}\` | [\`${ranklockRank.rank || "(Failed to fetch)"}\`]\nShadow: \`${userGuildData.ranklock.shadow}\`\nUpdated: <t:${Math.floor(userGuildData.ranklock.updatedAt / 1000)}:F>` : "(No ranklock)" }
                ])

                await buttonInteraction.reply( { embeds: [fullEmbed], ephemeral: true } )
            }
        })

        await interaction.reply(visualEmbed.getMessageData())
    }
})

export default getPoints;