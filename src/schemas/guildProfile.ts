import mongoose from "mongoose";
import client from "../index.js";
import { ButtonInteraction, ButtonStyle, Guild, GuildMember, TextChannel, User } from "discord.js";
import { userProfileInterface } from "./userProfile.js";
import ButtonEmbed from "../classes/ButtonEmbed.js";
import { AxiosError } from "axios";
import { setTimeout } from "timers/promises";
import { TIMEOUT } from "dns";
import express from "express"

type guildUser = {
    userProfile: any,
    discordId: string,
    robloxId: string,

    points: number,
    note: {
        text: string,
        visible: boolean,

        updatedAt: number,
    },

    ranklock: {
        rank: number,
        shadow: Boolean,
        reason: string,

        updatedAt: number,
    }
}

type linkedGuild = {
    alias: string,
    guildId: string,
    _documentId: mongoose.Types.ObjectId,

    settings: Map<string, {
        name: string,
        description: string,

        value: any,
    }>,
}

type APIKey = {
    name : string,
    key : string,

    enabled : boolean,
    permissions : string[],

    createdAt : number,
    createdBy : string,
}

type PointLog = {
	id : string,
	data : {
		id : string,
		name? : string,
		points : number,
	}[]
	notes : string | undefined,
	creator : string, // ID of the user who created the log

    createdAt: any,
}

type ScheduleEventType = {
    name : string,
    icon : string,
    color : string,

    description : string,

    canSchedule : { roles : string[], users : string[] },
}

type ScheduleEvent = {
	eventType : string,

	time : number; // Unix timestamp
	duration : number; // Duration in seconds
	notes? : string; // Optional notes
	host: {
        name : string; // Name of the host
        id : number; // RobloxId of the host
    }

    ongoing : boolean; // Is the event ongoing
	id : string; // Unique identifier for the event
}

interface guildProfileInterface extends mongoose.Document {
	_id: mongoose.Types.ObjectId,
    iv: string,

    guild: {
        id: string,
        name: string,
        shortName: string,
        owner: {
            name: string,
            id: string,
        },

        channels: Map<string, {
            name: string,
            id: string,
        }>,

        permissions: Map<string, {
            name: string,
            roles: string[],
            users: string[],
        }>,
    },

    users: Map<string, guildUser>,

    schedule: {
        scheduled: Map<string, ScheduleEvent>,
        types: Map<string, ScheduleEventType>,
    }

    API: {
        keys: Map<string, APIKey>,
        enabled: boolean,
        banned: boolean,
    },

    roblox: {
        groupId: number,
        roverKey: string,
        bloxlinkKey: string,
       
        places: Map<string, {
            name: string,
            id: string,
            key: string
        }>,
    },

    pointlogs: Map<string, PointLog>,

    settings: Map<string, {
        name: string;
        description: string;

        value: any;
    }>;

    linkedGuilds: Map<string, linkedGuild>,

    addUser: (robloxId: string) => Promise<guildUser>,
    getUser: (robloxId: string) => Promise<guildUser>,

    getEventTypes: () => Promise<Map<string, ScheduleEventType>>,
    
    getEventType: (eventType: string) => Promise<ScheduleEventType>,
    deleteEventType: (eventType: string) => Promise<void>,
    addEventType: (eventType: ScheduleEventType) => Promise<void>,
    editEventType: (eventType: string, newData: ScheduleEventType) => Promise<void>,

    startEvent: (eventId: string) => Promise<void>,
    endEvent: (eventId: string) => Promise<void>,

    getOngoingEvents: () => Promise<ScheduleEvent[]>,
    getScheduledEvent: (eventId: string) => Promise<ScheduleEvent>,
    getScheduledEventsbyUser: (robloxId: string) => Promise<ScheduleEvent[]>,
    getNextScheduledEvent: () => Promise<ScheduleEvent>,

    addScheduleEvent: (event: ScheduleEvent) => Promise<void>,
    editScheduledEvent: (eventId: string, newData: ScheduleEvent, editedBy: number) => Promise<void>,
    cancelScheduledEvent: (eventId: string, cancelledBy: number) => Promise<void>,
    eventReminder: (eventId: string) => Promise<void>,
    removeScheduleEvent: (eventId: string) => Promise<void>,
    checkEventScheduleAvailability: (event: ScheduleEvent) => Promise<boolean>,

