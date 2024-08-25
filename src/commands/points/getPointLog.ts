import { ButtonInteraction, ButtonStyle, SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { PointLog } from "../../schemas/guildProfile.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";

const getPointLog = new Command({
    name: "getlog",
    description: "Get a specific point log",
    dmpermission: false,
    permissions: [],
    customPermissions: ["PointsManager"],
    options: [
        new SlashCommandStringOption()
            .setName("id")
            .setDescription("The ID of the point log")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const pointlogId = interaction.options.getString("id", true);
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const pointLog = await guildDataProfile.getPointLog(pointlogId);
        if (!pointLog) {
            return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Couldn't find point log",
                        description: `Couldn't find a point log with the ID \`${pointlogId}\``
                    })
                ]
            });
        }

        const formatEmbed = async (pointLog: PointLog) => {
            const baseEmbed = client.Functions.makeInfoEmbed({
                title: `\`${pointLog.id}\``,
                description: `Created <t:${Math.round(pointLog.createdAt / 1000)}:R> `
            });

            baseEmbed.addFields({ name: "Notes", value: (pointLog.notes && pointLog.notes.length > 0) ? `\`${pointLog.notes}\`` : "(No notes)" });

            for (const user of pointLog.data) {
                const field = baseEmbed.data.fields?.find((field) => field.name == `> ${user.points} points`);
                if (field) {
                    field.value += `, ${user.name}`;
                    if (field.value.length > 1024) field.value = field.value.slice(0, 1021) + "...";
                    continue;
                }
        
                baseEmbed.addFields({ name: `> ${user.points} points`, value: `${user.name}` });
        
                if ((baseEmbed.data.fields?.length ?? 0) >= 23) {
                    baseEmbed.addFields({ name: "Couldn't show full log", value: "Due to discord limits I couldn't show the rest of this log!" });
                    break;
                }
            }

            return baseEmbed;
        }

        const buttonEmbed = new ButtonEmbed(await formatEmbed(pointLog));

        buttonEmbed.addButton({
            label: "View Full Data",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                const userText = pointLog.data.map(user => `${user.points} - ${user.name}`).join('\n');
                const userBuffer = Buffer.from(userText, 'utf-8');
                Buttoninteraction.reply({ content: "Full data:", files: [ { name: `fulldata_${pointLog.id}.txt`, attachment: userBuffer } ]});
            }
        })

        buttonEmbed.nextRow();

        buttonEmbed.addButton({
            label: "Approve",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (ButtonInteraction) => {
                try {
                    await guildDataProfile.approvePointLog(pointLog.id);

                await interaction.editReply({ embeds: [
                    client.Functions.makeSuccessEmbed({
                        title: `\`${pointLog.id}\``,
                        description: "Point log successfully approved"
                    })
                ], components: [] });
                } catch (error) {
                    await ButtonInteraction.editReply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: "An error occurred while trying to delete the point log"
                        })
                    ], components: [] });
                }
            }
        })

        buttonEmbed.addButton({
            label: "Delete",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (buttonInteraction) => {
                try {
                    await guildDataProfile.removePointLog(pointLog.id);

                    await interaction.editReply({ embeds: [
                        client.Functions.makeSuccessEmbed({
                            title: `\`${pointLog.id}\``,
                            description: "Point log successfully deleted"
                        })
                    ], components: [] });
                } catch (error) {
                    await buttonInteraction.editReply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "An error occurred",
                            description: "An error occurred while trying to delete the point log"
                        })
                    ], components: [] });
                }
            }
        });

        interaction.reply(buttonEmbed.getMessageData());
    }
})

export default getPointLog;