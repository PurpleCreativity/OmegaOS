import { ButtonStyle } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Route from "../../classes/Route.js";
import client from "../../index.js";

const guildAction = new Route({
    path: "guild/action/:actionName",
    description: "Get the guild data",
    method: "POST",
    public: false,
    permissions: ["Moderation"],

    async execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "No guild profile found", message: `No guild profile found linked to your API key` }).end();
        const action = req.params.actionName;
        if (!action) return res.status(400).send({ error: "No actionName provided", message: "No actionName in the request" }).end();

        const specificGuild = req.query.guild?.toString();
        let specificGuildFound = false;
        if (specificGuild) {
            try {
                let linkedGuildProfile = await client.Database.GetGuildProfileByShortName(specificGuild)
                if (!linkedGuildProfile) linkedGuildProfile = await client.Database.GetGuildProfile(specificGuild);
                if (!linkedGuildProfile) return res.status(404).send({ error: "Guild not found", message: "The guild provided was not found" }).end();
                for (const linkedguild of guildProfile.linkedGuilds.values()) {
                    if (linkedguild.guildId === linkedGuildProfile.guild.id) {
                        guildProfile = linkedGuildProfile;
                        specificGuildFound = true;
                        break;
                    }
                }

                if (!specificGuildFound) return res.status(403).send({ error: "Forbidden", message: "You are not allowed to access this guild" }).end();
            } catch (error) {
                return res.status(403).send({ error: "Forbidden", message: "You are not allowed to access this guild" }).end();
            }
        }

        switch (action) {
            case "call": {
                const callChannel = await guildProfile.getChannel("calls");
                if (!callChannel) return res.status(404).send({ error: "Channel not found", message: "The calls channel was not found" }).end();

                const data = req.body;
                if (
                    !data ||
                    !data.placeId ||
                    !data.senderId ||
                    !data.suspectId ||
                    !data.reason ||
                    !data.players ||
                    !data.admins ||
                    !data.gameInstanceId
                ) return res.status(400).send({ error: "Invalid data provided", message: "Invalid data formatting provided" }).end();

                let place;
                try {
                    place = await client.wrapblox.fetchGame(await client.Functions.ConvertPlaceIDToUniverseID(data.placeId));
                    if (!place) return res.status(404).send({ error: "Place not found", message: "The place provided was not found" }).end();
                } catch (error) {
                    if (!(error instanceof Error)) return;
                    return res.status(404).send({ error: "Not found", message: "The provided place was not found" }).end();
                }

                let sender;
                try {
                    sender = await client.wrapblox.fetchUser(data.senderId);
                    if (!sender) return res.status(404).send({ error: "Sender not found", message: "The senderId provided was not found" }).end();
                } catch (error) {
                    return res.status(404).send({ error: "Sender not found", message: "The senderId provided was not found" }).end();
                }

                let suspect;
                try {
                    suspect = await client.wrapblox.fetchUser(data.suspectId);
                    if (!suspect) return res.status(404).send({ error: "Target not found", message: "The targetId provided was not found" }).end();
                } catch (error) {
                    return res.status(404).send({ error: "Target not found", message: "The targetId provided was not found" }).end();
                }

                const baseEmbed = client.Functions.makeBaseEmbed({
                    title: place.name,
                    url: `https://www.roblox.com/games/${place.rawdata.rootPlaceId}`,
                    description: `[${sender.name}](https://www.roblox.com/users/${sender.id}/profile) has called for a moderation action on [${suspect.name}](https://www.roblox.com/users/${suspect.id}/profile)`,
                    thumbnail: await suspect.fetchUserHeadshotUrl(),
                    fields: [
                        { name: "Sender", value: `Username: \`${sender.name}\`\nDisplayname: \`${sender.displayName}\`\n UserId: \`${sender.id}\``, inline: true },
                        { name: "Suspect", value: `Username: \`${suspect.name}\`\nDisplayname: \`${suspect.displayName}\`\n UserId: \`${suspect.id}\``, inline: true },

                        { name: "‎", value: "‎", inline: false },

                        { name: "Reason", value: `\`${data.reason}\``, inline: true },
                        { name: "Notes", value: data.notes ? `\`${data.notes}\`` : "(No notes)", inline: true },

                        { name: "‎", value: "‎", inline: false },

                        { name: "Players", value: `${data.players}/${place.maxPlayers}`, inline: true },
                        { name: "Admins", value: data.admins, inline: true },
                    ]
                })

                const buttonEmbed = new ButtonEmbed(baseEmbed)

                buttonEmbed.addButton({
                    label: "Join Server",
                    style: ButtonStyle.Link,
                    link: `${client.config.branding.baseURL}/api/v1/roblox/experiences/start?placeId=${place.rawdata.rootPlaceId}&gameInstanceId=${data.gameInstanceId}`
                })

                await callChannel.send(buttonEmbed.getMessageData());

                return res.status(200).send("OK").end();
            }

            default: {
                return res.status(400).send({ error: "Invalid actionName", message: "The actionName provided is invalid" }).end();
            }
        }
    }
})

export default guildAction;