    getScheduledEvents: () => Promise<ScheduleEvent[]>,

    calculateUserpendingPoints: (robloxId: string) => Promise<number>,
    setUserPoints: (robloxId: string, points: number) => Promise<guildUser>,
    incrementUserPoints: (robloxId: string, points: number) => Promise<guildUser>,
    setUserNote: (robloxId: string, note: string, visible: boolean) => Promise<guildUser>,

    createPointLog: (log: PointLog) => Promise<void>,
    approvePointLog: (logId: string) => Promise<void>,
    editPointLog: (logId: string, newData: { id : string, name? : string, points : number }[]) => Promise<void>,
    removePointLog: (logId: string) => Promise<void>,
    getPointLog: (logId: string) => Promise<PointLog>,
    getAllPointLogs: () => Promise<PointLog[]>,
    getUserPointLogs: (robloxId: string) => Promise<PointLog[]>,

    setChannel: (channelType: string, channelId: string) => Promise<void>,
    getChannel: (channelType: string) => Promise<TextChannel>,

    setUserRanklock: (robloxId: string, rank: number, shadow: boolean, reason: string) => Promise<void>,

    getPermission: (permission: string) => Promise<{name: string, roles: string[], users: string[]}>,

    getKey: (key: string) => Promise<{name: string, key: string, enabled: boolean, permissions: string[]}>,

    robloxRequest: (placeName: string, TargetServerJobId: string, route: string, body?: any) => Promise<any>,
    linkRobloxGroup: (groupId: number) => Promise<void>,

    getlinkedGuild: (alias: string) => Promise<linkedGuild>,

    fetchGuild: () => Promise<Guild>,

    createdAt: Date,
    updatedAt: Date,
}

const guildProfileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    iv: { type: String, required: true },

    guild: {
        id: { type: String, unique: true},
        name: { type: String },
        shortName: { type: String },
        owner: {
            name: { type: String },
            id: { type: String },
        },

        channels: {
            type: Map,
            of: {
                name: String,
                id: String,
            }
        },

        permissions: {
            type: Map,
            of: {
                name: String,
                roles: {
                    type: Array,
                    of: String
                },
                users: {
                    type: Array,
                    of: String
                },
            }
        },
    },

    users: {
        type: Map,
        of: {
            userProfile: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "userprofile",
            },
            robloxId: String,

            points: Number,
            note: {
                text: String,
                visible: Boolean,

                updatedAt: Number,
            },
            ranklock: {
                rank: Number,
                shadow: Boolean,
                reason: String,

                updatedAt: Number,
            }
        }
    },

    pointlogs: {
        type: Map,
        of: {
            id: String,
            data: {
                type: Array,
                of: {
                    id: String,
                    name: String,
                    points: Number,
                }
            },
            notes: String,
            creator: String,
            createdAt: Date,
        }
    },

    schedule: {
        scheduled: {
            type: Map,
            of: {
                eventType: String,
            
                time: Number,
                duration: Number,
                notes: String,
                host: {
                    name: String,
                    id: Number,
                },
                
                ongoing: Boolean,
                id: String,
            }
        },
        types: {
            type: Map,
            of: {
                name: String,
                icon: String,
                color: String,

                description: String,

                canSchedule: {
                    roles: Array,
                    users: Array,
                },
            }
        },
    },

    API: {
        keys: {
            type: Map,
            of: {
                name : String,
                key : String,

                createdAt : Number,
                createdBy : String,

                enabled : Boolean,
                permissions : Array,
            }
        },
        enabled: Boolean,
        banned: Boolean,
    },

    roblox: {
        groupId: Number,
        roverKey: String,
        bloxlinkKey: String,
       
        places: {
            type: Map,
            of: {
                name: String,
                id: String,
                key: String
            }
        },
    },

    settings: {
        type: Map,
        of: {
            name: String,
            description: String,

            value: mongoose.Schema.Types.Mixed,
        }
    },

    linkedGuilds: {
        type: Map,
        of: {
            alias: String,
            guildId: String,
            _documentId: mongoose.Schema.Types.ObjectId,

            settings: {
                type: Map,
                of: {
                    name: String,
                    description: String,

                    value: mongoose.Schema.Types.Mixed,
                }
            },
        }
    },

    createdAt: { type: Date, immutable : true, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
});

