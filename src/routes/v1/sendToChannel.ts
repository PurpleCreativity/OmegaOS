import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Route from "../../classes/Route.js";
import client from "../../index.js";

const sendToChannel = new Route({
    path: "guild/channels/:channelName/send",
    description: "Get the guild data",
    method: "POST",
    public: false,
    permissions: ["Moderation"],

    async execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "No guild profile found", message: `No guild profile found linked to your API key` }).end();
        const channelName = req.params.channelName;
        if (!channelName) return res.status(400).send({ error: "No channelName provided", message: "No channelName in the request" }).end();

        const channel = await guildProfile.getChannel(channelName);
        if (!channel) return res.status(404).send({ error: "No channel found", message: `No channel found for the channelName ${channelName}` }).end();

        const actualEmbeds = [] as EmbedBuilder[];

        if (req.body.embeds) {
            for (const embed of req.body.embeds) {
                const newEmbed = client.Functions.makeInfoEmbed({});

                if (embed.title) newEmbed.setTitle(embed.title);
                if (embed.description) newEmbed.setDescription(embed.description);
                if (embed.color) newEmbed.setColor(embed.color);
                if (embed.fields) {
                    for (const field of embed.fields) {
                        if (!field.name || !field.value) continue;

                        newEmbed.addFields({ name: field.name, value: field.value, inline: field.inline });
                    }
                }
                if (embed.footer) {
                    newEmbed.setFooter({ text: embed.footer.text, iconURL: embed.footer.iconURL });
                }
                if (embed.thumbnail) {
                    newEmbed.setThumbnail(embed.thumbnail);
                }
                if (embed.image) {
                    newEmbed.setImage(embed.image);
                }
                if (embed.url) {
                    newEmbed.setURL(embed.url);
                }
                if (embed.author) {
                    newEmbed.setAuthor({ name: embed.author.name, iconURL: embed.author.iconURL, url: embed.author.url });
                }

                actualEmbeds.push(newEmbed);
            }
        }

        const messageData = {
            content: req.body.content,
            embeds: actualEmbeds || [],
        }

        try {
            await channel.send(messageData);
        } catch (error) {
            res.status(500).send({ error: "An error occurred while trying to send the message", message: error }).end();
        }

        res.status(200).end();
    }
})

export default sendToChannel;