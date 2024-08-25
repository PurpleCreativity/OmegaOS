import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, Guild, Interaction, Message, ModalSubmitInteraction, Snowflake, StringSelectMenuInteraction } from "discord.js";
import OmegaClient from "../classes/OmegaClient.js";
import Command from "../classes/Command.js";
import { ScheduleEvent } from "../schemas/guildProfile.js";

export default class Process {
	client: OmegaClient;

	constructor(client: OmegaClient) {
		this.client = client;
	}

    Error = async (error: Error) => {
        try {
            this.client.Logs.LogError(error);
        } catch (error) {
            this.client.error(error);
        }
    }

    handleSchedule = async () => {
        this.client.log("Handling schedule");

        const guilds = await this.client.Database.GetAllGuilds(false);
        for (const guildDataProfile of guilds.values()) {
            const currentTimestamp = Math.round(Date.now() / 1000);

            const scheduledEvents = await guildDataProfile.getScheduledEvents();
            const ongoingEvents = await guildDataProfile.getOngoingEvents();

            if (scheduledEvents.length !== 0) {
                for (const event of scheduledEvents) {
                    if (event.time <= currentTimestamp && !event.ongoing) {
                        if (event.time + (event.duration * 60) < currentTimestamp) {
                            await guildDataProfile.endEvent(event.id);
                            continue;
                        }
                        await guildDataProfile.startEvent(event.id);
                    }

                    // Will work properly on every 60 second update interval
                    const minutesUntilEvent = Math.floor((event.time - currentTimestamp) / 60);
                    if (minutesUntilEvent === 60 || minutesUntilEvent === 30 || minutesUntilEvent === 15) {
                        try {
                            await guildDataProfile.eventReminder(event.id);
                        } catch (error) {
                            this.client.Logs.LogError(error as Error);   
                        }
                    }
                }
            }

            for (const ongoingEvent of ongoingEvents) {
                if (ongoingEvent.time + (ongoingEvent.duration * 60) < currentTimestamp) {
                    await guildDataProfile.endEvent(ongoingEvent.id);
                }
            }
        }
    }

    handleStaticButton = async (interaction: ButtonInteraction) => {
        const args = interaction.customId.split("_");
        args.shift();
        if (!args.length || args.length === 0) return;

        const button = this.client.Interactables.StaticButtons.get(args[0].toLowerCase());
        if (!button) return;

        await interaction.deferReply();

        await button(interaction);
    }

    interactionCreate = async (interaction: Interaction) => {
        if (interaction.isChatInputCommand()) {
            const command = this.client.Interactables.GetCommand(interaction.commandName);
            if (!command) return;

            console.log(`Command ${interaction.commandName} was executed by ${interaction.user.tag} (${interaction.user.id})`);

            try {
                if (
                    this.client.maintenanceMode &&
                    (!this.client.config.devlist.includes(interaction.user.id) && interaction.user.id !== this.client.config.ownerId)
                ) return await interaction.reply({ content: "The bot is currently in maintenance mode, please try again later.", ephemeral: true });

                await command.Execute(interaction);
            } catch (error) {
                this.client.Logs.LogError(error as Error);
                                // discord.js is fucking stupid and interaction.isRepliable() isn't full-proof for some reason
                if (interaction.isRepliable() && !(interaction.replied || interaction.deferred)) {
                    interaction.reply(`An error occurred while executing the command ${interaction.commandName}:\n${error}`);
                    return;
                }

                interaction.editReply(`An error occurred while executing the command ${interaction.commandName}:\n${error}`)

            }
            return;
        }

		if (interaction.isButton()) {
            if (
                this.client.maintenanceMode &&
                (!this.client.config.devlist.includes(interaction.user.id) && interaction.user.id !== this.client.config.ownerId)
            ) return await interaction.reply({ content: "The bot is currently in maintenance mode, please try again later.", ephemeral: true });

            if (interaction.customId.toLowerCase().startsWith("static_")) {
                this.handleStaticButton(interaction as ButtonInteraction);
                return;
            }

			this.client.emit("buttonPress", interaction as ButtonInteraction);

			return;
		}

        if (interaction.isModalSubmit()) {
            if (
                this.client.maintenanceMode &&
                (!this.client.config.devlist.includes(interaction.user.id) && interaction.user.id !== this.client.config.ownerId)
            ) return;

            this.client.emit("modalSubmit", interaction as ModalSubmitInteraction);
            
            return;
        }

        if (interaction.isAutocomplete()) {
            if (
                this.client.maintenanceMode &&
                (!this.client.config.devlist.includes(interaction.user.id) && interaction.user.id !== this.client.config.ownerId)
            ) return;

            const commandName = interaction.commandName;
            const command = this.client.Interactables.StoredCommands.get(commandName);

            if (!command || !command.autocomplete) return;

            const choices = await command.autocomplete(interaction);
            if (!choices) return;
			if (choices.length > 25) {
				choices.splice(25);
			}
			await interaction.respond(choices);

            return;
        }

        if (interaction.isStringSelectMenu()) {
            if (
                this.client.maintenanceMode &&
                (!this.client.config.devlist.includes(interaction.user.id) && interaction.user.id !== this.client.config.ownerId)
            ) return;

            this.client.emit("stringSelectMenuSubmit", interaction as StringSelectMenuInteraction);

            return
        }
	};

    guildCreate = async (guild : Guild | Snowflake) => {
        this.client.warn(`Joined guild ${guild instanceof Guild ? guild.name : guild}`);
    }

    Init = async () => {
        this.client.Events.AddEvent("client", "interactionCreate", this.interactionCreate);
        this.client.Events.AddEvent("client", "guildCreate", this.guildCreate);

        this.client.Events.AddEvent("process", "uncaughtException", this.Error);

        setInterval(async () => {
            await this.handleSchedule();
        }, 60000);

        this.client.success("Initialized Process");
    }
}