guildProfileSchema.pre("save", function (next) {
    // @ts-ignore
    this.updatedAt = Date.now()
    next();
});

guildProfileSchema.post("save", function (doc : guildProfileInterface, next) {
    client.success(`Saved guild profile for "${doc.guild.name}" [${doc.guild.id}]`)
    client.Database.Cache.Guilds.set(doc.guild.id, doc);
    next();
});

guildProfileSchema.methods.getUser = async function(robloxId:string) {
    const user = this.users.get(robloxId);
    if (user) return user

    return this.addUser(robloxId);
}

guildProfileSchema.methods.addUser = async function(robloxId:string) {
    const updatedAt = new Date().getTime();

    let data = {
        userProfile: null,
        robloxId: robloxId,
        discordId: "",

        points: 0,
        note: {
            text: "",
            visible: false,

            updatedAt: updatedAt,
        },
        ranklock: {
            rank: 0,
            shadow: false,
            reason: "",

            updatedAt: updatedAt,
        }
    } as guildUser;

    this.users.set(robloxId, data);
    await this.save();

    const user = await this.getUser(robloxId);
    if (!user) throw new Error("Failed to add user to guild profile");

    return user;
}

guildProfileSchema.methods.getEventTypes = async function() {
    return this.schedule.types;
}

guildProfileSchema.methods.getEventType = async function(eventType: string) {
    let found = null;

    for (const [name, data] of this.schedule.types) {
        if (data.name.toLowerCase() === eventType.toLowerCase()) found = data;
    }

    return found;
}

guildProfileSchema.methods.deleteEventType = async function(eventType: string) {
    const checkName = client.Functions.ValidateString(eventType);
    if (!checkName) throw new Error("Invalid event type name");
    this.schedule.types.delete(eventType);
    await this.save();
}

guildProfileSchema.methods.addEventType = async function(eventType: ScheduleEventType) {
    const checkName = client.Functions.ValidateString(eventType.name, true);
    if (!checkName) throw new Error("Invalid event type name");
    this.schedule.types.set(eventType.name, eventType);
    await this.save();
}

guildProfileSchema.methods.editEventType = async function(eventType: string, newData: ScheduleEventType) {
    const checkName = client.Functions.ValidateString(newData.name);
    if (!checkName) throw new Error("Invalid event type name");
    this.schedule.types.set(eventType, newData);
    await this.save();
}

guildProfileSchema.methods.getOngoingEvents = async function() {
    let events = [] as ScheduleEvent[];

    for (const event of this.schedule.scheduled.values()) {
        if (event.ongoing) events.push(event);
    }

    return events;
}

