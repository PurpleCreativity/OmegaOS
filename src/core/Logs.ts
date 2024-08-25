import { Request } from "express";
import OmegaClient from "../classes/OmegaClient.js";
import { guildProfileInterface } from "../schemas/guildProfile.js";
import express from "express";
import ButtonEmbed from "../classes/ButtonEmbed.js";
import { ButtonStyle } from "discord.js";

export default class Logs {
    client: OmegaClient;

    constructor(client: OmegaClient) {
        this.client = client;
    }

    LogError = async (error: Error) => {
        this.client.error(error.stack as string, true);
        if (!error.stack) return;

        const channel = this.client.BotChannels.errors;
        if (!channel) return;

        if (error.stack.length > 1024) {
            error.stack = error.stack.slice(0, 1024);
        }

        const matchString = process.cwd().replace(/\\/g, "\\\\");

        const matcher = new RegExp(matchString, "g");
        error.stack = error.stack.replace(matcher, "");

        if (error.stack.length > 980) {
            error.stack = error.stack.slice(0, 980);
            error.stack += "\nError stack too long!"
        }

        const errorEmbed = this.client.Functions.makeErrorEmbed({
            title: "An error occurred",
            fields: [
                {
                    name: "Error Message",
                    value: `\`\`\`js\n${error.message}\`\`\``,
                    inline: false
                },
                {
                    name: "Error Stack",
                    value: `\`\`\`js\n${error.stack}\`\`\``,
                    inline: false
                }
            ]
        })

        await channel.send({ embeds: [errorEmbed] });
    }

    LogAPI = async (req : express.Request, res : express.Response) => {
        const channel = this.client.BotChannels.api;
        if (!channel) return;

        const embed = this.client.Functions.makeInfoEmbed({
            title: "API Request",
            fields: [
                {
                    name: "Method",
                    value: `\`${req.method}\``,
                    inline: true
                },
                {
                    name: "Path",
                    value: `\`${req.path}\``,
                    inline: true
                },
                {
                    name: "IP Address",
                    value: `||\`${req.ip}\`||`,
                    inline: true
                },
            ]
        })

        const buttonEmbed = new ButtonEmbed(embed)

        const allowedUsers = this.client.config.devlist;
        allowedUsers.push(this.client.config.ownerId);

        buttonEmbed.addButton({
            label: "View Body",
            style: ButtonStyle.Primary,
            allowedUsers: allowedUsers,

            function: async (interaction) => {
                try {
                    const json = JSON.stringify(req.body, null, 2);

                    interaction.reply({ content: "Body", files: [{ name: "body.json", attachment: Buffer.from(json) }], ephemeral: true });
                } catch (error) {
                    interaction.reply({ content: "An error occurred while trying to view the body", ephemeral: true });
                }
            }
        });

        buttonEmbed.addButton({
            label: "View Headers",
            style: ButtonStyle.Danger,
            allowedUsers: allowedUsers,

            function: async (interaction) => {
                try {
                    const json = JSON.stringify(req.headers, null, 2);

                    interaction.reply({ content: "Headers", files: [{ name: "headers.json", attachment: Buffer.from(json) }], ephemeral: true });
                } catch (error) {
                    interaction.reply({ content: "An error occurred while trying to view the headers", ephemeral: true });
                }
            }
        })

        buttonEmbed.addButton({
            label: "View Query",
            style: ButtonStyle.Secondary,
            allowedUsers: allowedUsers,

            function: async (interaction) => {
                try {
                    const json = JSON.stringify(req.query, null, 2);

                    interaction.reply({ content: "Query", files: [{ name: "query.json", attachment: Buffer.from(json) }], ephemeral: true });
                } catch (error) {
                    interaction.reply({ content: "An error occurred while trying to view the query", ephemeral: true });
                }
            }
        })

        buttonEmbed.addButton({
            label: "View Params",
            style: ButtonStyle.Secondary,
            allowedUsers: allowedUsers,

            function: async (interaction) => {
                try {
                    const json = JSON.stringify(req.params, null, 2);

                    interaction.reply({ content: "Params", files: [{ name: "params.json", attachment: Buffer.from(json) }], ephemeral: true });
                } catch (error) {
                    interaction.reply({ content: "An error occurred while trying to view the params", ephemeral: true });
                }
            }
        })

        try {
            await channel.send(buttonEmbed.getMessageData());
        } catch (error) {
            this.LogError(error as Error);
        }
    }

    Init = async () => {
        this.client.success("Logs initialized");
    }
}