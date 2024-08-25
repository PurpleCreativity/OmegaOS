import Route from "../../classes/Route.js";
import client from "../../index.js";

const guildData = new Route({
    path: "info",
    description: "Info.....",
    method: "GET",
    public: true,
    permissions: [],

    execute(req, res, guildProfile) {
        if (!client.user) return res.status(500).json({ error: "Client not ready" });
        
        const data = {
            devMode: client.devMode,

		bot: {
			discord: {
				id: client.user.id,
				name: client.user.username,
				avatar: client.user.avatarURL(),
				cache: {
					guilds: client.guilds.cache.size,
					users: client.users.cache.size
				},
			},

            version: client.config.version,
		},

		webserver: {
			version: process.env.HEROKU_RELEASE_VERSION || "v0",
		},
        }
        return res.status(200).send(data).end();
    }
})

export default guildData;