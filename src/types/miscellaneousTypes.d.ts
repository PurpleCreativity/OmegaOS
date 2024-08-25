import { EmbedAuthorData, EmbedAuthorOptions, EmbedField, EmbedFooterOptions } from "discord.js";

type EmbedOptions = {
	title?: string;
	description?: string;
    color?: any;
	url?: string;
    author?: EmbedAuthorOptions;
    footer?: EmbedFooterOptions;
    fields?: EmbedField[];
    thumbnail?: string;
    image?: string;
}

export type { EmbedOptions }