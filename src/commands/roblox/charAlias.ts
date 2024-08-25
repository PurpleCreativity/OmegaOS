import { SlashCommandStringOption } from "discord.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { title } from "process";

type avatarAsset = {
    id: number,
    name: string,
    assetType: {
        id: number,
        name: string
    },
    currentVersionId: string
}

const charAlias = new Command({
    name: "charalias",
    description: "Get a user's character alias",
    globalCooldown: 60000,
    options: [
        new SlashCommandStringOption()
            .setName("username")
            .setDescription("The user to get the character alias of")
            .setRequired(true)
    ],
    dmpermission: true,
    userApp: true,

    execute: async (interaction) => {
        const username = interaction.options.getString("username", true)

        let robloxUser;
        try {
            robloxUser = await client.wrapblox.fetchUserByName(username);
        } catch (error) {
            return interaction.reply({ content: "User not found", ephemeral: true });
        }

        try {
            const avatarData = await client.axios.get(`https://avatar.roblox.com/v2/avatar/users/${robloxUser.id}/avatar`);

            const assets = avatarData.data.assets;

            const hats = assets.filter((asset: avatarAsset) => (
                asset.assetType.name === "Hat" ||
                asset.assetType.name === "WaistAccessory" ||
                asset.assetType.name === "NeckAccessory" ||
                asset.assetType.name === "ShoulderAccessory" ||
                asset.assetType.name === "FrontAccessory" ||
                asset.assetType.name === "BackAccessory" ||
                asset.assetType.name === "FaceAccessory" || 
                asset.assetType.name === "HairAccessory"
            ));

            const shirt = assets.find((asset: avatarAsset) => asset.assetType.name === "Shirt");
            const pants = assets.find((asset: avatarAsset) => asset.assetType.name === "Pants");
            const tshirt = assets.find((asset: avatarAsset) => asset.assetType.name === "TShirt");

            let aliasString = "";
            let untilRatelimit = 5;

            for (const hat of hats) {
                untilRatelimit--;
                aliasString += `!hat ${hat.id} | `;
                
                if (untilRatelimit === 0) {
                    untilRatelimit = 3;
                    aliasString += "!wait 4 | ";
                }
            }

            if ((shirt || pants) && (hats.size !== 0 && !(aliasString.endsWith("!wait 4 | ")))) aliasString += "!wait 4 | ";
            if (shirt) aliasString += `!shirt ${shirt.id} | `;
            if (pants) aliasString += `!pants ${pants.id} | `;
            if (tshirt) aliasString += `!tshirt ${tshirt.id} | `;

            aliasString = aliasString.slice(0, -3);

            await interaction.reply({ embeds: [
                client.Functions.makeInfoEmbed({
                    title: `${robloxUser.name}'s Character Alias`,
                    description: `\`\`\`${aliasString}\`\`\``
                })
            ]})
        } catch (error) {
            await interaction.reply({ content: "An error occurred while fetching the user's character alias (may be due to roblox ratelimiting)", ephemeral: true });
        }
    }
});

export default charAlias;