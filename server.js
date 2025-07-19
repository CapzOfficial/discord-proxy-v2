// Discord Proxy Server - Clean Version
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Discord config
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'MTM5NTk4NjA4NDQzNjkwNjAxNQ.G49ikE.bOynAZwJDM0A3nqz5GF43vZvTysajfIhZIlP-8';
const DISCORD_CHANNEL_ID = '1395980660908359820';

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({
        status: 'Discord Proxy Server Online',
        timestamp: new Date().toISOString(),
        endpoints: ['/health', '/api/discord-messages']
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        botToken: DISCORD_BOT_TOKEN ? 'Configured' : 'Missing'
    });
});

// Get Discord messages
app.get('/api/discord-messages', async (req, res) => {
    try {
        if (!DISCORD_BOT_TOKEN) {
            return res.status(500).json({
                success: false,
                error: 'Bot token not configured'
            });
        }

        const limit = req.query.limit || 20;
        const url = `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages?limit=${limit}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(500).json({
                success: false,
                error: `Discord API error: ${response.status}`,
                details: errorText
            });
        }

        const messages = await response.json();

        // Format messages
        const formattedMessages = messages
            .filter(msg => !msg.author.bot && msg.content.trim())
            .map(msg => ({
                id: msg.id,
                content: msg.content,
                author: msg.author.username || msg.author.global_name || 'Unknown',
                timestamp: msg.timestamp,
                type: 'discord'
            }));

        res.json({
            success: true,
            messages: formattedMessages,
            count: formattedMessages.length
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🔑 Bot token: ${DISCORD_BOT_TOKEN ? 'YES' : 'NO'}`);
});
