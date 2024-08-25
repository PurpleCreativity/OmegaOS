import { AutocompleteInteraction, type ChatInputCommandInteraction, Guild, GuildMember, type PermissionResolvable, type SlashCommandAttachmentOption, type SlashCommandBooleanOption, SlashCommandBuilder, type SlashCommandChannelOption, type SlashCommandIntegerOption, type SlashCommandMentionableOption, type SlashCommandNumberOption, type SlashCommandRoleOption, type SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, type SlashCommandUserOption } from "discord.js";
import client from "../index.js";
import { guildProfileInterface } from "../schemas/guildProfile.js";

export type ValidOptions =
  | SlashCommandStringOption
  | SlashCommandIntegerOption
  | SlashCommandRoleOption
  | SlashCommandUserOption
  | SlashCommandNumberOption
  | SlashCommandRoleOption
  | SlashCommandAttachmentOption
  | SlashCommandBooleanOption
  | SlashCommandChannelOption
  | SlashCommandMentionableOption;

export type SubCommandOptions = {
	name: string;
	description: string;
	options?: ValidOptions[];
}

export type customPermissionOptions =
  | "Administrator"
  | "Moderator"
  | "RobloxModerator"
  | "RobloxGroupManager"
  | "PointsManager"
  | "PointsViewer"
  | "CreatePointLogs"
  | "EventScheduler"
  | "ScheduleManager";

export type CommandOps = {
	name: string;
	description: string;
	dmpermission? : boolean;
	devOnly?: boolean;
	userApp?: boolean;
	globalCooldown?: number;
	guildCooldown?: number;
	userCooldown?: number;
	
	execute (interaction : ChatInputCommandInteraction): Promise<any>;
	autocomplete? (interaction : AutocompleteInteraction): Promise<{name : string, value : string}[]>;

	specificGuild?: string;
	permissions?: PermissionResolvable[];
	customPermissions?: customPermissionOptions[];
	integration_types?: number[];
	contexts?: number[]

	subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];

	options?: ValidOptions[];
}

class Command extends SlashCommandBuilder {
	permissions: PermissionResolvable[];
	customPermissions: customPermissionOptions[];
	specificGuild: string;
	subcommands?: SlashCommandSubcommandBuilder[] | SlashCommandSubcommandGroupBuilder[];
	devOnly?: boolean;
	userApp?: boolean;
	globalCooldown?: number;
	guildCooldown?: number;
	userCooldown?: number;

	integration_types = [0] as number[];
	contexts = [0, 1, 2] as number[];

	userCooldowns = new Map<string, number>();
	guildCooldowns = new Map<string, number>();
	lastUsedGlobal = 0;

	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
	autocomplete?: (interaction : AutocompleteInteraction) => Promise<{name : string, value : string}[]>;

	constructor(opts: CommandOps) {
		super()
		this.setName(opts.name).setDescription(opts.description);
		this.permissions = opts.permissions || [];
		this.customPermissions = opts.customPermissions || [];
		this.specificGuild = opts.specificGuild || "0";
		this.devOnly = opts.devOnly;
		this.globalCooldown = opts.globalCooldown;
		this.guildCooldown = opts.guildCooldown;
		this.userCooldown = opts.userCooldown;
		this.autocomplete = opts.autocomplete;
		this.execute = opts.execute;
		if (opts.options) {
			for (const option of opts.options) {
				this.options.push(option);
			}
		}
		if (opts.subcommands) {
			for (const subcommand of opts.subcommands) {
				if (subcommand instanceof SlashCommandSubcommandGroupBuilder) {
					this.addSubcommandGroup(subcommand);
					continue
				}

				this.addSubcommand(subcommand)
			}
		}
		
		if (opts.userApp) this.makeUserApp();
		this.setDMPermission(opts.dmpermission || false);
	}

	makeUserApp () {
		this.integration_types.push(1);
	}

