import { SlashCommandBooleanOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";

const setMaintenance = new Command({
    name: "setmaintenance",
    description: "Set the bot's maintenance mode",
    dmpermission: true,
    devOnly: true,
    userApp: true,
    options: [
        new SlashCommandBooleanOption()
            .setName("enabled")
            .setDescription("Set the maintenance mode")
            .setRequired(true),
    ],

    execute: async (interaction) => {
        const enabled = interaction.options.getBoolean("enabled", true);

        client.SetMaintenance(enabled);

        return await interaction.reply({ embeds: [
            client.Functions.makeWarnEmbed({
                title: "Maintenance Mode",
                description: `Maintenance mode is now \`${enabled ? "enabled" : "disabled"}\``,
            })
        ]})
    }
});

export default setMaintenance;