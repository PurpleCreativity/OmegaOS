import { ButtonStyle, EmbedBuilder, SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import { PointLog } from "../../schemas/guildProfile.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { MaterialIcons } from "../../assets/materialIcons.js";

const getPointLogs = new Command({
    name: "getlogs",
    description: "Get the point logs",
    dmpermission: true,
    permissions: [],
    customPermissions: ["PointsManager"],
    options: [
        new SlashCommandStringOption()
            .setName("user")
            .setDescription("The user to get the logs for")
            .setRequired(false),
    ],
    devOnly: false,
    execute: async (interaction) => {
        if (!interaction.guild) return;
        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);

        let pointlogs = [] as PointLog[];

        const user = interaction.options.getString("user", false);
        if (user) {
            try {
                const userId = (await client.wrapblox.fetchUserByName(user.toLowerCase().trim())).id;
                if (!userId) {
                    return interaction.reply({ embeds: [
                        client.Functions.makeErrorEmbed({
                            title: "User not found",
                            description: "The user you are looking for does not exist"
                        })
                    ]});
                }

                pointlogs = await guildDataProfile.getUserPointLogs(userId.toString());
            } catch (error) {
                
            }
        } else {
            pointlogs = await guildDataProfile.getAllPointLogs();
       }

       if (pointlogs.length == 0) {
           return interaction.reply({ embeds: [
               client.Functions.makeErrorEmbed({
                   title: "No logs found",
                   description: "There are no logs to show"
               })
           ]});
       }

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

        const embeds = await Promise.all(pointlogs.map(async (pointlog) => {
            const buttonEmbed = await formattedEmbed(pointlog);

            buttonEmbed.addButton({
                label: "View Full Data",
                style: ButtonStyle.Primary,
                allowedUsers: [interaction.user.id],
    
                function: async (Buttoninteraction) => {
                    const userText = pointlog.data.map(user => `${user.points} - ${user.name}`).join('\n');
                    const userBuffer = Buffer.from(userText, 'utf-8');
                    Buttoninteraction.reply({ content: "Full data:", files: [ { name: `fulldata_${pointlog.id}.txt`, attachment: userBuffer } ]});
                }
            })
    
            buttonEmbed.nextRow();
    
            buttonEmbed.addButton({
                label: "Approve",
                style: ButtonStyle.Success,
                allowedUsers: [interaction.user.id],
    
                function: async (ButtonInteraction) => {
                    try {
                        const FormattedEmbed = formattedEmbed(pointlog);
                        const actualEmbed = new EmbedBuilder((await FormattedEmbed).Embed.data);
                        actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Approved** (<t:${Math.round(Date.now() / 1000)}:R>)`);
                        actualEmbed.setAuthor({ name: "Approved", iconURL: MaterialIcons.omegasuccess });
                        actualEmbed.setColor(0x00ff00)

                        await guildDataProfile.approvePointLog(pointlog.id);

                        await ButtonInteraction.update({ embeds: [actualEmbed], components: [] });
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
                        const FormattedEmbed = formattedEmbed(pointlog);
                        const actualEmbed = new EmbedBuilder((await FormattedEmbed).Embed.data);
                        actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Deleted** (<t:${Math.round(Date.now() / 1000)}:R>)`);
                        actualEmbed.setAuthor({ name: "Deleted", iconURL: MaterialIcons.omegaerror });
                        actualEmbed.setColor(0xff0000)

                        await guildDataProfile.removePointLog(pointlog.id);

                        await buttonInteraction.update({ embeds: [actualEmbed], components: [] });
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

            return buttonEmbed;
        }));

        if (user) {
            await interaction.reply({ embeds: [
                client.Functions.makeInfoEmbed({
                    title: `Point logs for ${user}`,
                    description: `Here are the point logs for the user ${user}`,
                })
            ]})
        } else {
            await interaction.reply({ embeds: [
                client.Functions.makeInfoEmbed({
                    title: `Point logs for the server`,
                    description: `Here are the point logs for the server`,
                })
            ]})
        }

        for (const embed of embeds) {
            await interaction.channel?.send(embed.getMessageData());
        }
    },
});

export default getPointLogs;