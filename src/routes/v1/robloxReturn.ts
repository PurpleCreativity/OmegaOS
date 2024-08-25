import Route from "../../classes/Route.js";
import client from "../../index.js";
import userProfile from "../../schemas/userProfile.js";

const getUserGuildDatabyRobloxId = new Route({
    path: "roblox/return",
    description: "Get the guild data",
    method: "POST",
    public: false,
    permissions: ["Roblox"],

    async execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "No guild profile found", message: `No guild profile found linked to your API key` }).end();

        client.emit("robloxReturn", req, res, guildProfile);

        res.status(200).end();
    }
})

export default getUserGuildDatabyRobloxId;