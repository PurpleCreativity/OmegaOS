import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, Interaction, SelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import client from "../index.js";

export type DropdownSelectorOptions = {
    Options: StringSelectMenuOptionBuilder[]

    Placeholder?: string

    MinValues?: number
    MaxValues?: number

    allowedUsers?: string[];
};

type InteractionReply = {
    content?: string
    embeds?: EmbedBuilder[]
    components?: any[]
    ephemeral?: boolean
}

export default class StringSelector {
    Selector: StringSelectMenuBuilder
    Options: StringSelectMenuOptionBuilder[] = []
    allowedUsers?: string[];

    constructor(opts: DropdownSelectorOptions) {
        this.Selector = new StringSelectMenuBuilder();
        this.Selector.setCustomId(client.Functions.GenerateID());
        
        if (opts.Placeholder) this.Selector.setPlaceholder(opts.Placeholder);
        if (opts.MinValues) this.Selector.setMinValues(opts.MinValues);
        if (opts.MaxValues) this.Selector.setMaxValues(opts.MaxValues);
        if (opts.allowedUsers) this.allowedUsers = opts.allowedUsers;

        for (const option of opts.Options) {
            this.Options.push(option);
        }
    }

    setOptions(options: StringSelectMenuOptionBuilder[]) {
        this.Options = options
    }

    async Prompt(interaction:ChatInputCommandInteraction | ButtonInteraction, messageData:InteractionReply): Promise<SelectMenuInteraction> {
        let components = [this.getSelector()]
        if (messageData.components) components = [...messageData.components, this.getSelector()]
        await interaction.reply({ content: messageData.content, embeds: messageData.embeds, components: components, ephemeral: messageData.ephemeral});

        return new Promise((resolve, reject) => {
			client.on("stringSelectMenuSubmit", async (newInteraction: Interaction) => {
                if (!newInteraction.isStringSelectMenu()) return;
                if (this.allowedUsers && this.allowedUsers.length > 0 && !this.allowedUsers.includes(newInteraction.user.id)) return;
				if (newInteraction.customId !== this.Selector.data.custom_id) return;
				resolve(newInteraction as SelectMenuInteraction);
			});
		});
    }

    getSelector() {
        this.Selector.setOptions(this.Options)
        
        return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(this.Selector);
    }

    getRawSelector() {
        this.Selector.setOptions(this.Options)
        return this.Selector;
    }
};