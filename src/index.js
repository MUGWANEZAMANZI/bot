const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require("discord.js");
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
        console.error("Database Error:", err.message);
        process.exit(1);
    }
    console.log("Connected to SQLite database.");
});

// Create table if it doesn't exist
db.run(
    `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        coins INTEGER DEFAULT 0,
        last_work INTEGER DEFAULT 0
    )`,
    (err) => {
        if (err) {
            console.error("Error creating table:", err.message);
            process.exit(1);
        }
        console.log("Table 'users' is set up.");
    }
);

// Ready event
client.once("ready", () => {
    console.log(`🚀 Bot is online as ${client.user.tag}!`);
});

// Slash Command Handling
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user, options } = interaction;

    try {
        // Command: /add
        if (commandName === "add") {
            const targetUser = options.getUser("username");
            if (!targetUser) return interaction.reply("⚠️ Invalid user!");

            const member = await interaction.guild.members.fetch(user.id);
            const teamLeaderRole = interaction.guild.roles.cache.find(
                (role) => role.name === "Team Leader"
            );

            if (!teamLeaderRole || !member.roles.cache.has(teamLeaderRole.id)) {
                return interaction.reply("🚫 You must be a **Team Leader** to add members to a team.");
            }

            const channel = interaction.guild.channels.cache.get(interaction.channelId);
            await channel.permissionOverwrites.create(targetUser, {
                ViewChannel: true,
                SendMessages: true,
            });

            return interaction.reply(`✅ **${targetUser.username}** has been added to this team channel.`);
        }

        // Command: /create_team
        if (commandName === "create_team") {
            const teamName = options.getString("teamname");
            if (!teamName) return interaction.reply("⚠️ You must provide a team name.");

            const member = await interaction.guild.members.fetch(user.id);
            const teamLeaderRole = interaction.guild.roles.cache.find(
                (role) => role.name === "Team Leader"
            );

            if (!teamLeaderRole || !member.roles.cache.has(teamLeaderRole.id)) {
                return interaction.reply("🚫 You must be a **Team Leader** to create a team channel.");
            }

            const existingChannel = interaction.guild.channels.cache.find(
                (channel) => channel.name === teamName
            );

            if (existingChannel) {
                return interaction.reply(`⚠️ A channel named '**${teamName}**' already exists.`);
            }

            await interaction.guild.channels.create({
                name: teamName,
                type: 0, // Type 0 for text channels
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                    },
                ],
            });

            return interaction.reply(`✅ Team channel '**${teamName}**' has been created.`);
        }

        // Command: /work
        if (commandName === "work") {
            const randomCoins = Math.floor(Math.random() * 101) + 200; // Random between 200-300
            const userId = user.id;

            db.get("SELECT last_work FROM users WHERE id = ?", [userId], (err, row) => {
                if (err) {
                    console.error("Database Error (Work Command):", err.message);
                    return interaction.reply("⚠️ Failed to process your work request.");
                }

                const now = Date.now();
                const lastWork = row ? row.last_work : 0;

                if (now - lastWork < 3600000) { // 1 hour in milliseconds
                    const remainingTime = Math.ceil((3600000 - (now - lastWork)) / 60000); // Convert to minutes
                    return interaction.reply(`⏳ You can work again in **${remainingTime} minutes**.`);
                }

                db.run(
                    `INSERT INTO users (id, coins, last_work) 
                     VALUES (?, ?, ?) 
                     ON CONFLICT(id) DO UPDATE SET 
                     coins = coins + ?, 
                     last_work = ?`,
                    [userId, randomCoins, now, randomCoins, now],
                    (err) => {
                        if (err) {
                            console.error("Database Error (Work Command):", err.message);
                            return interaction.reply("⚠️ Failed to update your coins.");
                        }
                        interaction.reply(`💼 **Work Completed!** You earned **${randomCoins} coins** 🪙!`);
                    }
                );
            });
        }

        // Command: /coins
        if (commandName === "coins") {
            const userId = user.id;

            db.get("SELECT coins FROM users WHERE id = ?", [userId], (err, row) => {
                if (err) {
                    console.error("Database Error (Coins Command):", err.message);
                    return interaction.reply("⚠️ Failed to retrieve your coin balance.");
                }
                const coins = row ? row.coins : 0;
                interaction.reply(`💰 You have **${coins} coins** 🪙.`);
            });
        }

        // Command: /give
        if (commandName === "give") {
            const targetUser = options.getUser("username");
            const amount = options.getInteger("amount");

            if (!targetUser || !amount || amount <= 0) {
                return interaction.reply("⚠️ Invalid user or coin amount.");
            }

            const senderId = user.id;

            db.get("SELECT coins FROM users WHERE id = ?", [senderId], (err, row) => {
                if (err) {
                    console.error("Database Error (Give Command):", err.message);
                    return interaction.reply("⚠️ Failed to retrieve your coin balance.");
                }

                const senderCoins = row ? row.coins : 0;
                if (senderCoins < amount) {
                    return interaction.reply("🚫 You don't have enough coins to give.");
                }

                db.run(
                    "UPDATE users SET coins = coins - ? WHERE id = ?",
                    [amount, senderId],
                    (err) => {
                        if (err) {
                            console.error("Database Error (Give Command - Deduct):", err.message);
                            return interaction.reply("⚠️ Failed to update sender's coin balance.");
                        }

                        db.run(
                            `INSERT INTO users (id, coins) VALUES (?, ?) 
                            ON CONFLICT(id) DO UPDATE SET coins = coins + ?`,
                            [targetUser.id, amount, amount],
                            (err) => {
                                if (err) {
                                    console.error("Database Error (Give Command - Add):", err.message);
                                    return interaction.reply("⚠️ Failed to update recipient's coin balance.");
                                }
                                interaction.reply(
                                    `✅ You gave **${amount} coins** 🪙 to **${targetUser.username}**!`
                                );
                            }
                        );
                    }
                );
            });
        }
    } catch (error) {
        console.error("Command Error:", error);
        interaction.reply("❌ An unexpected error occurred.");
    }
});

// Prefix Command: !elected
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === "!elected") {
        try {
            const guild = message.guild;
            let teamLeaderRole = guild.roles.cache.find((role) => role.name === "Team Leader");

            if (!teamLeaderRole) {
                teamLeaderRole = await guild.roles.create({
                    name: "Team Leader",
                    color: "#0000FF",
                    permissions: [PermissionsBitField.Flags.ManageChannels],
                    reason: "Role required for team leaders",
                });
            }

            const member = await guild.members.fetch(message.author.id);
            if (member.roles.cache.has(teamLeaderRole.id)) {
                return message.reply("👑 You already have the **Team Leader** role.");
            }

            await member.roles.add(teamLeaderRole);
            message.reply("🎉 You have been elected as a **Team Leader**!");
        } catch (error) {
            console.error("Error in !elected command:", error.message);
            message.reply("⚠️ An error occurred while assigning the role.");
        }
    }
});

// Login the bot
client.login(process.env.BOT_TOKEN);
