const { Client, GatewayIntentBits } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config({ path: "./.env" });

// Initialize bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Database setup
const db = new sqlite3.Database("./coins.db", (err) => {
    if (err) return console.error("Database Error:", err);
    console.log("Connected to SQLite database.");
});

// Create table with last_work column if it doesn't exist
db.run(
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, coins INTEGER DEFAULT 0, last_work INTEGER DEFAULT 0)`,
    (err) => {
        if (err) {
            console.error("Error creating table:", err);
            return;
        }
        console.log("Table users is set up with columns: id, coins, and last_work.");
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

    // Command: /work (earn random coins every 2 hours)
    if (commandName === "work") {
        db.get("SELECT coins, last_work FROM users WHERE id = ?", [user.id], (err, row) => {
            if (err) return interaction.reply("Database error!");

            const currentCoins = row?.coins || 0;
            const lastWorked = row?.last_work || 0;
            const now = Date.now();

            const cooldown = 2 * 60 * 60 * 1000; // 2 hours cooldown
            const timeRemaining = cooldown - (now - lastWorked);
            
            if (timeRemaining > 0) {
                const hours = Math.floor(timeRemaining / 3600000);
                const minutes = Math.floor((timeRemaining % 3600000) / 60000);
                return interaction.reply(`You need to wait ${hours} hours and ${minutes} minutes to work again.`);
            }

            const earned = Math.floor(Math.random() * 101) + 200; // Random between 200-300 coins
            const newTotal = currentCoins + earned;

            db.run(
                `INSERT INTO users (id, coins, last_work) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET coins = ?, last_work = ?`,
                [user.id, earned, now, newTotal, now],
                (err) => {
                    if (err) return interaction.reply("Database error!");
                    interaction.reply(`You earned ${earned} coins! Total: ${newTotal} coins.`);
                }
            );
        });
    }

    // Command: /coins (check coins)
    else if (commandName === "coins") {
        db.get("SELECT coins FROM users WHERE id = ?", [user.id], (err, row) => {
            if (err) return interaction.reply("Database error!");
            const totalCoins = row?.coins || 0;
            interaction.reply(`You have ${totalCoins} coins.`);
        });
    }

    // Command: /give (transfer coins)
    else if (commandName === "give") {
        const targetUser = options.getUser("username");
        const amount = options.getInteger("amount");
        if (!targetUser || amount <= 0) {
            return interaction.reply("Invalid user or amount!");
        }
        db.serialize(() => {
            db.get("SELECT coins FROM users WHERE id = ?", [user.id], (err, row) => {
                if (err) return interaction.reply("Database error!");
                const senderCoins = row?.coins || 0;
                if (senderCoins < amount) {
                    return interaction.reply("You don't have enough coins!");
                }
                const senderNewCoins = senderCoins - amount;
                db.run("UPDATE users SET coins = ? WHERE id = ?", [senderNewCoins, user.id]);
                db.get("SELECT coins FROM users WHERE id = ?", [targetUser.id], (err, row) => {
                    const receiverCoins = row?.coins || 0;
                    const receiverNewCoins = receiverCoins + amount;
                    db.run(
                        `INSERT INTO users (id, coins) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET coins = ?`,
                        [targetUser.id, receiverCoins, receiverNewCoins],
                        (err) => {
                            if (err) return interaction.reply("Database error!");
                            interaction.reply(
                                `You gave ${amount} coins to ${targetUser.username}.`
                            );
                        }
                    );
                });
            });
        });
    }

    // Command: /add (add user to private channel)
    else if (commandName === "add") {
        const targetUser = options.getUser("username");
        if (!targetUser) {
            return interaction.reply("Invalid user!");
        }

        // Check if user is a team leader
        const teamLeaderRole = interaction.guild.roles.cache.find(
            (role) => role.name === "Team Leader"
        );

        const member = await interaction.guild.members.fetch(user.id);
        if (!member.roles.cache.has(teamLeaderRole.id)) {
            return interaction.reply("You must be a Team Leader to add users to the team.");
        }

        // Add the user to the private channel
        const channel = interaction.guild.channels.cache.get(interaction.channelId);
        channel.permissionOverwrites.create(targetUser, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });

        interaction.reply(`${targetUser.username} has been added to the channel.`);
    }

    // Command: /create_team (create a new text channel)
    else if (commandName === "create_team") {
        const teamName = options.getString("teamname");

        // Check if user is a team leader
        const teamLeaderRole = interaction.guild.roles.cache.find(
            (role) => role.name === "Team Leader"
        );

        const member = await interaction.guild.members.fetch(user.id);
        if (!member.roles.cache.has(teamLeaderRole.id)) {
            return interaction.reply("You must be a Team Leader to create a team channel.");
        }

        // Create the new channel
        await interaction.guild.channels.create(teamName, {
            type: "text",
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ["VIEW_CHANNEL"],
                },
            ],
        });

        interaction.reply(`Team channel '${teamName}' created.`);
    }
});

client.login(process.env.BOT_TOKEN);
