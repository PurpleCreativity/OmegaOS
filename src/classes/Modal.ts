import { ActionRowBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import client from "../index.js";


export type ModalOptions = {
	Title : string;
	Inputs? : TextInputBuilder[];
	
}


export default class Modal {
	Modal : ModalBuilder;
	Rows : ActionRowBuilder<ModalActionRowComponentBuilder>[] = [];
	
	constructor(opts : ModalOptions) {
		this.Modal = new ModalBuilder().setTitle(opts.Title);
		this.Modal.setCustomId(client.Functions.GenerateID());
		if (opts.Inputs) {
			for (const input of opts.Inputs) {
				this.Rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
			}
		}
	}
	
	addInput(style : TextInputStyle, id : string, label : string, placeholder? : string, required = false) {
		const input = new TextInputBuilder().setStyle(style).setLabel(label).setCustomId(id).setRequired(required);
		if (placeholder) input.setPlaceholder(placeholder);
		this.Rows.push(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
	}
	
	getModal() {
		this.Modal.addComponents(this.Rows);
		return this.Modal;
	}
	
	
}