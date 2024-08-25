import { GuildMember, SlashCommandBooleanOption, SlashCommandMentionableOption, SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";

const setNote = new Command({
    name: "setnote",
    description: "Set a note for a user",
    permissions: [],
    customPermissions: ["PointsManager"],
    options: [
        new SlashCommandStringOption()
            .setName("username")
            .setDescription("The user to set the note for")
            .setRequired(true),
        new SlashCommandStringOption()
            .setName("note")
            .setDescription("The note to set")
            .setRequired(true),
        new SlashCommandBooleanOption()
            .setName("visible")
            .setDescription("Whether the note should be visible to the user")
            .setRequired(false)
    ],
    dmpermission: false,
    
    execute: async (interaction) => {
        if (!interaction.guild) return;

        const username = interaction.options.getString("username", true).toLowerCase().trim();
        const note = interaction.options.getString("note", true);
        const visible = interaction.options.getBoolean("visible") ?? false;

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
        await guildDataProfile.setUserNote(robloxData.id.toString(), note, visible);

        interaction.reply({ embeds: [
                client.Functions.makeSuccessEmbed({
                    title: "Note Set",
                    description: `Note set for \`${robloxData.name}\`!`,
                    fields: [
                        {
                            name: "Note",
                            value: `\`${note}\``,
                            inline: false
                        },
                        {
                            name: "Visible",
                            value: visible ? "Yes" : "No",
                            inline: false
                        }
                    ]
                })
        ]})
    }
});

export default setNote;