// bot.js
import { Client, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const QUOTE_CHANNEL_ID = '740216905125593148';

async function fetchAllMessages(channel) {
  let allMessages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    allMessages = allMessages.concat(Array.from(batch.values()));
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  return allMessages;
}

function filterMessages(messages, botUserId) {
  return messages.filter(msg => {
    const hasImageAttachment = msg.attachments.some(att =>
      att.contentType?.startsWith('image/')
    );
    const mentionsGrokAsUser = msg.mentions.users.has(botUserId);
    const mentionsGrokAsText = msg.content.toLowerCase().includes('@grok');
    const hasAt = msg.content.toLowerCase().includes("@");
    const isEmpty = !msg.content.trim(); // skip empty/attachment-only messages

    return !hasImageAttachment && !mentionsGrokAsUser && !mentionsGrokAsText && hasAt && !isEmpty;
  });
}

function getRandomQuote(messages) {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    const quoteChannel = await client.channels.fetch(QUOTE_CHANNEL_ID);
    const allMessages = await fetchAllMessages(quoteChannel);
    const validMessages = filterMessages(allMessages, client.user.id);

    if (validMessages.length === 0) {
      await message.channel.send("No quotes found!");
      return;
    }

    const quote = getRandomQuote(validMessages);
    await message.channel.send(`${quote.content.split("@")[0]}`);
  }
});

client.login(process.env.DISCORD_TOKEN);