guildProfileSchema.methods.startEvent = async function(eventId: string) {
    const event = this.schedule.scheduled.get(eventId);
    if (!event) throw new Error("Failed to find event in guild profile");
    if (event.ongoing) throw new Error("Event is already ongoing");

    event.ongoing = true;
    await this.save();

    const scheduleUpdates = await this.getChannel("scheduleupdates");
    if (!scheduleUpdates) return;

    const eventType = await this.getEventType(event.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");

    const baseEmbed = client.Functions.makeBaseEmbed({
        author: { name: this.guild.shortName, iconURL: eventType.icon },
        fields: [
            { name: "Time", value: `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
            { name: "Duration", value: `\`${event.duration}\` minutes`, inline: true },

            { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },

            { name: "Type", value: eventType.name || "(No type)", inline: true },
            { name: "Notes", value: event.notes !== "" ? `${event.notes}` : "(No notes)", inline: false },
        ],
        color: event.color,
        footer: { text: event.id }
    })

    try {
        await scheduleUpdates.send({ content: `A new event is starting!`, embeds: [baseEmbed] });
    } catch (error) {
        
    }
}

guildProfileSchema.methods.eventReminder = async function(eventId: string) {
    const event = this.schedule.scheduled.get(eventId);
    if (!event) throw new Error("Failed to find event in guild profile");

    const minutesLeft = Math.floor((event.time - Math.round(Date.now() / 1000)) / 60);

    const eventType = await this.getEventType(event.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");

    const baseEmbed = client.Functions.makeBaseEmbed({
        author: { name: this.guild.shortName, iconURL: eventType.icon },
        fields: [
            { name: "Time", value: `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
            { name: "Duration", value: `${event.duration} minutes`, inline: true },

            { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },

            { name: "Type", value: eventType.name || "(No type)", inline: true },
            { name: "Notes", value: event.notes !== "" ? `${event.notes}` : "(No notes)", inline: false },
        ],
        color: eventType.color,
        footer: { text: event.id }
    });

    const scheduleUpdates = await this.getChannel("scheduleupdates");
    if (scheduleUpdates) await scheduleUpdates.send({ content: `Head's up! An event is starting in ${minutesLeft} minutes!`, embeds: [baseEmbed] });

    const discordHostId = await client.Functions.ConvertRobloxIdtoDiscordId(event.host.id);
    if (!discordHostId) return;
    const discordHost = await client.Functions.GetUser(discordHostId);
    
    if (discordHost) discordHost.send({ content: `You have a scheduled event in ${minutesLeft} minutes!`, embeds: [baseEmbed] });
}

guildProfileSchema.methods.endEvent = async function(eventId: string) {
    const event = this.schedule.scheduled.get(eventId);
    if (!event) throw new Error("Failed to find event in guild profile");

    await this.removeScheduleEvent(eventId);
}

guildProfileSchema.methods.checkEventScheduleAvailability = async function(event: ScheduleEvent) {
    const eventType = await this.getEventType(event.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");

    if (event.notes && event.notes.length >= 1024) throw new Error("Event notes are too long");
    if (event.time < Date.now() / 1000) throw new Error("Event cannot be scheduled in the past");
    if (event.duration <= 0) throw new Error("Event duration is invalid");

    /*
    const scheduledEvents = await this.getScheduledEvents();
    if (scheduledEvents.length !== 0) {
        for (const existingEvent of scheduledEvents) {
            const existingEventEndTime = existingEvent.time + existingEvent.duration;
            const newEventEndTime = event.time + event.duration;

            if (existingEvent.time <= newEventEndTime && existingEventEndTime >= event.time) {
                throw new Error("Event overlaps with an existing event");
            }
        }
    }
    */

    return true;
}

guildProfileSchema.methods.addScheduleEvent = async function(event: ScheduleEvent) {
    const check = await this.checkEventScheduleAvailability(event);
    const eventType = await this.getEventType(event.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");
    if (!check) throw new Error("Failed to check event schedule availability");

    this.schedule.scheduled.set(event.id, event);
    await this.save();

    const scheduleUpdates = await this.getChannel("scheduleupdates");
    if (!scheduleUpdates) return;

    const baseEmbed = client.Functions.makeBaseEmbed({
        author: { name: this.guild.shortName, iconURL: eventType.icon },
        footer: { text: event.id },
        fields: [
            { name: "Time", value: `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
            { name: "Duration", value: `${event.duration} minutes`, inline: true },

            { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },

            { name: "Type", value: eventType.name || "(No type)", inline: true },
            { name: "Notes", value: event.notes !== "" ? `${event.notes}` : "(No notes)", inline: false },
        ],
        color: eventType.color,
    });

    try {
        await scheduleUpdates.send({ content: `A new event has been scheduled by [${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)!`, embeds: [baseEmbed] });
    } catch (error) {
        
    }
}

guildProfileSchema.methods.editScheduledEvent = async function(eventId: string, newData: ScheduleEvent, editedBy: number) {
    let robloxData = await client.wrapblox.fetchUser(editedBy);
    if (!robloxData) throw new Error("Failed to fecth user data from roblox");

    const event = this.schedule.scheduled.get(eventId);
    if (!event) throw new Error("Failed to find event in guild profile");

    if (event.ongoing) throw new Error("Cannot edit an ongoing event");

    event.host = event.host || {name : "", id : 0}; // Ensure host is defined

    const diff = {
        time: newData.time !== event.time,
        duration: newData.duration !== event.duration,
        type: newData.eventType !== event.eventType,
        notes: newData.notes !== event.notes
    };

    const diffFields = Object.entries(diff)
        .filter(([_, value]) => value)
        .map(([key]) => key);

    if (diffFields.length === 0) throw new Error("No changes detected");

    this.schedule.scheduled.set(eventId, newData);
    await this.save();

    const scheduleUpdates = await this.getChannel("scheduleupdates");
    if (!scheduleUpdates) return;

    const eventType = await this.getEventType(newData.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");

    const baseEmbed = client.Functions.makeBaseEmbed({
        description: `It has new ${diffFields.join(", ")}!`,
        author: { name: this.guild.shortName, iconURL: eventType.icon },
        fields: [
            { name: "Time", value: `<t:${newData.time}:F>\n<t:${newData.time}:R>`, inline: true },
            { name: "Duration", value: `${newData.duration} minutes`, inline: true },

            { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },
            { name: "Type", value: eventType.name || "(No type)", inline: true },

            { name: "Notes", value: newData.notes !== "" ? `${newData.notes}` : "(No notes)", inline: false },
        ],
        footer: { text: event.id },
        color: eventType.color,
    });

    await scheduleUpdates.send({ content: `An event has been edited by [${robloxData.name}](https://www.roblox.com/users/${robloxData.id}/profile)!`, embeds: [baseEmbed] });
}

guildProfileSchema.methods.cancelScheduledEvent = async function(eventId: string, cancelledBy: number) {
    let robloxData = await client.wrapblox.fetchUser(cancelledBy);
    if (!robloxData) throw new Error("Failed to fecth user data from roblox");

    const event = this.schedule.scheduled.get(eventId);
    if (!event) throw new Error("Failed to find event in guild profile");

    await this.removeScheduleEvent(eventId);

    const scheduleUpdates = await this.getChannel("scheduleupdates");
    if (!scheduleUpdates) return;

    const eventType = await this.getEventType(event.eventType);
    if (!eventType) throw new Error("Failed to find event type in guild profile");

    const baseEmbed = client.Functions.makeBaseEmbed({
        description: `The event has been cancelled!`,
        author: { name: this.guild.shortName, iconURL: eventType.icon },
        fields: [
            { name: "Time", value: `<t:${event.time}:F>\n<t:${event.time}:R>`, inline: true },
            { name: "Duration", value: `${event.duration} minutes`, inline: true },

            { name: "Host", value: `[${event.host.name}](https://www.roblox.com/users/${event.host.id}/profile)`, inline: false },

            { name: "Type", value: eventType.name || "(No type)", inline: true },
            { name: "Notes", value: event.notes !== "" ? `${event.notes}` : "(No notes)", inline: false },
        ],
        footer: { text: event.id },
        color: eventType.color,
    });

    await scheduleUpdates.send({ content: `An event has been cancelled by [${robloxData.name}](https://www.roblox.com/users/${robloxData.id}/profile)!`, embeds: [baseEmbed] });
}

guildProfileSchema.methods.removeScheduleEvent = async function(eventId: string) {
    this.schedule.scheduled.delete(eventId);
    await this.save();
}

guildProfileSchema.methods.getScheduledEvents = async function() {
    let events = [] as ScheduleEvent[];

    for (const [name, data] of this.schedule.scheduled) {
        events.push(data);
    }

    events.sort((a, b) => a.time - b.time);

    return events;
}

guildProfileSchema.methods.getScheduledEvent = async function(eventId: string) {
    return this.schedule.scheduled.get(eventId);
}

guildProfileSchema.methods.getScheduledEventsbyUser = async function(robloxId: string) {
    let events = [] as ScheduleEvent[];

    for (const [name, data] of this.schedule.scheduled) {
        if (data.host.id == robloxId) events.push(data);
    }

    events.sort((a, b) => a.time - b.time);

    return events;
}

guildProfileSchema.methods.getNextScheduledEvent = async function() {
    let nextEvent = null;

    for (const foundEvent of this.schedule.scheduled.values()) {
        if (!nextEvent || foundEvent.time < nextEvent.time) nextEvent = foundEvent;
    }

    return nextEvent;
}

guildProfileSchema.methods.setUserPoints = async function(robloxId:string, points:number) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("Failed to find user in guild profile");

    user.points = points;
    await this.save();

    return await this.getUser(robloxId);
}

guildProfileSchema.methods.incrementUserPoints = async function(robloxId:string, points:number) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("Failed to find user in guild profile");

    user.points += points;
    await this.save();

    return await this.getUser(robloxId);
}

guildProfileSchema.methods.setUserNote = async function(robloxId:string, note:string, visible:boolean) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("Failed to find user in guild profile");

    user.note.text = note;
    user.note.visible = visible;
    user.note.updatedAt = Date.now();
    await this.save();

    return await this.getUser(robloxId);
}

guildProfileSchema.methods.setUserRanklock = async function(robloxId:string, rank:number, shadow:boolean, reason:string) {
    const user = await this.getUser(robloxId);
    if (!user) throw new Error("Failed to find user in guild profile");

    user.ranklock.rank = rank;
    user.ranklock.shadow = shadow;
    user.ranklock.reason = reason;
    user.ranklock.updatedAt = new Date().getTime();

    await this.save();
}

guildProfileSchema.methods.calculateUserpendingPoints = async function(robloxId:string) {
    const allLogs = await this.getAllPointLogs();
    let pendingPoints = 0;
    
    for (const log of allLogs) {
        const entry = log.data.find((entry: { id: string; }) => entry.id === robloxId);
        if (!entry) continue;

        pendingPoints += entry.points;
    }

    return pendingPoints;
}

guildProfileSchema.methods.createPointLog = async function(log: PointLog) {
    this.pointlogs.set(log.id, log);
    await this.save();

    const logChannel = await this.getChannel("eventlogupdates");
    if (!logChannel) return;

    const baseEmbed = client.Functions.makeInfoEmbed({
        title: `\`${log.id}\``,
        description: `A new point log has been created by ${await client.wrapblox.fetchUser(Number.parseInt(log.creator)).then((user) => user.name)}`,
    })

    baseEmbed.addFields({ name: "Notes", value: (log.notes && log.notes.length > 0) ? `\`${log.notes}\`` : "(No notes)" });
    for (const user of log.data) {
        const field = baseEmbed.data.fields?.find((field) => field.name == `> ${user.points} points`);
        if (field) {
            field.value += `, ${user.name}`;
            if (field.value.length > 1024) field.value = field.value.slice(0, 1021) + "...";
            continue;
        }

        baseEmbed.addFields({ name: `> ${user.points} points`, value: `${user.name}` });

        if ((baseEmbed.data.fields?.length ?? 0) >= 23) {
            baseEmbed.addFields({ name: "Couldn't show full log", value: "Due to discord limits I couldn't show the rest of this log!" });
            break;
        }
    }
    const buttonEmbed = new ButtonEmbed(baseEmbed);

    const viewFulldata = buttonEmbed.addButton({
        label: "View Full Data",
        style: ButtonStyle.Primary,
        customId: `STATIC_POINTLOG_VIEWDATA_${log.id}`,

        function: async (Buttoninteraction) => {
        }
    })

    buttonEmbed.nextRow();

    const approveButton = buttonEmbed.addButton({
        label: "Approve",
        style: ButtonStyle.Success,
        customId: `STATIC_POINTLOG_APPROVE_${log.id}`,

        function: async (ButtonInteraction) => {

        }
    })

    const denyButton = buttonEmbed.addButton({
        label: "Deny",
        style: ButtonStyle.Danger,
        customId: `STATIC_POINTLOG_DENY_${log.id}`,

        function: async (ButtonInteraction) => {
            
        }
    })

    await logChannel.send(buttonEmbed.getMessageData());
}

guildProfileSchema.methods.removePointLog = async function(logId: string) {
    const log = await this.getPointLog(logId);
    if (!log) throw new Error("Failed to find log in guild profile");
    this.pointlogs.delete(logId);
    await this.save();
}

guildProfileSchema.methods.getPointLog = async function(logId: string) {
    const log = this.pointlogs.get(logId);
    if (log) return log;

    return undefined;
}

guildProfileSchema.methods.getAllPointLogs = async function() {
    let pointlogs = [] as PointLog[];

    for (const [name, data] of this.pointlogs) {
        pointlogs.push(data);
    }

    return pointlogs;
}

guildProfileSchema.methods.getUserPointLogs = async function(robloxId: string) {
    let pointlogs = [] as PointLog[];

    for (const [name, data] of this.pointlogs) {
        if (robloxId === data.creator) pointlogs.push(data);
    }

    return pointlogs;
}

guildProfileSchema.methods.approvePointLog = async function(logId: string) {
    const log = await this.getPointLog(logId);
    if (!log) throw new Error("Failed to find log in guild profile");

    for (const user of log.data) {
        const profile = await this.getUser(user.id);
        if (!profile) continue;

        profile.points += user.points;
    }

    await this.removePointLog(logId);
    await this.save();
}

guildProfileSchema.methods.editPointLog = async function(logId: string, newData: {
    id : string,
    name? : string,
    points : number,
}[]) {
    const log = await this.getPointLog(logId);
    if (!log) throw new Error("Failed to find log in guild profile");

    log.data = newData;
    await this.save();
}

guildProfileSchema.methods.denyPointLog = async function(logId: string) {
    const log = await this.getPointLog(logId);
    if (!log) throw new Error("Failed to find log in guild profile");

    await this.removePointLog(logId);
    await this.save();
}

guildProfileSchema.methods.setChannel = async function (channelType: string, channelId: string) {
    this.guild.channels.set(channelType, { name: channelType, id: channelId })
    
    await this.save()
}

guildProfileSchema.methods.getChannel = async function (channelType: string) {
    let channelId = this.guild.channels.get(channelType);
    if (!channelId) return;
    channelId = channelId.id;

    const channel = await client.Functions.GetChannel(channelId);
    if (!channel) return;

    return channel as TextChannel;
}

guildProfileSchema.methods.getPermission = async function(permission: string) {
    const perm = this.guild.permissions.get(permission);
    if (perm) return perm;

    this.guild.permissions.set(permission, { name: permission, roles: [], users: [] });
    await this.save();

    return this.guild.permissions.get(permission);
}

guildProfileSchema.methods.fetchGuild = async function() {
    const guild = await client.Functions.GetGuild(this.guild.id);
    if (!guild) return;

    return guild;
}

guildProfileSchema.methods.GetKey = async function(key: string) {
    for (const [name, data] of this.API.keys) {
        if (data.key === key) return data;
    }
}

guildProfileSchema.methods.robloxRequest = async function(placeName: string, TargetServerJobId: string, route: string, body?: any) {
    const place = this.roblox.places.get(placeName);
    if (!place) throw new Error("Failed to find place in guild profile");

    client.log(`Sending request to Roblox: ${place.id} ${TargetServerJobId} ${route} ${body}`);
    const universeId = await client.Functions.ConvertPlaceIDToUniverseID(place.id);
    const requestId = client.Functions.GenerateID();

    const messageJSON = {
        "TargetServerJobId": TargetServerJobId,
        "Route": route,
        "RequestId": requestId,
        "Body": body || {},
        "Sender": "Webserver"
    }

    client.log(universeId);

    try {
        await client.axios.request({
            method: 'POST',
            url: `https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/atlas`,
            data: {
                "message": JSON.stringify(messageJSON)
            },
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': client.Functions.Decrypt(place.key, this.iv)
            },
        })
    } catch (error) {
        if (!(error instanceof AxiosError)) return;

        client.error(`Failed to send request to Roblox: ${error.response?.status} ${error.response?.data}`);

        return null;
    }

    return new Promise(async (resolve, reject) => {
        const timeout = client.Functions.Sleep(15000)

        client.on("robloxReturn", async (req: express.Request, res: express.Response, guildProfile: guildProfileInterface) => {
            const body = req.body
            if (body.RequestId !== requestId) return;

            resolve({ req: req, res: res, guildProfile: guildProfile });
        });

        timeout.then(() => {
            reject("There was no response from in-game within 15 seconds");
        })
    });
}

guildProfileSchema.methods.linkRobloxGroup = async function(groupId: number) {
    this.roblox.groupId = groupId;
    await this.save();
}

guildProfileSchema.methods.getlinkedGuild = async function(alias: string) {
    let found = null;
    for (const [name, data] of this.linkedGuilds) {
        if (data.alias === alias) found = data;
    }

    return found;
}

const guildProfile = mongoose.model("guildProfile", guildProfileSchema);

export default guildProfile
export { guildProfileSchema, type guildProfileInterface, type guildUser, type PointLog, type ScheduleEvent, type ScheduleEventType, type APIKey };