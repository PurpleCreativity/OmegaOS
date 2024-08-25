import OmegaClient from "../classes/OmegaClient.js"
import dotenv from "dotenv";
dotenv.config();

import guildProfile, { guildProfileInterface, guildProfileSchema } from "../schemas/guildProfile.js";
import { Guild, Snowflake, User } from "discord.js";
import userProfile, { userProfileInterface, userProfileSchema } from "../schemas/userProfile.js";
import { Model, Schema } from "mongoose";
import crypto from "node:crypto";
import client from "../index.js";
import { permission } from "node:process";

export default class Database {
	client : OmegaClient

    Cache = {
        Guilds: new Map<string, guildProfileInterface>(),
        Users: new Map<string, userProfileInterface>(),
    }

    constructor(client : OmegaClient) {
        this.client = client

        this.client.log("Initialized Database")
    }

    CreateGuildProfile = async (guild: Guild | string | Snowflake): Promise<guildProfileInterface> => {
        let realguild: Guild;
		if (typeof guild === "string") realguild = await this.client.Functions.GetGuild(guild, false) as Guild; else realguild = guild;

        const existingGuildProfile = await guildProfile.findOne({ "guild.id": realguild.id });
        if (existingGuildProfile) return existingGuildProfile as unknown as guildProfileInterface;

		const owner = await realguild.fetchOwner().then((owner) => owner.user);

        const newguildProfile = new guildProfile({
            _id: new this.client.mongoose.Types.ObjectId(),
            iv: crypto.randomBytes(16).toString("hex"),

            guild: {
                id: realguild.id,
                name: realguild.name,
                shortName: client.Functions.CreateAcronym(realguild.name),
                owner: {
                    id: owner.id,
                    name: owner.username,
                },

                channels: new Map()
                    .set("pointsDBupdates", { name: "pointsDBupdates", id: null })
                    .set("eventlogupdates", { name: "eventlogupdates", id: null })
                    .set("scheduleupdates", { name: "scheduleupdates", id: null })
                    .set("gameLogs", { name: "gameLogs", id: null })
                    .set("robloxgrouplogs", { name: "robloxgrouplogs", id: null })
                    .set("calls", { name: "calls", id: null }),

                permissions: new Map()
                    .set("Administrator", { name: "Administrator", roles: [], users: [owner.id] })
                    .set("Moderator", { name: "Moderator", roles: [], users: [owner.id] })

                    .set("RobloxModerator", { name: "RobloxModerator", roles: [], users: [owner.id] })
                    .set("RobloxGroupManager", { name: "RobloxGroupManager", roles: [], users: [owner.id] })

                    .set("PointsManager", { name: "PointsManager", roles: [], users: [owner.id] })
                    .set("PointsViewer", { name: "PointsViewer", roles: [], users: [owner.id] })

                    .set("CreatePointLogs", { name: "CreatePointLogs", roles: [], users: [owner.id] })

                    .set("EventScheduler", { name: "EventScheduler", roles: [], users: [owner.id] })
                    .set("ScheduleManager", { name: "ScheduleManager", roles: [], users: [owner.id] })
                ,
            },

            users: new Map(),

            schedule: {
                scheduled: new Map(),
                ongoing: new Map(),
                types: new Map(),
            },

            API: {
                keys: new Map(),
                enabled: true,
                banned: false,
            },

            roblox: {
                groupId: 0,
                roverKey: null,
                bloxlinkKey: null,

                places: new Map(),
            },

            pointlogs: new Map(),

            settings: new Map()
                .set("publicSchedule", { name: "publicSchedule", description: "Allows anyone to view your guild's schedule trough the API, no key required", value: false })
                .set("publicPoints", { name: "publicPoints", description: "Allows anyone to view your guild's points trough the API, no key required", value: false })
            ,

            linkedGuilds: new Map(),
        });

        await newguildProfile.save()
        this.Cache.Guilds.set(realguild.id, newguildProfile as unknown as guildProfileInterface);

        return newguildProfile as unknown as guildProfileInterface;
    }

    GetGuildProfile = async (guildId: string, useCache: boolean = true): Promise<guildProfileInterface> => {
        if (useCache) {
            const cachedProfile = this.Cache.Guilds.get(guildId);
            if (cachedProfile) return cachedProfile;
        }

        const profile = await guildProfile.findOne({ "guild.id": guildId });
		if (profile) {
            this.Cache.Guilds.set(guildId, profile as unknown as guildProfileInterface)
            return profile as unknown as guildProfileInterface
        }

		return this.CreateGuildProfile(guildId) as Promise<guildProfileInterface>;
    }

