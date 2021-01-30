const schedule = require("node-schedule");
const Discord = require("discord.js");
const config = require("config");
const {DateTime} = require("luxon");
const fs = require("fs");

const { getGuilds } = require("../guild/guildHandler");
const {getOffset, generateImage, getUrlId} = require("../rotation");

var updateRotationImagesTask;
var updateRotationMessagesTask;
var ruleImage;
var ruleMessage;

function scheduleUpdateTasks(bot) {
    ruleImage = new schedule.RecurrenceRule();
    ruleImage.minute = new schedule.Range(0, 59, 3);
    ruleImage.second = 0;

    //update rotation images
    updateRotationImagesTask = schedule.scheduleJob("update rotation images", ruleImage, async () => {
        updateRotationImages(bot);
        console.log("Update Rotation Image task");
    });

    ruleMessage = new schedule.RecurrenceRule();
    ruleMessage.second = new schedule.Range(0, 59, 10);

    updateRotationMessagesTask = schedule.scheduleJob("update rotation messages", ruleMessage, async () => {
        updateRotationMessages(bot);
        console.log("Update Rotation Message task");
    });
}

function updateSchedule() {
    const offset = getOffset();

    ruleImage.minute = new schedule.Range(offset.minutes, 59, 3);
    ruleImage.second = DateTime.fromObject({second: 0}).plus({seconds: offset.seconds}).second;

    updateRotationImagesTask.reschedule(ruleImage);

    ruleMessage.second = new schedule.Range(offset.seconds % 10, 59, 10);

    updateRotationMessagesTask.reschedule(ruleMessage);

}

async function updateRotationImages(bot) {
    await generateImage();

    const {urlID, prevUrlID} = getUrlId();

    getGuilds().forEach((value, key) => {
        try {
            value.rotationChannelData.forEach(async (e) => {

                const guild = await bot.guilds.fetch(value.guildId);
                const channel = guild.channels.resolve(e.channelId);

                const rotationImage = await channel.messages.fetch(e.rotationImageId);

                //update
                rotationImage.edit(`${config.get("server.baseUrl")}:${config.get("server.port")}/data/rotations${urlID}.png`);

            });
        } catch (err) {

        }
    });

    //Delete old image
    fs.unlink(`./data/rotations${prevUrlID}.png`, (err) => {

    });
}

async function updateRotationMessages(bot) {

    const difference = DateTime.fromISO(updateRotationImagesTask.nextInvocation().toISOString()).diffNow();

    getGuilds().forEach((value, key) => {
        try {
            value.rotationChannelData.forEach(async (e) => {

                const guild = await bot.guilds.fetch(value.guildId);
                const channel = guild.channels.resolve(e.channelId);

                const rotationMessage = await channel.messages.fetch(e.rotationMessageId);
                //update
                const embed = new Discord.MessageEmbed()
                    .setColor("#FCA311")
                    .setTitle("PVE Rotations")
                    .setDescription(`Next maps in: ${difference.toFormat("mm:ss")} min \n\nAW rotations by ${config.get("options.rotationSourceUrl")}`);

                rotationMessage.edit("", embed);

            });
        } catch (err) {

        }
    });
}

module.exports.scheduleUpdateTasks = scheduleUpdateTasks;
module.exports.updateSchedule = updateSchedule;