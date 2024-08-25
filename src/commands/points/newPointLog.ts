import { ButtonStyle, Guild, TextInputBuilder, TextInputStyle } from "discord.js";
import ButtonEmbed from "../../classes/ButtonEmbed.js";
import Command from "../../classes/Command.js";
import client from "../../index.js";
import { PointLog } from "../../schemas/guildProfile.js";
import Modal from "../../classes/Modal.js";
import { MaterialEmojis, MaterialIcons } from "../../assets/materialIcons.js";

const newPointLog = new Command({
    name: "newlog",
    description: "Create a pointlog",
    dmpermission: false,
    permissions: [],
    userCooldown: 60000,
    customPermissions: ["CreatePointLogs"],

    execute: async (interaction) => {
        if (!interaction.guild) return;

        const guildDataProfile = await client.Database.GetGuildProfile(interaction.guild.id, false);
        const creatorRobloxId = await client.Functions.ConvertDiscordIdtoRobloxId(interaction.user.id);
        if (!creatorRobloxId) {
            return interaction.reply({ embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "You are not verified",
                        description: "You need to verify yourself to use this command"
                    })
                ]
            });
        }

        let currentlog = {
            data: [] as { points: number, id: string, name: string }[],
            notes: undefined as string | undefined,

            creator: creatorRobloxId.toString(),
            id: client.Functions.GenerateID(),
            createdAt: Date.now()
        } as PointLog;

        const infoEmbed = client.Functions.makeInfoEmbed({
            title: "Point Log Creator",
            description: "Use the buttons below to add or remove points from this log, or to add a note.",
            footer: { text: `${currentlog.id}` },
        })

        const buttonEmbed = new ButtonEmbed(infoEmbed)

        const formattedEmbed = async (pointLog: PointLog): Promise<ButtonEmbed> => {
            const creatorUsername = (await client.wrapblox.fetchUser(Number.parseInt(pointLog.creator))).name;

            const baseEmbed = client.Functions.makeInfoEmbed({
                title: `\`${pointLog.id}\``,
                description: `Created <t:${Math.round(pointLog.createdAt / 1000)}:R> by ${creatorUsername}`
            })

            baseEmbed.addFields({ name: "Notes", value: (pointLog.notes && pointLog.notes.length > 0) ? `\`${pointLog.notes}\`` : "(No notes)" });

            for (const user of pointLog.data) {
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

            return buttonEmbed;
        }

        const updateEmbed = async () => {
            infoEmbed.setFields([]);

            infoEmbed.addFields({ name: "Notes", value: (currentlog.notes && currentlog.notes.length > 0) ? `\`${currentlog.notes}\`` : "(No notes)" });

            for (const log of currentlog.data) {
                const field = infoEmbed.data.fields?.find((field) => field.name == `> ${log.points} points`);
                if (field) {
                    field.value += `, ${log.name}`;
                    if (field.value.length > 1024) field.value = field.value.slice(0, 1021) + "...";
                    continue;
                }

                infoEmbed.addFields({ name: `> ${log.points} points`, value: `${log.name}` });

                if ((infoEmbed.data.fields?.length ?? 0) >= 23) {
                    infoEmbed.addFields({ name: "Couldn't show full log", value: "Due to discord limits I couldn't show the rest of this log!" });
                    break;
                }
            }

            buttonEmbed.setEmbed(infoEmbed);
        }

        const addDataButton = buttonEmbed.addButton({
            label: "Add Data",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                const modal = new Modal({
                    Title: "Add Data",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("log")
                            .setLabel("Log")
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder("1 - user1\n2 - user2,user3\n3 - user4, user5")
                            .setRequired(true),
                    ]
                });

                const response = await client.Functions.PromptModal(Buttoninteraction, modal.getModal());
                const log = response.fields.getTextInputValue("log");
                const lines = log.split("\n");

                await response.deferUpdate();

                buttonEmbed.setEmbed(client.Functions.makeWarnEmbed({
                    title: "Point Log Creator",
                    description: `If your log contains a lot of data, it may take a while for me to process it, please wait...`,
                    thumbnail: MaterialIcons.omegareload
                }))

                buttonEmbed.disableButton(addDataButton);
                buttonEmbed.disableButton(setNoteButton);
                buttonEmbed.disableButton(saveLogButton);
                buttonEmbed.disableButton(cancelLogButton);
                buttonEmbed.disableButton(viewFullDataButton);

                await interaction.editReply(buttonEmbed.getMessageData());

                for (const line of lines) {
                    const [points, names] = line.split(" - ");
                    if (!points || !names) continue;

                    const actualPoints = Number.parseInt(points);
                    if (Number.isNaN(actualPoints)) continue;

                    const users = names.split(",");

                    for (let user of users) {
                        user = user.trim();
                        let actualUser;
                        try {
                            actualUser = await client.wrapblox.fetchUserByName(user);
                        } catch (error) {
                            
                        }
                        if (!actualUser) continue;

                        const found = currentlog.data.find((user) => user.id === actualUser.id.toString());
                        if (found) {

                            found.points += actualPoints;
                            if (found.points === 0) {
                                currentlog.data = currentlog.data.filter((log) => log.id !== actualUser.id);
                            }
                            continue;
                        }
                        if (actualPoints === 0) continue;

                        currentlog.data.push({ points: actualPoints, id: actualUser.id.toString(), name: actualUser.name });
                    }
                }

                await updateEmbed();

                buttonEmbed.enableButton(addDataButton);
                buttonEmbed.enableButton(setNoteButton);
                buttonEmbed.enableButton(saveLogButton);
                buttonEmbed.enableButton(cancelLogButton);
                buttonEmbed.enableButton(viewFullDataButton);

                interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        const setNoteButton = buttonEmbed.addButton({
            label: "Set Note",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                const modal = new Modal({
                    Title: "Add Note",
                    Inputs: [
                        new TextInputBuilder()
                            .setCustomId("note")
                            .setLabel("Note")
                            .setStyle(TextInputStyle.Paragraph)
                            .setMaxLength(1022)
                            .setPlaceholder("This is a note with a maximum length of 1022 characters.")
                            .setRequired(true),
                    ]
                });

                const response = await client.Functions.PromptModal(Buttoninteraction, modal.getModal());
                currentlog.notes = response.fields.getTextInputValue("note");

                await response.deferUpdate();

                await updateEmbed();
                interaction.editReply(buttonEmbed.getMessageData());
            }
        })

        buttonEmbed.nextRow();

        const viewFullDataButton = buttonEmbed.addButton({
            label: "View Full Data",
            style: ButtonStyle.Primary,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                const userText = currentlog.data.map(user => `${user.points} - ${user.name}`).join('\n');
                const userBuffer = Buffer.from(userText, 'utf-8');
                Buttoninteraction.reply({ content: "Full data:", files: [ { name: `fulldata_${currentlog.id}.txt`, attachment: userBuffer } ]});
            }
        });

        buttonEmbed.nextRow();

        const saveLogButton = buttonEmbed.addButton({
            label: "Save Log",
            style: ButtonStyle.Success,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                if (currentlog.data.length === 0) return await Buttoninteraction.reply({ ephemeral: true, embeds: [
                    client.Functions.makeErrorEmbed({
                        title: "Point Log Creator",
                        description: "You need to add at least one log to save this point log.",
                    })
                ]})

                await guildDataProfile.createPointLog(currentlog);

                await interaction.editReply({ embeds: [client.Functions.makeSuccessEmbed({
                    title: "Point Log Creator",
                    description: "Your point log has been saved.",
                    footer: { text: `${currentlog.id}` }
                })], components: [] });

                await Buttoninteraction.deferUpdate();
            }
        })

        const cancelLogButton = buttonEmbed.addButton({
            label: "Cancel",
            style: ButtonStyle.Danger,
            allowedUsers: [interaction.user.id],

            function: async (Buttoninteraction) => {
                await interaction.editReply({embeds: [client.Functions.makeWarnEmbed({
                    title: "Point Log Creator",
                    description: "Point log creation has been cancelled.",
                })], components: []});

                await Buttoninteraction.deferUpdate();
            }
        })

        await updateEmbed();
        interaction.reply(buttonEmbed.getMessageData());
    },
});

export default newPointLog;