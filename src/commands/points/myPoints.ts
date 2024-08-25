import Command from "../../classes/Command.js";
import client from "../../index.js";

const myPoints = new Command({
    name: "mypoints",
    description: "Check your points",
    userCooldown: 60000,
    dmpermission: false,
    
    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const robloxId = await client.Functions.ConvertDiscordIdtoRobloxId(interaction.user.id);
        if (!robloxId) {
            return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "You are not verified",
                        description: "You need to verify yourself to use this command"
                    })
                ]
            });
        }
        const userGuilData = await guildDataProfile.getUser(robloxId);
        if (!userGuilData) return;

        const userPendingPoints = await guildDataProfile.calculateUserpendingPoints(robloxId);

        const infoEmbed = client.Functions.makeInfoEmbed({ title: "Your points" });

        infoEmbed.addFields({
            name: guildDataProfile.guild.shortName,
            value: `\`${userGuilData.points}\` points ${userPendingPoints !== 0 ? `(\`${userPendingPoints}\` pending)` : ""} ${userGuilData.ranklock.rank !== 0 && !userGuilData.ranklock.shadow ? `\n\`Ranklocked\`` : ""}`,
            inline: true
        })

        for (const linkedGuild of guildDataProfile.linkedGuilds.keys()) {
            const linkedGuildData = await client.Database.GetGuildProfile(linkedGuild, false);
            if (!linkedGuildData) continue;

            const linkedGuildUser = await linkedGuildData.getUser(robloxId);
            if (!linkedGuildUser) continue;

            const pendingPoints = await linkedGuildData.calculateUserpendingPoints(robloxId);

            infoEmbed.addFields({
                name: linkedGuildData.guild.shortName,
                value: `\`${linkedGuildUser.points}\` points ${pendingPoints !== 0 ? `(\`${pendingPoints}\` pending)` : ""} ${linkedGuildUser.ranklock.rank !== 0 && !linkedGuildUser.ranklock.shadow ? `\n\`Ranklocked\`` : ""}`,
                inline: true
            })
        }

        interaction.reply({ embeds: [infoEmbed] });
    }
});

export default myPoints;