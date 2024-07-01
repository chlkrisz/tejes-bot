import 'dotenv/config';
import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import * as fs from 'node:fs';

const client = new Client({
    intents: [
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ]
});

const szavak = fs.readFileSync('./src/magyar-szavak.txt', 'utf8').split('\n');

const stripEmojisAndEmotes = (str: string) => 
    str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|:[A-Za-z]+:)/g, '')
       .replace(/\s+/g, ' ')
       .trim();

const containsEmojisOrEmotes = (str: string) =>
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|:[A-Za-z]+:)/g.test(str);

client.on('ready', (c) => {
    console.log(`Logged in as ${c.user.tag}!`);
});

const longLetters = ["cs", "dz", "gy", "ly", "sz", "ty", "zs", "ny"]; //ha valaki ír egy olyan szót, ami dzs-re végződik és értelmes azt megtapsolom

const szolancId = process.env.SZOLANCID!;
const szolancLogId = process.env.SZOLANCLOGID!;


client.on('messageCreate', async (msg) => {
    const logChannel = client.channels.cache.get(szolancLogId) as TextChannel;
    if (!logChannel?.isTextBased()) return;
    if (msg.channelId !== szolancId) return;
                       // Tatsu
    if (msg.author.id === "172002275412279296") deleteMessage(msg);
    if (msg.author.bot) return;

    const lastMessages = await msg.channel.messages.fetch({ limit: 2 });
    const lastMessageContent = stripEmojisAndEmotes(lastMessages.last()?.cleanContent?.toLowerCase() || '');
    
    const lastLetter = longLetter(lastMessageContent) 
        ? lastMessageContent.slice(-2)
        : lastMessageContent.slice(-1);
    
    const cleanContent = stripEmojisAndEmotes(msg.cleanContent.toLowerCase());
    
    if (!cleanContent && msg.deletable) {
        return deleteMessage(msg);
    }

    if (!exists(cleanContent)) {
        logChannel.send(
            `:exclamation: A(z) \`${cleanContent}\` szó nem található a magyar szótárban. [Ugrás az üzenethez](https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id})\n*Ez csak egy figyelmeztetés, a modok állapítsák meg, hogy értelmes szó-e, vagy spam.*`
        ).catch(console.error);
    }
    
    if (
        cleanContent.startsWith(lastLetter) && 
        !cleanContent.includes("http") && 
        !containsEmojisOrEmotes(cleanContent)
    ) return;

    if (msg.deletable) {
        setTimeout(()=>{
            deleteMessage(msg);
        },1000)
    }
});

const longLetter = (text: string) => longLetters.some(letter => text.endsWith(letter));

const exists = (text: string) => szavak.some(szo => text === szo.toLowerCase());

const deleteMessage = async (msg: any) => {
    try {
        await msg.delete();
    } catch (e) {
        console.error(e);
    }
}

client.login(process.env.TOKEN);
