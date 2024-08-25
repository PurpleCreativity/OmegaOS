import Route from "../../classes/Route.js";
import client from "../../index.js";
import { PointLog } from "../../schemas/guildProfile.js";

const makePointlog = new Route({
    path: "guild/data/pointlogs/add",
    description: "Get the guild data",
    method: "POST",
    public: false,
    permissions: ["CreatePointLogs"],

    async execute(req, res, guildProfile) {
        if (!guildProfile) return res.status(500).send({ error: "No guild profile found", message: `No guild profile found linked to your API key` }).end();

        const data = req.body;
        if (!data) return res.status(400).send({ error: "No data provided", message: "No data provided in the request" }).end();

        
        if (
            !data.data ||
            !data.creator
        ) return res.status(400).send({ error: "Invalid data provided", message: "No data array or creator string provided, are you sure you provided a Content-Type header?" }).end();

        const creator = await guildProfile.getUser(data.creator);
        if (!creator) return res.status(404).send({ error: "No creator found", message: `No creator found with the id ${data.creator}` }).end();

        let currentlog = {
            id: client.Functions.GenerateID(),

            data: data.data as { points: number, id: string, name: string }[],
            notes: data.notes && data.notes.length > 1022 ? data.notes.substring(0, 1022) : data.notes,
            creator: creator.robloxId.toString(),

            createdAt: Date.now(),
        } as PointLog;

        if (currentlog.data.length === 0) return res.status(400).send({ error: "No data provided", message: "No data provided in the request" }).end();

        for (const user of currentlog.data) {
            if (
                !user.id ||
                !user.points || isNaN(user.points) ||
                !user.name
            ) return res.status(400).send({ error: "Invalid data provided", message: "Invalid data provided in the request in the data array (Bad formatting)" }).end();
        }

        try {
            const pointlog = await guildProfile.createPointLog(currentlog);
            const addedPointlog = await guildProfile.getPointLog(currentlog.id);

            res.status(200).send(addedPointlog).end();
        } catch (error) {
            res.status(500).send({ error: "Internal Server Error", message: `An internal server error occured while trying to add the pointlog ${error}` }).end();
        }
    }
})

export default makePointlog;