import Command from "../../classes/Command.js";
import client from "../../index.js";

const credits = new Command({
    name: "credits",
    description: "Show credits for the bot.",
    dmpermission: true,
    userApp: true,

    execute: async (interaction) => {
        
        await interaction.reply({ embeds: [
                client.Functions.makeInfoEmbed({
                title: "Credits",
                description: "Here are all the people who have contributed to the bot",
                fields: [
                        {
                            name: "Developers",
                            value: "- @purple_creativity - Bot owner and maintainer",
                            inline: false
                        },
                        {
                            name: "Contributors",
                            value: "- @nv_d - Made the bot's logo, and icons\n- @cater - Developer of athena, some of the bot's code is based on it",
                            inline: false
                        }
                    ]
                })
            ]
        });
    }
});

export default credits;