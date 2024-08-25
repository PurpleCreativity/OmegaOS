import type OmegaClient from "../classes/OmegaClient.js"
import { ActivityType, ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, GuildMember, Interaction, ModalBuilder, ModalSubmitInteraction, type Guild, type User } from "discord.js";
import crypto from "node:crypto";
import { EmbedOptions } from "../types/miscellaneousTypes.js";
import { MaterialIcons } from "../assets/materialIcons.js";
import { createCipheriv, createDecipheriv } from "node:crypto"

import dotenv from "dotenv";
dotenv.config();

export default class Functions {
    client: OmegaClient

    constructor(client : OmegaClient) {
        this.client = client
    }

    GetGuild = async (guildID: string, useCache = true) => {
		let guild: Guild | undefined
		if (useCache) {
			guild = this.client.guilds.cache.get(guildID);
			if (guild) return guild;
		}
		try {
			guild = await this.client.guilds.fetch(guildID);
		} catch (error) {
			return undefined;
		}
		return guild;
	};

	GetUser = async (searcher: string, guild?: Guild, self?: User): Promise<undefined | User | GuildMember> => {
		if (searcher.toLowerCase() === "self" || searcher.toLowerCase() === "me" && self) return self;
		// See if it matches <@id>;
		if (searcher.startsWith("<@") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);

		try {
			const user = await this.client.users.fetch(searcher);
			return user;
		} catch (err) {
			if (guild) {
				const found = await guild.members.fetch({ query: searcher, limit: 1 })
				if (found.size > 0) return found.first()?.user;
			}

			for (const user of this.client.users.cache.values()) {


				if (user.username.toLowerCase() === searcher.toLowerCase()) {
					return user;
				}

				if (user.displayName.toLowerCase() === searcher.toLowerCase()) {
					return user;
				}
			}
		}
	};

	GetChannel = async (searcher: string, guild?: Guild, limitToGuild = false) => {
		if (!searcher) return undefined;
		// See if it matches <#id>;
		if (searcher.startsWith("<#") && searcher.endsWith(">")) searcher = searcher.slice(2, -1);
		if (searcher.startsWith("#")) searcher = searcher.slice(1);
		// Replace all spaces with dashes
		searcher = searcher.replace(/ /g, "-");

		try {
			const channel = await this.client.channels.fetch(searcher);
			if (!channel) throw new Error("Channel not found");

			if (!limitToGuild || !guild) return channel;


			if (!("guild" in channel)) throw new Error("Channel not found");
			if (channel.guild.id === guild.id) return channel;

			throw new Error("Channel not found");
		} catch (err) {
			if (guild) {
				for (const channel of guild.channels.cache.values()) {
					if (channel.name.toLowerCase() === searcher.toLowerCase()) {
						return channel;
					}
				}
			}

			for (const channel of this.client.channels.cache.values()) {
				if (!("name" in channel)) continue;
				if (!channel.name) continue
				if (channel.name.toLowerCase() === searcher.toLowerCase()) {
					if (!limitToGuild || !guild) return channel;
					if (!("guild" in channel)) continue;
					if (channel.guild.id === guild.id) return channel;
				}
			}
		}

		return undefined;

	};

	GetRole = async (searcher: string, guild: Guild) => {
		// See if it matches <@&id>;
		if (searcher.startsWith("<@&") && searcher.endsWith(">")) searcher = searcher.slice(3, -1);

		try {
			const role = await guild.roles.fetch(searcher);
			if (role) return role;
			throw new Error("Role not found");
		} catch (err) {
			for (const role of guild.roles.cache.values()) {
				if (role.name.toLowerCase() === searcher.toLowerCase()) {
					return role;
				}
				if (role.id === searcher) {
					return role;
				}
				if (role.name.toLowerCase().startsWith(searcher.toLowerCase())) {
					return role;
				}
				/*
				if (role.name.toLowerCase().endsWith(searcher.toLowerCase())) {
					return role;
				}
				*/
			}
		}
	};

	ConvertDiscordIdtoRobloxId = async (discordID: string) => {
		const userProfile = await this.client.Database.GetUserProfile(discordID, false);
		if (!userProfile) return undefined;

		return userProfile.roblox.id;
	}

	ConvertRobloxIdtoDiscordId = async (robloxID: number) => {
		const userProfile = await this.client.Database.GetUserProfilebyRobloxId(robloxID.toString(), false);
		if (!userProfile) return undefined;
		return userProfile.user.id;
	}

    GenerateID = () => {
		return crypto.randomUUID();
	};

