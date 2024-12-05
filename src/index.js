const { Client, GatewayIntentBits, REST, Routes } = require("discord.js"); // Import REST and Routes
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config({path :"./.env"}); // Load environment variables

// Initialize bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages], // Update to GatewayIntentBits
});

const botToken = process.env.BOT_TOKEN; // Load bot token from .env file

// Database setup
const db = new sqlite3.Database("./coins.db", (err) => {
    if (err) return console.error("Database Error:", err);
    console.log("Connected to SQLite database.");
});

// Create table for storing coins
db.run(
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, coins INTEGER DEFAULT 0)`,
    (err) => {
        if (err) console.error(err);
    }
);

if (!botToken) {
    console.error("Error: Bot token is not defined. Check your .env file.");
    process.exit(1);
}

client.once("ready", () => {
    console.log("Bot is online!");
});

// Slash Command Handling
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, user, options } = interaction;

    // Command: /work (earn random coins)
    if (commandName === "work") {
        const earned = Math.floor(Math.random() * 101) + 200; // Random between 200-300 coins
        db.get("SELECT coins FROM users WHERE id = ?", [user.id], (err, row) => {
            if (err) return interaction.reply("Database error!");

            const currentCoins = row?.coins || 0;
            const newTotal = currentCoins + earned;

            db.run(
                `INSERT INTO users (id, coins) VALUES (?, ?) 
                ON CONFLICT(id) DO UPDATE SET coins = ?`,
                [user.id, earned, newTotal],
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
                        `INSERT INTO users (id, coins) VALUES (?, ?) 
                        ON CONFLICT(id) DO UPDATE SET coins = ?`,
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

        const channel = interaction.guild.channels.cache.get(interaction.channelId);
        channel.permissionOverwrites.create(targetUser, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
        });

        interaction.reply(`${targetUser.username} has been added to the channel.`);
    }
});

// Register Slash Commands
const rest = new REST({ version: '10' }).setToken(botToken);

const commands = [
    {
        name: 'work',
        description: 'Earn random coins between 200-300',
    },
    {
        name: 'coins',
        description: 'Check your total coins',
    },
    {
        name: 'give',
        description: 'Give coins to another user',
        options: [
            {
                name: 'username',
                type: 6, // User type
                description: 'The user to give coins to',
                required: true,
            },
            {
                name: 'amount',
                type: 4, // Integer type
                description: 'Amount of coins to give',
                required: true,
            }
        ]
    },
    {
        name: 'add',
        description: 'Add a user to your private channel',
        options: [
            {
                name: 'username',
                type: 6, // User type
                description: 'The user to add',
                required: true,
            }
        ]
    }
];

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationGuildCommands(process.env.BOT_ID, process.env.GUILD_ID), {
            body: commands,
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.login(botToken);