    GetGuildProfileByShortName = async (shortName: string, useCache: boolean = true): Promise<guildProfileInterface | null> => {
        if (useCache) {
            for (const profile of this.Cache.Guilds.values()) {
                if (profile.guild.shortName === shortName) return profile;
            }
        }

        const profile = await guildProfile.findOne({ "guild.shortName": shortName });
        if (profile) return profile as unknown as guildProfileInterface;

        return null;
    }

    GetAllGuilds = async (usecache = true) => {
        if (usecache) return this.Cache.Guilds as Map<string, guildProfileInterface>;

        const guilds = await guildProfile.find() as guildProfileInterface[];
        const guildMap = new Map<string, guildProfileInterface>();

        guilds.forEach((guild) => {
            guildMap.set(guild.guild.id, guild);
        });

        return guildMap as Map<string, guildProfileInterface>;
    }

    CreateUserProfile = async (user: User | string | Snowflake): Promise<userProfileInterface> => {
        let realUser: User;
        if (typeof user === "string") realUser = await this.client.Functions.GetUser(user) as User; else realUser = user;

        const existingProfile = await userProfile.findOne({ "user.id": realUser.id });
        if (existingProfile) return existingProfile as userProfileInterface;

        const newUserProfile = new userProfile({
            _id: new this.client.mongoose.Types.ObjectId(),
            iv: crypto.randomBytes(16).toString("hex"),

            user: {
                id: realUser.id,
                name: realUser.username,
            },

            roblox: {
                name: null,
                id: null,

                verified: false,
                verifiedAt: null,
            },

            settings: new Map()
                .set("scheduleReminders", { name: "scheduleReminders", description: "Receive reminders for upcoming events via DMs", value: true })
        });

        await newUserProfile.save()
        this.Cache.Users.set(realUser.id, newUserProfile as userProfileInterface);
        return newUserProfile as userProfileInterface;
    }

    GetUserProfile = async (userId: string, useCache: boolean = true): Promise<userProfileInterface> => {
        if (useCache) {
            const cachedProfile = this.Cache.Users.get(userId);
            if (cachedProfile) return cachedProfile as userProfileInterface;
        }

        const profile = await userProfile.findOne({ "user.id": userId });
        if (profile) {
            this.Cache.Users.set(userId, profile as userProfileInterface)
            return profile as userProfileInterface
        }

		return this.CreateUserProfile(userId) as Promise<userProfileInterface>;
    }

    GetUserProfilebyRobloxId = async (robloxId: string, useCache: boolean = true): Promise<userProfileInterface | null> => {
        if (useCache) {
            for (const profile of this.Cache.Users.values()) {
                if (profile.roblox.id === robloxId) return profile;
            }
        }

        const profile = await userProfile.findOne({ "roblox.id": robloxId });
        if (profile) return profile as userProfileInterface;

        return null;
    }

    IsConnected = async () => {
        return this.client.mongoose.connection.readyState === 1
    }

    UpdateCache = async () => {
        this.client.verbose("Updating database cache")

        for (let guildprofileEntry of await guildProfile.find() as guildProfileInterface[]) {
            if (!guildprofileEntry.guild || !guildprofileEntry.guild.id) {
                this.client.warn("A guild has been found without the guild object or guildId, deleting it.")
                await guildProfile.deleteOne()
                continue;
            }

            this.client.log(`Updating cache for guild ${guildprofileEntry.guild.name} [${guildprofileEntry.guild.id}]`)
            this.Cache.Guilds.set(guildprofileEntry.guild.id, guildprofileEntry);
        }

        for (let userprofileEntry of await userProfile.find() as userProfileInterface[]) {
            if (!userprofileEntry.user || !userprofileEntry.user.id) {
                this.client.warn("A user has been found without the user object or userId, deleting it.")
                await userProfile.deleteOne()
                continue;
            }

            this.client.log(`Updating cache for user ${userprofileEntry.user.name} [${userprofileEntry.user.id}]`)
            this.Cache.Users.set(userprofileEntry.user.id, userprofileEntry);
        }

        client.success("Updated database cache")
    }

    Init = async () => {
        await this.client.mongoose.connect(!this.client.devMode ? process.env.databaseToken as string : process.env.dev_databaseToken as string).catch((error: Error) => {
			this.client.error(`Failed to connect to database: ${error.stack}: ${error.message}`)
            return;
		});
        if (! await this.IsConnected()) return;

        // Update cache every 10 minutes
        await this.UpdateCache()
        setInterval (async () => {
           await this.UpdateCache()
        }, 1000 * 60 * 10); // every 10 minutes

        this.client.success(`Connected to database ${this.client.devMode ? `[DEV]` : `[PROD]`}`)
    }
}