	ValidateString = (string: string, allowWhiteSpaces?: boolean): boolean => {
		allowWhiteSpaces = allowWhiteSpaces || true;
		let regex;
		if (allowWhiteSpaces) {
			regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]*$/;
		} else {
			regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
		}
		return regex.test(string);
	}

	SetActivity = (text:string, activityType:ActivityType) => {
		if (!this.client.user) return;

		this.client.user.setActivity(text, { type: activityType });
	}

	ConvertPlaceIDToUniverseID = async (placeID: number) => {
		const response = await this.client.axios.get(`https://apis.roblox.com/universes/v1/places/${placeID}/universe`);
		return response.data.universeId;
	};

	Sleep = (ms: number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

	TrueStrings = ["true", "yes", "1", "on"];
	FalseStrings = ["false", "no", "0", "off"];
	StringToBoolean = (string : string) => {
		if (this.TrueStrings.includes(string.toLowerCase())) return true;
		if (this.FalseStrings.includes(string.toLowerCase())) return false;
		return false;
	}

	StringRGBToColorHex = (string : string) => {
		const rgb = string.split(",");
		if (rgb.length !== 3) {
			throw new Error("Invalid RGB input. RGB input should have exactly 3 values between 0 and 255 separated by commas.");
		}
		const hex = rgb.map((value) => {
			const intValue = parseInt(value.trim(), 10);
			if (isNaN(intValue) || intValue < 0 || intValue > 255) {
				throw new Error("Invalid RGB input. Each value should be an integer between 0 and 255.");
			}
			const hexValue = intValue.toString(16).padStart(2, "0");
			return hexValue;
		});
		const hexColor = `#${hex.join("")}`;
		return hexColor;
	}

	Encypt = (text : string, iv : any, key? : any) => {
		if (!key) key = process.env.encryptionKey

		key = Buffer.from(key, 'hex');
		iv = Buffer.from(iv, 'hex');

		const cipher = createCipheriv('aes256', key, iv);
		const encryptedMessage = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');

		return { text: encryptedMessage, key : key.toString("hex"), iv: iv.toString("hex") };
	}

	Decrypt = (text : string, iv : any, key? : any) => {
		if (!key) key = process.env.encryptionKey

		key = Buffer.from(key, 'hex');
		iv = Buffer.from(iv, 'hex');

		const decipher = createDecipheriv('aes256', key, iv);
		const decryptedMessage = decipher.update(text, 'hex', 'utf-8') + decipher.final('utf8');

		return decryptedMessage;
	}

	makeBaseEmbed = (embedOptions: EmbedOptions) => {
		const { title, description, color, url, author, footer, fields, thumbnail, image } = embedOptions;
		const embed = new EmbedBuilder()
			.setTitle(title || null)
			.setDescription(description || null)
			.setTimestamp();

		embed.setColor(color || 0xFFFFFF);
		embed.setFields(fields || []);
		embed.setAuthor(embedOptions.author || null);
		embed.setFooter(embedOptions.footer || null);
		embed.setThumbnail(thumbnail || null);
		embed.setImage(image || null);
		embed.setURL(url || null);
		
		return embed as EmbedBuilder;
	}

	makeInfoEmbed = (embedOptions: EmbedOptions) => {
		const embed = this.makeBaseEmbed(embedOptions);
		embed.setAuthor({ name: "Info", iconURL: MaterialIcons.omegainfo });
		embed.setColor(0x4287f5);

		return embed as EmbedBuilder;
	}

	makeSuccessEmbed = (embedOptions: EmbedOptions) => {
		const embed = this.makeBaseEmbed(embedOptions);
		embed.setAuthor({ name: "Success", iconURL: MaterialIcons.omegasuccess });
		embed.setColor(0x00ff00);

		return embed as EmbedBuilder;
	}

	makeErrorEmbed = (embedOptions: EmbedOptions) => {
		const embed = this.makeBaseEmbed(embedOptions);
		embed.setAuthor({ name: "Error", iconURL: MaterialIcons.omegaerror });
		embed.setColor(0xff0000);

		return embed as EmbedBuilder;
	}

	makeWarnEmbed = (embedOptions: EmbedOptions) => {
		const embed = this.makeBaseEmbed(embedOptions);
		embed.setAuthor({ name: "Warning", iconURL: MaterialIcons.omegawarn });
		embed.setColor(0xffcc00);

		return embed as EmbedBuilder;
	}

	CreateAcronym = (string : string) => {
		return string.split(" ").map(word => word[0].toUpperCase()).join("");
	}

	PromptModal = async (interaction: ButtonInteraction | ChatInputCommandInteraction, Modal: ModalBuilder): Promise<ModalSubmitInteraction> => {
		interaction.showModal(Modal);

		return new Promise((resolve, reject) => {
			this.client.on("interactionCreate", async (newInteraction: Interaction) => {
				if (!newInteraction.isModalSubmit()) return
				if (newInteraction.customId !== Modal.data.custom_id) return;
				resolve(newInteraction);
			});
		});
	};

	checkGuildUserPermissions = async (guildId: string, userId: string, permissions: string[]): Promise<boolean> => {
		if (userId === this.client.config.ownerId || this.client.config.devlist.includes(userId)) return true;

		const guild = await this.GetGuild(guildId);
		if (!guild) return false;

		const member = guild.members.cache.get(userId);
		if (!member) return false;

		const guildProfile = await this.client.Database.GetGuildProfile(guild.id, false);

		const memberRoles = member.roles.cache;

		const adminPermission = guildProfile.guild.permissions.get("Administrator")
		if (adminPermission) {
			if (adminPermission.users.includes(userId)) return true;

			for (const userRoleId of memberRoles.keys()) {
				if (adminPermission.roles.includes(userRoleId)) return true;
			}
		}

		for (const permissionName of permissions) {
			const permission = guildProfile.guild.permissions.get(permissionName)
			if (!permission) continue;

			if (permission.users.includes(userId)) return true;

			for (const userRoleId of memberRoles.keys()) {
				if (permission.roles.includes(userRoleId)) return true;
			}
		}

		return false;
	}

	Init = async () => {
		this.client.success("Initialized Functions");
	}
}