import Route from "../../classes/Route.js";
import client from "../../index.js";

const getUserGuildDatabyRobloxId = new Route({
    path: "guild/data/users/:robloxId",
    description: "Get the guild data",
    method: "GET",
    public: false,
    permissions: ["ViewPoints"],

    async execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "No guild profile found", message: `No guild profile found linked to your API key` }).end();
        const robloxId = req.params.robloxId;
        if (!robloxId) return res.status(400).send({ error: "No robloxId provided", message: "No robloxId provided in the request" }).end();

        const userGuildentry = await guildProfile.getUser(robloxId);
        if (!userGuildentry) return res.status(404).send({ error: "No user guild data found", message: `No user guild data found for the robloxId ${robloxId}` }).end();

        let returnData = [] as Object[];

        returnData.push({
            guild: {
                name: guildProfile.guild.name,
                shortname: guildProfile.guild.shortName,
                alias: guildProfile.guild.shortName,
            },

            robloxId: userGuildentry.robloxId,
            discordId: userGuildentry.discordId,
            points: userGuildentry.points,
            pendingPoints: await guildProfile.calculateUserpendingPoints(robloxId),
            note: userGuildentry.note,
            ranklock: userGuildentry.ranklock,
        })

        const linkedGuildPromises = Array.from(guildProfile.linkedGuilds.values()).map(async (linkedGuild) => {
            try {
                const actualGuild = await client.Functions.GetGuild(linkedGuild.guildId);
                if (!actualGuild) return;
    
                const linkedGuildData = await client.Database.GetGuildProfile(actualGuild.id, true);
                if (!linkedGuildData) return;
    
                const userLinkedGuildentry = await linkedGuildData.getUser(robloxId);
                if (!userLinkedGuildentry) return;
    
                returnData.push({
                    guild: {
                        name: linkedGuildData.guild.name,
                        shortname: linkedGuildData.guild.shortName,
                        alias: linkedGuild.alias,
                    },

                    robloxId: userLinkedGuildentry.robloxId,
                    discordId: userLinkedGuildentry.discordId,
                    points: userLinkedGuildentry.points,
                    pendingPoints: await linkedGuildData.calculateUserpendingPoints(robloxId),
                    note: userLinkedGuildentry.note,
                    ranklock: userLinkedGuildentry.ranklock,
                });
            } catch (error) {
                res.status(500).send({ error: "Internal server error", message: `An internal server error occured while fetching linked guild data: ${error}` }).end();
                return;
            }
        });
    
        await Promise.all(linkedGuildPromises);
    
        res.status(200).send(returnData).end();
    }
})

export default getUserGuildDatabyRobloxId;