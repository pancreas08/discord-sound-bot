const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
});

async function playSoundRandom(guild) {
  const channels = guild.channels.cache.filter(ch => ch.type === 2);
  if (!channels.size) return;

  const channel = channels.random();

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource("sonido.mp3");
  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    connection.destroy();
  });
}

client.on("messageCreate", async msg => {
  if (msg.content === "!troll") {
    await playSoundRandom(msg.guild);
  }
});

client.login(process.env.TOKEN);
