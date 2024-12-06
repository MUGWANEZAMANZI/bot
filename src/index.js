const { Client, GatewayIntentBits, Partials } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config({ path: "./.env" });

// Initialize bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

// Database setup
const db = new sqlite3.Database("./coins.db", (err) => {
    if (err) {
        console.error("Database Error:", err);
        process.exit(1);
    }
    console.log("Connected to SQLite database.");
});

// Create table with last_work column if it doesn't exist
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        coins INTEGER DEFAULT 0,
        last_work INTEGER DEFAULT 0
    )`,
    (err) => {
        if (err) {
            console.error("Error creating table:", err);
            process.exit(1);
        }
        console.log("Table 'users' is set up.");
    }
);

// Initialize bot
client.once("ready", () => {
    console.log("Bot is online!");
});

// Slash Command Handling
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user, options } = interaction;

    // Command: /add
    if (commandName === "add") {
        const targetUser = options.getUser("username");
        if (!targetUser) {
            return interaction.reply("Invalid user!");
        }

        const member = await interaction.guild.members.fetch(user.id);
        const teamLeaderRole = interaction.guild.roles.cache.find(
            (role) => role.name === "Team Leader"
        );

        if (!member.roles.cache.has(teamLeaderRole.id)) {
            return interaction.reply("You must be a Team Leader to add members to a team.");
        }

        const channel = interaction.guild.channels.cache.get(interaction.channelId);
        channel.permissionOverwrites.create(targetUser, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });

        interaction.reply(`${targetUser.username} has been added to this team channel.`);
    }

    // Command: /create_team
    else if (commandName === "create_team") {
        const teamName = options.getString("teamname");
        if (!teamName) {
            return interaction.reply("You must provide a team name.");
        }

        const member = await interaction.guild.members.fetch(user.id);
        const teamLeaderRole = interaction.guild.roles.cache.find(
            (role) => role.name === "Team Leader"
        );

        if (!member.roles.cache.has(teamLeaderRole.id)) {
            return interaction.reply("You must be a Team Leader to create a team channel.");
        }

        const existingChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name === teamName
        );

        if (existingChannel) {
            return interaction.reply(`A channel named '${teamName}' already exists.`);
        }

        await interaction.guild.channels.create(teamName, {
            type: "text",
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ["VIEW_CHANNEL"],
                },
                {
                    id: member.id,
                    allow: ["VIEW_CHANNEL", "SEND_MESSAGES"],
                },
            ],
        });

        interaction.reply(`Team channel '${teamName}' has been created.`);
    }
});

// Message Command: !elected
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "!elected") {
        const guild = message.guild;

        // Find or create the Team Leader role
        let teamLeaderRole = guild.roles.cache.find((role) => role.name === "Team Leader");

        if (!teamLeaderRole) {
            teamLeaderRole = await guild.roles.create({
                name: "Team Leader",
                color: "BLUE",
                permissions: ["MANAGE_CHANNELS"],
                reason: "Role required for team leaders",
            });
        }

        // Assign the role to the message sender
        const member = await guild.members.fetch(message.author.id);

        if (member.roles.cache.has(teamLeaderRole.id)) {
            return message.reply("You already have the Team Leader role.");
        }

        try {
            await member.roles.add(teamLeaderRole);
            message.reply("You have been elected as a Team Leader!");
        } catch (error) {
            console.error("Error assigning role:", error);
            message.reply("An error occurred while assigning the Team Leader role.");
        }
    }
});

// Login the bot
client.login(process.env.BOT_TOKEN);
