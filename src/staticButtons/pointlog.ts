import { ButtonInteraction, Embed, EmbedBuilder } from "discord.js";
import client from "../index.js";
import { PointLog } from "../schemas/guildProfile.js";
import ButtonEmbed from "../classes/ButtonEmbed.js";
import { MaterialIcons } from "../assets/materialIcons.js";

const pointlog = {
    customId: "pointlog",
    execute: async (interaction: ButtonInteraction) => {
        if (!interaction.guild) return interaction.editReply("This command can only be used in a server.");

        const guildprofiledata = await client.Database.GetGuildProfile(interaction.guild.id);

        const args = interaction.customId.split("_");
        args.shift();
        args.shift();

        const method = args[0].toLowerCase();
        const pointlogId = args[1];
        const pointLog = await guildprofiledata.getPointLog(pointlogId);

        if (
            !method ||
            !(method === "viewdata" || method === "approve" || (method === "deny" || method === "delete")) ||
            !pointlogId || 
            !guildprofiledata ||
            !pointLog
        ) return interaction.editReply("Invalid data provided in the button, please contact the developer.")

        const formattedEmbed = async (pointLog: PointLog): Promise<ButtonEmbed> => {
            const creatorUsername = (await client.wrapblox.fetchUser(Number.parseInt(pointLog.creator))).name;

            const baseEmbed = client.Functions.makeInfoEmbed({
                title: `\`${pointLog.id}\``,
                description: `Created <t:${Math.round(pointLog.createdAt / 1000)}:R> by ${creatorUsername}`
            })

            baseEmbed.addFields({ name: "Notes", value: (pointLog.notes && pointLog.notes.length > 0) ? `\`${pointLog.notes}\`` : "(No notes)" });

            for (const user of pointLog.data) {
                const field = baseEmbed.data.fields?.find((field) => field.name == `${user.points} points`);
                if (field) {
                    field.value += `, ${user.name}`;
                    if (field.value.length > 1024) field.value = field.value.slice(0, 1021) + "...";
                    continue;
                }
        
                baseEmbed.addFields({ name: `${user.points} points`, value: `${user.name}` });
        
                if ((baseEmbed.data.fields?.length ?? 0) >= 23) {
                    baseEmbed.addFields({ name: "Couldn't show full log", value: "Due to discord limits I couldn't show the rest of this log!" });
                    break;
                }
            }

            const buttonEmbed = new ButtonEmbed(baseEmbed);

            return buttonEmbed;
        }

        if (method === "viewdata") {
            const hasPerms = await client.Functions.checkGuildUserPermissions(interaction.guild.id, interaction.user.id, ["PointsManager"]) as boolean;
            if (!hasPerms) return await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                client.Functions.makeErrorEmbed({ title: "Missing Permissions", description: "You do not have the required permissions to view the data of this point log" })
            ]})

            const userText = pointLog.data.map(user => `${user.points} - ${user.name}`).join('\n');
            const userBuffer = Buffer.from(userText, 'utf-8');

            interaction.editReply({ content: "Full data:", files: [ { name: `fulldata_${pointLog.id}.txt`, attachment: userBuffer } ]});
        }

        if (method === "approve") {
            const hasPerms = await client.Functions.checkGuildUserPermissions(interaction.guild.id, interaction.user.id, ["PointsManager"]) as boolean;
            if (!hasPerms) return await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                client.Functions.makeErrorEmbed({ title: "Missing Permissions", description: "You do not have the required permissions to approve point logs." })
            ]})

            try {
                await guildprofiledata.approvePointLog(pointlogId);

                const editedEmbed = await formattedEmbed(pointLog);
                const actualEmbed = new EmbedBuilder(editedEmbed.Embed.data);
                actualEmbed.setAuthor({ name: "Approved", iconURL: MaterialIcons.omegasuccess });
                actualEmbed.setColor(0x00ff00)

                actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Approved by <@${interaction.user.id}>** (<t:${Math.round(Date.now() / 1000)}:R>)`);

                interaction.message.edit({ embeds: [actualEmbed], components: [] });
                await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                    client.Functions.makeSuccessEmbed({ title: `\`${pointLog.id}\``, description: "Point log successfully approved" })
                ] })

                await client.Functions.Sleep(10000);

                await interaction.deleteReply();
            } catch (error) {
                return await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                    client.Functions.makeErrorEmbed({ title: "An error occurred", description: "An error occurred while trying to approve the point log" })
                ]})
            }
        }

        if (method === "deny" || method === "delete") {
            const hasPerms = await client.Functions.checkGuildUserPermissions(interaction.guild.id, interaction.user.id, ["PointsManager"]) as boolean;
            if (!hasPerms) return await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                client.Functions.makeErrorEmbed({ title: "Missing Permissions", description: "You do not have the required permissions to deny point logs." })
            ]})

            try {
                await guildprofiledata.removePointLog(pointlogId);

                const editedEmbed = await formattedEmbed(pointLog);
                const actualEmbed = new EmbedBuilder(editedEmbed.Embed.data);
                actualEmbed.setAuthor({ name: "Denied", iconURL: MaterialIcons.omegaerror });
                actualEmbed.setColor(0xff0000)

                actualEmbed.setDescription(actualEmbed.data.description + `\n\n**Denied by <@${interaction.user.id}>** (<t:${Math.round(Date.now() / 1000)}:R>)`);

                interaction.message.edit({ embeds: [actualEmbed], components: [] });
                await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                    client.Functions.makeSuccessEmbed({ title: `\`${pointLog.id}\``, description: "Point log successfully denied" })
                ]})

                await client.Functions.Sleep(10000);

                await interaction.deleteReply();
            } catch (error) {
                return await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [
                    client.Functions.makeErrorEmbed({ title: "An error occurred", description: "An error occurred while trying to deny the point log" })
                ]})
            }
        }
    },
}

export default pointlog;