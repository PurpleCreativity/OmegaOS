import Route from "../../classes/Route.js";
import client from "../../index.js";

const guildSchedule = new Route({
    path: "guild/data/schedule",
    description: "Get the guild schedule",
    method: "GET",
    public: false,
    permissions: ["ViewSchedule"],

    async execute (req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "Internal server error", message: "The server encountered an error while processing your request." }).end
        let returnData = [] as any;

        const givenSpecificAmount = req.query.amount as string | null;
        const givenSpecificType = req.query.type as string | null;
        const givenSpecificHost = req.query.host as string | null;

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

        const scheduledEvents = await guildProfile.getScheduledEvents();
        if (scheduledEvents.length === 0) return res.status(200).send([]).end();

        for (const event of scheduledEvents) {
            if (givenSpecificAmount && returnData.length >= parseInt(givenSpecificAmount)) break;
            if (givenSpecificType && event.eventType !== givenSpecificType) continue;
            if (givenSpecificHost && event.host.name !== givenSpecificHost) continue;

            const eventType = await guildProfile.getEventType(event.eventType);
            if (!eventType) continue;

            returnData.push({
                event: event,
                type: eventType,
            });
        }

        res.status(200).send(returnData).end();
    }
})

export default guildSchedule;