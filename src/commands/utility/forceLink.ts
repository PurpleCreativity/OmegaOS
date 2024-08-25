import { SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";

const manualVerify = new Command({
    name: "forcelink",
    description: "Manually link a user",
    devOnly: true,
    userApp: true,
    dmpermission: false,
    options: [
        new SlashCommandUserOption()
            .setName("user")
            .setDescription("The user to manually verify")
            .setRequired(true)
        ,
        new SlashCommandStringOption()
            .setName("roblox-id")
            .setDescription("The roblox id of the user")
            .setRequired(true)
    ],

    execute: async (interaction) => {
        const user = interaction.options.getUser("user", true);
        const robloxId = interaction.options.getString("roblox-id", true);

        let robloxData;
        try {
            robloxData = await client.wrapblox.fetchUser(Number.parseInt(robloxId));
        } catch (error) {
            return interaction.reply({ content: "An error occured while trying to fetch the user data", ephemeral: true });
        }

        const userDataProfile = await client.Database.GetUserProfile(user.id, false);

        userDataProfile.roblox.name = robloxData.name;
        userDataProfile.roblox.id = robloxData.id.toString();
        userDataProfile.roblox.verified = true;
        // @ts-ignore
        userDataProfile.roblox.verifiedAt = Date.now()

        await userDataProfile.save();

        return interaction.reply({ content: `Successfully verified \`${robloxData.name}\``, ephemeral: true });
    }
})

export default manualVerify;