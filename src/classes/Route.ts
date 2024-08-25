import { Guild, Snowflake } from "discord.js"
import client from "../index.js"
import OmegaClient from "./OmegaClient.js"

import express from "express"
import { guildProfileInterface } from "../schemas/guildProfile.js"

export type APIMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"
export type APIPermissions = "Administrator" | "ViewPoints" | "CreatePointLogs" | "ViewSchedule" | "Moderation" | "Roblox";

type RouteOptions = {
	path: string
	method : APIMethods
	public?: boolean,
    deprecated?: boolean,
	permissions?: APIPermissions[],
	description?: string,

	execute(req: express.Request, res: express.Response, guildProfile?: guildProfileInterface | null): void
}

class Route {
	path: string
	method : Lowercase<APIMethods>
	public: boolean
    deprecated: boolean
	permissions: APIPermissions[]
	description: string

	execute: (req: express.Request, res: express.Response, guildProfile?: guildProfileInterface | null) => void

	constructor(opts: RouteOptions) {
		this.path = opts.path
		this.method = opts.method.toLowerCase() as Lowercase<APIMethods>
		this.public = opts.public ?? false
		this.permissions = opts.permissions ?? [];
        this.deprecated = opts.deprecated ?? false
		this.description = opts.description ?? "None"
		
		this.execute = opts.execute
	}

    Execute() {
        return async (req: express.Request, res: express.Response) => {

            try {
                if (client.maintenanceMode) return res.status(503).send({ error: "Maintenance mode", message: "The API is currently in maintenance mode, please try again later." }).end();

                if (this.public) {
                    this.execute(req, res);
                    client.Logs.LogAPI(req, res);
                    return;
                }

                const key = req.headers["x-api-key"] ?? req.headers["authorization"] as string;
                if (!key) return res.status(403).send({ error: "No API key provided.", message: "This is a private route that you must provide your guild's API key to use. (`x-api-key`: `{KEY_HERE}`)" }).end();

                const guildProfileandKey = await client.API.GetGuildProfileFromKey(key.toString());
                if (!guildProfileandKey) return res.status(403).send({ error: "Invalid API key provided.", message: "API Key not found in the database (this may be due to the cache not yet being updated), please try again later." }).end();

                const guildProfile = guildProfileandKey?.guild;
                const keyData = guildProfileandKey?.keyData;

                if (guildProfile.API.banned) return res.status(403).send({ error: "API Banned.", message: "Your guild has been temporarily banned from using the API." }).end();
                if (!guildProfile.API.enabled) return res.status(403).send({ error: "API Disabled.", message: "Your guild has disabled the API." }).end();
                if (!keyData.enabled) return res.status(403).send({ error: "API Key Disabled.", message: "Your API key has been disabled." }).end();

                if (this.permissions.length === 0) {
                    this.execute(req, res, guildProfile);
                    client.Logs.LogAPI(req, res);
                    return;
                }
                // @ts-ignore
                if (keyData.permissions.includes("Administrator")) {
                    this.execute(req, res, guildProfile);
                    client.Logs.LogAPI(req, res);
                    return;
                }

                for (const permission of this.permissions) {
                    if (keyData.permissions.includes(permission)) continue;
                    // @ts-ignore
                    return res.status(403).send({ error: "Insufficient permissions.", message: `Your API key is missing the following permission: ${permission}` }).end();
                }

                this.execute(req, res, guildProfile);
                client.Logs.LogAPI(req, res);
            } catch (error) {
                client.Logs.LogError(error as Error);
                return res.status(500).send({ error: "An error occured while processing your request.", message: error }).end();
            }
        }
    }
}

export default Route;