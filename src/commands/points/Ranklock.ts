import { SlashCommandSubcommandBuilder } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";

const ranklock = new Command({
    name: "ranklock",
    description: "Locks the rank of a user",
    dmpermission: false,
    customPermissions: ["PointsManager"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("set")
            .setDescription("Locks the rank of a user")
            .addStringOption(option => option.setName("username").setDescription("The user to lock the rank of").setRequired(true))
            .addNumberOption(option => option.setName("rank").setDescription("The rank to lock").setAutocomplete(true).setMinValue(1).setMaxValue(255).setRequired(true))
            .addStringOption(option => option.setName("reason").setDescription("The reason for locking the rank").setRequired(true))
            .addBooleanOption(option => option.setName("shadow").setDescription("Whether the rank lock is shadow (non visible to the user)").setRequired(true))

        ,

        new SlashCommandSubcommandBuilder()
            .setName("remove")
            .setDescription("Unlocks the rank of a user")
            .addStringOption(option => option.setName("username").setDescription("The user to unlock the rank of").setRequired(true))


    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id);
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case "set": {
                const username = interaction.options.getString("username", true);
                const rank = interaction.options.getNumber("rank", true);
                const reason = interaction.options.getString("reason", true);
                const shadow = interaction.options.getBoolean("shadow", true);

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "User not found",
                            description: `The user \`${username}\` does not exist.`
                        })
                    ]})
                }

                await guildDataProfile.setUserRanklock(robloxUser.id.toString(), rank, shadow, reason);

                return await interaction.reply({ embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "Ranklocked",
                        description: `The rank of user \`${robloxUser.name}\` has been locked to \`${rank}\` with reason \`${reason}\`.`
                    })
                ], ephemeral: shadow });

                break;
            }

            case "remove": {
                const username = interaction.options.getString("username", true);

                let robloxUser;
                try {
                    robloxUser = await client.wrapblox.fetchUserByName(username);
                } catch (error) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "User not found",
                            description: `The user \`${username}\` does not exist.`
                        })
                    ]})
                }

                await guildDataProfile.setUserRanklock(robloxUser.id.toString(), 0, false, "Ranklock removed");

                return await interaction.reply({ embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: "Unranklocked",
                        description: `The rank of user \`${robloxUser.name}\` has been unlocked.`
                    })
                ] });

                break;
            }
        }
    }
});

export default ranklock;