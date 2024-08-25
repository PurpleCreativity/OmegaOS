import { APIButtonComponentWithCustomId, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import client from "../index.js";
import e from "express";

type Button = {
    label: string;
    style: ButtonStyle;
    disabled?: boolean;
    allowedUsers?: string[];
    link?: string;
	customId?: string;

    function?: (interaction: ButtonInteraction) => any | Promise<any>;
}

class ButtonEmbed {
    Embed: EmbedBuilder;
	Ephemeral: boolean = false;
    CurrentRow = 1;
    Rows: ButtonBuilder[][] = [];

    constructor(embed: EmbedBuilder, buttons? : Button[]) {
        this.Embed = embed;
        this.Rows[0] = [];

        if (buttons) this.setButtons(buttons);
    }

    getMessageData() {
		const components = [];
		for (let i = 0; i < this.Rows.length; i++) {
			if (this.Rows[i].length === 0) continue;
			components.push({
				type : ComponentType.ActionRow,
				components : this.Rows[i]
			})
		}
		
		return {
			ephemeral : this.Ephemeral,
			embeds : [this.Embed],
			components : components.length > 0 ? components : undefined,
		}
	}

    addButton(button: Button) {
        const id = button.customId || client.Functions.GenerateID();

        if (button.style === ButtonStyle.Link && button.link !== undefined) {
            this.Rows[this.CurrentRow - 1].push(new ButtonBuilder().setLabel(button.label).setStyle(button.style).setURL(button.link));
            return id;
        }

        this.Rows[this.CurrentRow - 1].push(new ButtonBuilder().setLabel(button.label).setStyle(button.style).setCustomId(id).setDisabled(button.disabled ?? false));

        if (button.function) {
            client.on("buttonPress", async (interaction: ButtonInteraction) => {
                if (!button.function) return;

                if (interaction.customId === id) {
					if (button.allowedUsers && button.allowedUsers.length > 0 && !button.allowedUsers.includes(interaction.user.id)) {
						await interaction.reply({ content: "You are not allowed to use this button", ephemeral: true });
						return;
					}

                    await button.function(interaction);
                }
            });
        }
        return id;
    }

    setButtons(buttons : Button[]) {
		if (this.Rows[this.CurrentRow - 1] === undefined) this.Rows[this.CurrentRow - 1] = [];
		for (let i = 0; i < buttons.length; i++) {
			this.addButton(buttons[i]);
		}
	}

    disableButton(id : string) {
		for (const row of this.Rows) {
			for (const button of row) {
				if (button.data.style === ButtonStyle.Link) continue;
				const real = button.data as APIButtonComponentWithCustomId;
				if (real.custom_id === id) {
					button.setDisabled(true);
				}
			}
		}
	}
	
	enableButton(id : string) {
		for (const row of this.Rows) {
			for (const button of row) {
				if (button.data.style === ButtonStyle.Link) continue;
				const real = button.data as APIButtonComponentWithCustomId;
				if (real.custom_id === id) {
					button.setDisabled(false);
				}
			}
		}
	}

	setEmbed(embed : EmbedBuilder) {
		this.Embed = embed;
	}

	setEphemeral(value: boolean) {
		this.Ephemeral = value;
	}

    nextRow() {
		this.CurrentRow++;
		this.Rows[this.CurrentRow - 1] = [];
	}
}

export default ButtonEmbed;