const { REST, Routes } = require("discord.js");
require("dotenv").config({ path: "./.env" });

const botToken = process.env.BOT_TOKEN;
const botID = "1311367868494909613"; // Replace with your bot's client ID
const serverID = "1309117454747701299"; // Replace with your server ID

if (!botToken) {
    console.error("Error: BOT_TOKEN is not defined in the .env file.");
    process.exit(1);
}

const commands = [
    {
        name: "work",
        description: "Earn random coins every 2 hours (200-300).",
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
    {
        name: "create_team",
        description: "Create a team channel.",
        options: [
            {
                name: "teamname",
                type: 3, // STRING
                description: "The name of the team channel.",
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
        console.log("Slash commands registered successfully!");
    } catch (error) {
        console.error("Failed to register slash commands:", error.message);
        if (error.response) {
            console.error("Details:", error.response.data);
        }
    }
})();