	async customPermissionCheck (interaction: ChatInputCommandInteraction): Promise<boolean> {
		if (interaction.guild && this.customPermissions.length !== 0) {
			const guild = interaction.guild as Guild;
			const guildProfile = await client.Database.GetGuildProfile(guild.id, false) as guildProfileInterface;
			const guildMember = interaction.member as GuildMember;
			const guildMemberRoles = guildMember.roles.cache

			const requiredPermissions = this.customPermissions;
			const ownedRequiredPermissions = [] as string[];

			const adminPermission = guildProfile.guild.permissions.get("Administrator")
			if (adminPermission) {
				if (adminPermission.users.includes(interaction.user.id)) return true;

				for (const userRoleId of guildMemberRoles.keys()) {
					if (adminPermission.roles.includes(userRoleId)) return true;
				}
			}

			for (const permissionName of this.customPermissions) {
				const permission = guildProfile.guild.permissions.get(permissionName)
				if (!permission) continue;

				if (permission.users.includes(interaction.user.id)) {ownedRequiredPermissions.push(permission.name); continue;};

				for (const userRoleId of guildMemberRoles.keys()) {
					if (permission.roles.includes(userRoleId)) {ownedRequiredPermissions.push(permission.name); continue;};
				}
			}

			if (requiredPermissions.every(permission => ownedRequiredPermissions.includes(permission))) return true;

			return false;
		}
		return true;
	}
	
	async Check (interaction: ChatInputCommandInteraction): Promise<boolean> {
		if (interaction.user.id === client.config.ownerId || client.config.devlist.includes(interaction.user.id)) return true;
		if (this.devOnly === true) return false;
		if (!interaction.member) return true;
		if (interaction.guild && this.specificGuild !== "0" && interaction.guild.id !== this.specificGuild) return false;
		if (this.permissions.length === 0 && this.customPermissions.length === 0) return true;
		if (interaction.guild && this.customPermissions.length !== 0) return await this.customPermissionCheck(interaction);
		if (typeof interaction.member.permissions === "string") return false;
		return interaction.member.permissions.has(this.permissions);
	}
	
	async Execute (interaction: ChatInputCommandInteraction) {
		if (interaction.user.id === client.config.ownerId || client.config.devlist.includes(interaction.user.id)) {
			return await this.execute(interaction);
		}

		if (! await this.Check(interaction)) {
			return interaction.reply({ content: "You do not have permission to run this command", ephemeral: true });
		}

		const currentTimestamp = new Date().getTime();

		if (this.userCooldown) {
			const user = this.userCooldowns.has(interaction.user.id);
			const currentCooldown = this.userCooldowns.get(interaction.user.id);

			if (user && currentCooldown) {
				const remainingCooldown = Math.ceil((this.userCooldown - (currentTimestamp - currentCooldown)) / 1000);

				if (currentTimestamp - currentCooldown < this.userCooldown) {
					return interaction.reply({ content: `You've used this command recently. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>.`, ephemeral: true });
				}
			}
			this.userCooldowns.set(interaction.user.id, Date.now());
		}

		if (interaction.guild) {
			if (this.guildCooldown) {
				const guild = this.guildCooldowns.has(interaction.guild.id);
				const currentCooldown = this.guildCooldowns.get(interaction.guild.id);
	
				if (guild && currentCooldown) {
					const remainingCooldown = Math.ceil((this.guildCooldown - (currentTimestamp - currentCooldown)) / 1000);
	
					if (currentTimestamp - currentCooldown < this.guildCooldown) {
						return interaction.reply({ content: `This command is on a guild cooldown. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>.`, ephemeral: true });
					}
				}
				this.guildCooldowns.set(interaction.guild.id, Date.now());
			}
		}

		if (this.globalCooldown) {
			if (currentTimestamp - this.lastUsedGlobal < this.globalCooldown) {
				const remainingCooldown = Math.ceil((this.globalCooldown - (currentTimestamp - this.lastUsedGlobal)) / 1000);
				return interaction.reply({ content: `This command is on a global cooldown. Please retry again <t:${Math.round(currentTimestamp / 1000 + remainingCooldown)}:R>`, ephemeral: true });
			}
			this.lastUsedGlobal = Date.now();
		}

		return await this.execute(interaction);
	}
}

export default Command;