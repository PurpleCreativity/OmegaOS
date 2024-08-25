import type { configType } from "./types/conifgTypes.js"

import chalk from "chalk"

const config = {} as configType

config.version = "2.0.1"
config.ownerId = "762329291169857537"
config.devlist = ["762329291169857537"]
config.debugMode = true

config.branding = {
	name : "OmegaOS",
	iconURL : "https://cdn.discordapp.com/avatars/1190711305116590110/51560698a924233d84ea2e3403bf68c3.png?size=1024&format=webp&quality=lossless&width=0&height=256",
	baseURL : "https://omegaos-2b7738e5d423.herokuapp.com"
}

config.channels = {
	"errors": "1191070771792064553",
	"logs": "1191070781845799004",
	"status": "1191087978584473770",
	"api": "1270298307410788422"
}

config.appearance = {
    colors : {
        error: chalk.bold.red,
	    danger: chalk.bold.red,
	    warning: chalk.hex("#FFA500"),
	    success: chalk.bold.green,
	    fullSuccess: chalk.white.bgGreen.bold,
	    info: chalk.bold.blue,
	    verbose: chalk.bold.gray,
    }
}

config.port = process.env.PORT || 3003
config.logConfig = {
	error: {
		color: config.appearance.colors.error,
		name: "Error"
	},
	success: {
		color: config.appearance.colors.success,
		name: "Success"
	},
	info: {
		color: config.appearance.colors.info,
		name: "Info"
	},
	verbose: {
		color: config.appearance.colors.verbose,
		name: "Verbose"
	},
	warn: {
		color: config.appearance.colors.warning,
		name: "Warn"
	},

	deprecated: {
		color: config.appearance.colors.warning,
		name: "Deprecated"
	}
}

export default config