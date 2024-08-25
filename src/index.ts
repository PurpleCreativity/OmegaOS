import { GatewayIntentBits } from "discord.js";
import OmegaClient from "./classes/OmegaClient.js";

const client = new OmegaClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessages,
	],
});

client.Startup()

if (client.Started) {
    const MB = 1024 * 1024;
const TOTAL_MEMORY_MB = Number.parseInt(process.env.TOTAL_MEMORY_MB || '512', 10); // Default to 512MB if not specified
const getMemoryUsageStats = () => {
    const used = process.memoryUsage().heapUsed / MB;
    const total = process.memoryUsage().heapTotal / MB;
    return {
        used: Math.round(used),
        total: Math.round(total),
        percentage: Math.round((used / TOTAL_MEMORY_MB) * 100)
    };
};

setInterval(async () => {
    try {
        const { used, percentage } = getMemoryUsageStats();
        client.MemoryUsage.push(used);
        if (percentage > 80) {
            client.warn(`Memory usage is high: ${used}MB (${percentage}%)`);
        } else {
            client.log(`Memory usage: ${used}MB (${percentage}%)`);
        }
    } catch (error) {
        client.error(`Error monitoring memory usage: ${error}`);
    }
}, 1000 * 10);
}

export default client;