import client from "../../index.js"

const route = new client.API.Route({
	path: "roblox/experiences/start", // No need for a leading slash
	description: "Join a roblox game with given params",
	public: true,
    permissions: [],
	method: "GET",
	
	async execute(req, res) {
        const placeId = req.query.placeId || null
		const gameInstanceId = req.query.gameInstanceId || null

        if (!placeId) return res.status(400).send({ error: "placeId is required" })

        let redirectLink;
        if (gameInstanceId !== null) {
            redirectLink = `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${gameInstanceId}`
        } else {
            redirectLink = `roblox://experiences/start?placeId=${placeId}`
        }

        return res.status(200).redirect(redirectLink);
	}
})

export default route