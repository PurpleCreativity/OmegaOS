import Route from "../../classes/Route.js";

const guildData = new Route({
    path: "guild/data",
    description: "Get the guild data",
    method: "GET",
    public: false,
    permissions: ["Administrator"],

    execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(400).send({ error: "No guild profile found", message: "" }).end();

        return res.status(200).send({ data: guildProfile }).end();
    }
})

export default guildData;