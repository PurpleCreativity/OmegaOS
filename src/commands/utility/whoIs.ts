import { ButtonStyle, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import { title } from "process";
import { MaterialEmojis } from "../../assets/materialIcons.js";
import userProfile, { userProfileInterface } from "../../schemas/userProfile.js";

const whoIs = new Command({
    name: "whois",
    description: "Get information about a user",
    dmpermission: false,
    userApp: false,
    customPermissions: ["Moderator"],
    subcommands: [
        new SlashCommandSubcommandBuilder()
            .setName("discord")
            .setDescription("Get information about a discord user")
            .addUserOption(option => option.setName("user").setDescription("The user to get information about").setRequired(true)),
        /*
        new SlashCommandSubcommandBuilder()
            .setName("roblox")
            .setDescription("Get information about a roblox user")
            .addStringOption(option => option.setName("username").setDescription("The user to get information about").setRequired(true))
        */
    ],
    
    execute: async (interaction) => {
        if (!interaction.guild) return;

        const subCommand = interaction.options.getSubcommand(true);

        const convertToEpochTimestamp = (dateString: string): number => {
            let date = new Date(dateString) as unknown as number;
            date = Math.round(date / 1000);
            
            return date;
        };

        switch (subCommand) {
            case "discord": {
                const user = interaction.options.getUser("user", true);
                const userDataProfile = await client.Database.GetUserProfile(user.id);
                if (!userDataProfile) return;

                if (!userDataProfile.roblox.verified) return await interaction.reply({embeds: [client.Functions.makeErrorEmbed({title: "User not verified", description: "This user has not verified their roblox account"})]});

                const robloxUser = await client.wrapblox.fetchUser(Number.parseInt(userDataProfile.roblox.id));
                const userAvatarImage = await robloxUser.fetchUserAvatarThumbnailUrl();

                const accountAge = Math.ceil(Math.abs(new Date().getTime() - new Date(robloxUser.rawData.created).getTime()) / (1000 * 3600 * 24))

                const buttonEmbed = new ButtonEmbed(
                    client.Functions.makeInfoEmbed({
                        title: user.username,
                        description: robloxUser.description || "(No description)",
                        fields: [
                            {name: "Username", value: `${robloxUser.rawData.hasVerifiedBadge ? MaterialEmojis.robloxVerified : ""} [${robloxUser.name}](https://www.roblox.com/users/${robloxUser.id}/profile)`, inline: true},
                            {name: "Display Name", value: robloxUser.displayName || "(No display name)", inline: true},
                            {name: "Id", value: `\`${robloxUser.id}\``, inline: true},

                            {name: "Banned", value: `\`${robloxUser.rawData.isBanned}\``, inline: true},
                            {name: "Joined roblox on", value: `<t:${convertToEpochTimestamp(robloxUser.rawData.created)}>`, inline: true},
                            {name: "Account age", value: `${accountAge} days`, inline: true},
                        ],
                        thumbnail: userAvatarImage
                    })
                );

                buttonEmbed.addButton({
                    label: "Profile",
                    style: ButtonStyle.Link,
                    link: `https://www.roblox.com/users/${robloxUser.id}/profile`
                })

                await interaction.reply(buttonEmbed.getMessageData());

                break;
            }

            case "roblox": {
               
                break;
            }
        }
    }
});

export default whoIs;