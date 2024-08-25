import express from "express"
import type OmegaClient from "../classes/OmegaClient.js"
import fs from "node:fs"
import path from "node:path"
import Route, { APIPermissions } from "../classes/Route.js"
import { APIKey, guildProfileInterface } from "../schemas/guildProfile.js"
import rateLimit from "express-rate-limit"
import swaggerExpress from "swagger-ui-express"
import APIDocs from "../routes/swagger.json" assert { type: "json" }


export type APIMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"


export type RouteOptions = {
	path: string
	method : APIMethods
	public?: boolean,
	permissions?: APIPermissions[],
	description?: string,

	execute(req: express.Request, res: express.Response): void
}


class API {
	client: OmegaClient
	constructor(client: OmegaClient) {
		this.client = client
	}

	Limiter = rateLimit({
		windowMs: 1 * 60 * 1000, // 1 minute
		limit: 120, // Limit each IP to 120 requests per `windowMs`
		standardHeaders: 'draft-6', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
		legacyHeaders: true, // Enable the `X-RateLimit-*` headers.

		handler: (req, res) => {
			res.status(429).sendFile(path.join(process.cwd(), "src/website/429.html"));
		},
	})

	Server = express();
	Route = Route;
	Routes: Route[] = [];
	Router: express.Router = express.Router({ caseSensitive: false });

	RouteFolders: string[] = fs.readdirSync(path.join(process.cwd(), "build/routes"));

	GenerateKey() {
		const key = this.client.Functions.GenerateID().replace(/-/g, "") + this.client.Functions.GenerateID().replace(/-/g, "") + this.client.Functions.GenerateID().replace(/-/g, "") + this.client.Functions.GenerateID().replace(/-/g, "") + this.client.Functions.GenerateID().replace(/-/g, "");

		return key
	}

	async GetGuildProfileFromKey(key: string) {
		for (const guildProfile of (await this.client.Database.GetAllGuilds()).values()) {
			for (const [keyName, keyData] of guildProfile.API.keys) {
				const decryptedKey = this.client.Functions.Decrypt(keyData.key, guildProfile.iv);
				if (decryptedKey === key) {
					return { guild: guildProfile, keyData: keyData } as { guild: guildProfileInterface, keyData: APIKey };
				}
			}
		}

		return null;
	}

	async LoadRoutes() {
		this.client.verbose("Loading routes...")

		for (const folder of this.RouteFolders) {
			if (!fs.statSync(path.join(process.cwd(), "build/routes", folder)).isDirectory()) {
				continue;
			}
			const files = fs.readdirSync(path.join(process.cwd(), "build/routes", folder)).filter(file => file.endsWith(".js"))
			for (const file of files) {
				const route = await import(`file://${path.join(process.cwd(), "build/routes", folder, file)}`).then(res => res.default)
				if (!(route instanceof Route)) {
					this.client.error(`Route ${route} is not an instance of Route`)
					continue
					
				}
				this.Routes.push(route);
				this.Router[route.method](`/${folder}/${route.path}`, route.Execute())
			}
		}
		
		this.Router.use("/docs", swaggerExpress.serve, swaggerExpress.setup(APIDocs));
	}
	
	async Init() {
		await this.LoadRoutes()
		
		this.Server.use(express.json())
		this.Server.use(this.Limiter)
		this.Server.use("/api/", this.Router)
		this.Server.use((req, res) => {
			res.status(404).sendFile(path.join(process.cwd(), "src/website/404.html"));
		});
		
		this.Server.listen(this.client.config.port)
		this.client.success(`API initialized and is now running on port ${this.client.config.port}`)
	}
}

export default API;