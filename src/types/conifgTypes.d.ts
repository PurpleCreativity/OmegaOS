import { ChalkInstance } from "chalk"

type logConfig = {
	error: {
		color: configType.appearance.colors.error,
		name: string
	},
	success: {
		color: configType.appearance.colors.success,
		name: string
	},
	info: {
		color: configType.appearance.colors.info,
		name: string
	},
	verbose: {
		color: configType.appearance.colors.verbose,
		name: string
	},
	warn: {
		color: configType.appearance.colors.warning,
		name: string
	},
	deprecated: {
		color: configType.appearance.colors.warning,
		name: string
	}
}

type channels = {
	// Name of channel = ID of channel, gets processed on startup to client.AttachedChannels[channelName] = TextChannel
	errors: any,
	logs: any,
	status: any,
	api: any
}

type appearance = {
    colors : {
        error: ChalkInstance,
	    danger: ChalkInstance,
	    warning: ChalkInstance,
	    success: ChalkInstance,
	    fullSuccess: ChalkInstance,
	    info: ChalkInstance,
	    verbose: ChalkInstance,
    }
}

type branding = {
	name : string,
	iconURL : string,
	baseURL : string,
}

type configType = {
	version : string
    ownerId : string
    devlist : Array<string>
    debugMode : boolean

    appearance : appearance
	branding : branding
	port : any
    logConfig : logConfig
	channels : channels
}

export type { configType }