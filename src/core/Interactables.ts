import { ButtonInteraction, Collection, REST, Routes, type ChatInputCommandInteraction } from "discord.js";
import Command from "../classes/Command.js";
import type OmegaClient from "../classes/OmegaClient.js";
import fs from "node:fs"
import path from "node:path";

export default class Interactables {
	client : OmegaClient
	
	CommandFolders = fs.readdirSync(path.join(process.cwd(), "build/commands"));
	StoredCommands = new Collection<string, Command>();
	StaticButtons = new Map<string, (interaction: ButtonInteraction) => void | Promise<void>>();
	REST: REST
	
	constructor(client : OmegaClient) {
		this.client = client
		this.REST = new REST().setToken(!this.client.devMode ? process.env.discordToken as string : process.env.dev_discordToken as string)
	}

	AddCommand = (command : Command) => {
		this.StoredCommands.set(command.name, command)
	}

	RemoveCommand = async (commandName : string) => {
		this.StoredCommands.delete(commandName)
	}

	GetCommand = (commandName : string) => {
		return this.StoredCommands.get(commandName)
	}

	LoadCommands = async () => {
		for (const folder of this.CommandFolders) {
			const newPath = path.join(process.cwd(), "build/commands", folder)
			const files = fs.readdirSync(newPath).filter(file => file.endsWith(".js"))
			for (const file of files) {
				const importPath = path.join(process.cwd(), "build/commands", folder, file)
				const command = await import(`file://${importPath}`)
				this.AddCommand(command.default)
			}
		}
	}

	DeleteCommands = async () => {
		await this.REST.put(
			Routes.applicationCommands(this.client.application?.id as string),
			{
				body: []
			}
		)

		for (const guild of this.client.guilds.cache.values()) {
			await this.REST.put(
				Routes.applicationGuildCommands(this.client.application?.id as string, guild.id),
				{
					body: []
				}
			)
		}

		this.client.warn("Deleted all commands")
	}

	DeployCommands = async () => {
		if (!this.client.application) throw new Error("No application(????????????)")
		
		this.client.warn("Deploying commands")
		await this.REST.put(
			Routes.applicationCommands(this.client.application.id),
			{
				body: this.StoredCommands.map((command) => {
					if (!(command instanceof Command)) {
						this.client.warn("Command that is not a command, skipping")
						return;
					}

					if (command.specificGuild !== "0") return;

					return command.toJSON()
				})
			}
		);

		this.client.success("Finished deploying commands")
	}

	AddStaticButton = (customId : string, callback : (interaction: ButtonInteraction) => void | Promise<void>) => {
		this.StaticButtons.set(customId, callback)
	}

	GetStaticButton = (customId : string) => {
		return this.StaticButtons.get(customId)
	}

	LoadStaticButtons = async () => {
		const buttons = fs.readdirSync(path.join(process.cwd(), "build/staticButtons")).filter(file => file.endsWith(".js"))
		for (const button of buttons) {
			const buttonData = await import(`file://${path.join(process.cwd(), "build/staticButtons", button)}`)
			this.AddStaticButton(buttonData.default.customId, buttonData.default.execute)
		}
	}
	
	Init = async () => {
		await this.LoadCommands()
		await this.LoadStaticButtons()

//		await this.DeleteCommands()
//		await this.DeployCommands()

		this.client.success("Initialized Commands");
	}
}