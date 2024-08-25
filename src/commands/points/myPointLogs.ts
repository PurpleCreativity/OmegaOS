import { ButtonStyle, EmbedBuilder } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { PointLog } from "../../schemas/guildProfile.js";
import { MaterialIcons } from "../../assets/materialIcons.js";

const myPointLogs = new Command({
    name: "mylogs",
    description: "View your pending logs",
    dmpermission: false,
    permissions: [],
    customPermissions: ["CreatePointLogs"],
    userCooldown: 60000,

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
        const userLogs = await guildDataProfile.getUserPointLogs(robloxId);

        const formattedEmbed = async (pointLog: PointLog): Promise<ButtonEmbed> => {
            const creatorUsername = (await client.wrapblox.fetchUser(Number.parseInt(pointLog.creator))).name;

            const baseEmbed = client.Functions.makeInfoEmbed({
                title: `\`${pointLog.id}\``,
                description: `Created <t:${Math.round(pointLog.createdAt / 1000)}:R> by ${creatorUsername}`
            })

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

            const buttonEmbed = new ButtonEmbed(baseEmbed);

            return buttonEmbed;
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

            const buttonEmbed = new ButtonEmbed(baseEmbed);

            buttonEmbed.addButton({
                label: "View Full Data",
                style: ButtonStyle.Primary,
                allowedUsers: [interaction.user.id],
        
                function: async (Buttoninteraction) => {
                    const userText = pointLog.data.map(user => `${user.points} - ${user.name}`).join('\n');
                    const userBuffer = Buffer.from(userText, 'utf-8');
                    Buttoninteraction.reply({ content: "Full data:", files: [ { name: `fulldata_${pointLog.id}.txt`, attachment: userBuffer } ]});
                }
            });

            buttonEmbed.nextRow();

            const approveButton = buttonEmbed.addButton({
                label: "Approve",
                style: ButtonStyle.Success,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    if (!interaction.guild) return

                    const hasPerms = await client.Functions.checkGuildUserPermissions(interaction.guild.id, interaction.user.id, ["PointsManager"]) as boolean;
                    if (!hasPerms) return buttonInteraction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({ title: "Missing Permissions", description: "You do not have the required permissions to approve point logs." })
                    ] })

                    try {
                        const FormattedEmbed = formattedEmbed(pointLog);
                        const actualEmbed = new EmbedBuilder((await FormattedEmbed).Embed.data);
                        actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Approved** (<t:${Math.round(Date.now() / 1000)}:R>)`);
                        actualEmbed.setAuthor({ name: "Approved", iconURL: MaterialIcons.omegasuccess });
                        actualEmbed.setColor(0x00ff00)

                        await guildDataProfile.approvePointLog(pointLog.id);

                        await buttonInteraction.update({ embeds: [actualEmbed], components: [] });
                    } catch (error) {
                        await buttonInteraction.update({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "An error occurred while trying to approve the point log"
                            })
                        ], components: [] })
                    }
                }
            })

            buttonEmbed.addButton({
                label: "Delete",
                style: ButtonStyle.Danger,
                allowedUsers: [interaction.user.id],

                function: async (buttonInteraction) => {
                    try {
                        const FormattedEmbed = formattedEmbed(pointLog);
                        const actualEmbed = new EmbedBuilder((await FormattedEmbed).Embed.data);
                        actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Deleted** (<t:${Math.round(Date.now() / 1000)}:R>)`);
                        actualEmbed.setAuthor({ name: "Deleted", iconURL: MaterialIcons.omegaerror });
                        actualEmbed.setColor(0xff0000)

                        await guildDataProfile.removePointLog(pointLog.id);

                        await buttonInteraction.update({ embeds: [actualEmbed], components: [] });
                    } catch (error) {
                        await buttonInteraction.update({ embeds: [
                            client.Functions.makeErrorEmbed({
                                title: "An error occurred",
                                description: "An error occurred while trying to delete the point log"
                            })
                        ], components: [] })
                    }
                }
            })

            const hasPerms = await client.Functions.checkGuildUserPermissions(interaction.guild?.id as string, interaction.user.id, ["PointsManager"]) as boolean;
            if (!hasPerms) buttonEmbed.disableButton(approveButton);

            return buttonEmbed;
        }

        const embeds = await Promise.all(userLogs.map(formatEmbed));

        await interaction.reply({
            embeds: [
                client.Functions.makeInfoEmbed({
                    title: "Your Point Logs",
                    description: `You have \`${userLogs.length}\` pending logs`
                })
            ]
        })

        for (const embed of embeds) {
            await interaction.channel?.send(embed.getMessageData());
        }
    }
});

export default myPointLogs;