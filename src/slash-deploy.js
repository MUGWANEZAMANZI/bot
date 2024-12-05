const { REST, Routes } = require("discord.js");
require("dotenv").config({ path: '../.env' });


const botToken = process.env.BOT_TOKEN;
const botID = "1311367868494909613"; // Replace with your bot's client ID
const serverID = "1309117454747701299"; // Replace with your server ID

console.log('Bot token:', botToken);

const commands = [
    {
        name: "work",
        description: "Earn random coins (200-300).",
    },
    {
        name: "coins",
        description: "Check your total coins.",
    },
    {
        name: "give",
        description: "Give coins to another user.",
        options: [
            {
                name: "username",
                type: 6, // USER
                description: "User to give coins to.",
                required: true,
            },
            {
                name: "amount",
                type: 4, // INTEGER
                description: "Amount of coins to give.",
                required: true,
            },
        ],
    },
    {
        name: "add",
        description: "Add a user to the private channel.",
        options: [
            {
                name: "username",
                type: 6, // USER
                description: "User to add.",
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: "10" }).setToken(botToken);

(async () => {
    try {
        console.log("Registering slash commands...");
        await rest.put(Routes.applicationGuildCommands(botID, serverID), {
            body: commands,
        });
        console.log("Slash commands registered!");
    } catch (error) {
        console.error("Error registering slash commands:", error);
    }
})();
