import { ActivityType, Client } from "discord.js";
import { ClientOptions, REST, TextChannel } from "discord.js";

import dotenv from "dotenv";
dotenv.config();
import config from "../config.js";
import type { configType } from "../types/conifgTypes.js";

import axios, { type Axios } from "axios";
import mongoose, { type Mongoose } from "mongoose";
import WrapBlox from "wrapblox";

import Functions from "../core/Functions.js";
import Database from "../core/Database.js";
import Interactables from "../core/Interactables.js";
import API from "../core/API.js";
import Events from "../core/Events.js"
import Process from "../core/Process.js"
import Logs from "../core/Logs.js";

class OmegaClient extends Client {
    //* Variables
	startTimestamp : number = Date.now();
    config : configType = config;
	BotChannels : { [key: string]: TextChannel } = {};
	MemoryUsage : Array<number> = [];
	Arguments: string[] = process.argv.slice(2);
	devMode : boolean = this.Arguments.includes("--dev")
	maintenanceMode : boolean = this.Arguments.includes("--maintenance")
	Started : boolean = false

	//* Dependencies
	axios : Axios = axios;
	mongoose : Mongoose = mongoose;
	wrapblox : WrapBlox = new WrapBlox();

	//* Core Modules
	Functions: Functions
	Logs: Logs
	Process: Process
	Database: Database
	Interactables: Interactables
	Events: Events
	API : API

    //* Log Functions
	Log = async (type : "error" | "success" | "info" | "verbose" | "warn" | "deprecated", message : unknown, useDate?: boolean): Promise<undefined> => {
		try {
			const stack = new Error().stack as string
			const stackArray = stack.split("\n");
			let stackline = stackArray[2]; // "		at FUNCTION (file:///FULLPATH:LINE:COL)"
			// remove the "		at " at the start
			stackline = stackline.replace("    at ", "");

			const stacklineArray = stackline.split(" ");
			let FunctionName: string | undefined = stacklineArray[0];
			// console.log(stacklineArray)
			let Path = stacklineArray[1] || stacklineArray[0]; // (file:///FULLPATH:LINE:COL)
			if (!Path) {
				Path = stacklineArray[0];
				FunctionName = undefined;
			}

			// Remove everything but the last part
			const PathArray = Path.split("/");
			Path = PathArray[PathArray.length - 1];
			// Remove the last ")"
			Path = Path.replace(")", "");

			let infoline: string;
			if (this.config.debugMode && FunctionName) {
				infoline = `${FunctionName} at ${Path}`;
			} else {
				infoline = Path;
			}


			if (typeof message === "object") {
				message = JSON.stringify(message, null, 2);
			}
			let fullMessage = `[${type.toUpperCase()}] (${infoline}) ${message}`;
			if (useDate === true || useDate === undefined) {
				fullMessage += ` at ${new Date().toLocaleString()}`;
			}
			if (this.config.logConfig[type] === undefined) return this.Log("error", `Invalid log type ${type}`);
			console.log(this.config.logConfig[type].color(fullMessage))
		} catch (error: unknown) {
			console.error(error)
		}
	}

	log = async (message: unknown, useDate?: boolean) => {
		this.Log("info", message, useDate);
	};

	warn = async (message: unknown, useDate?: boolean) => {
		this.Log("warn", message, useDate);
	};

	error = async (message: unknown, useDate?: boolean) => {
		this.Log("error", message, useDate);
	};

	success = async (message: unknown, useDate?: boolean) => {
		this.Log("success", message, useDate);
	};

	verbose = async (message: unknown, useDate?: boolean) => {
		if (!this.devMode) return;
		this.Log("verbose", message, useDate);
	};

	SetMaintenance = async (status: boolean) => {
		this.maintenanceMode = status;
		this.warn(`Maintenance mode is now ${status ? "enabled" : "disabled"}`);
	}

    //* Startup
	Startup = async () => {
		this.warn(this.devMode ? "OmegaOS starting in DEV mode" : "OmegaOS starting in PROD mode");

		this.log("Starting OmegaOS");
		await this.login(!this.devMode ? process.env.discordToken : process.env.dev_discordToken);

		if (this.user) {
			this.user.setActivity(`on v${this.config.version} ${this.devMode ? `[DEV]` : ``} | ${this.guilds.cache.size} servers`, { type: ActivityType.Playing });
		}

		try {
			await this.wrapblox.login(process.env.robloxCookie as string)

			this.success("Logged in to Roblox")
		} catch (error) {
			this.error(`Failed to login to Roblox: ${error}`)
		}

		this.config.branding.baseURL = (!this.devMode) ? "https://omegaos-9c292086b6e4.herokuapp.com" : `http://localhost:${this.config.port}`;

		for (const channel in this.config.channels) {
			// @ts-ignore
			const channelId = this.config.channels[channel] as string;

			try {
				const fetchedChannel = await this.channels.fetch(channelId) as TextChannel;
				this.BotChannels[channel] = fetchedChannel;
			} catch (error) {
				this.error(`Failed to fetch channel ${channel}: ${error}`)
			}
		}

		await this.Functions.Init()
		await this.Logs.Init()
		await this.Process.Init()
		await this.Events.Init()
		await this.Database.Init()
		await this.Interactables.Init()
		await this.API.Init()

		this.Started = true
		this.warn(`OmegaOS has started with version ${this.config.version}!`);
	};

	constructor(data : ClientOptions) {
		super(data)

		this.Functions = new Functions(this)
		this.Logs = new Logs(this)
		this.Events = new Events(this)
		this.Process = new Process(this)
		this.Database = new Database(this)
		this.Interactables = new Interactables(this)
		this.API = new API(this)
	}
}

export default OmegaClient