const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");

// ID DEL SERVIDOR ÚNICO donde quieres que se active el bot.
const GUILD_ID_TO_TROL = "461899811495477250"; 

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent] 
});

// Función que entra y reproduce el sonido
async function playSoundRandom(guild) {
  if (!guild) {
    console.log("Error: Gremio (Guild) no disponible.");
    return;
  }

  // Filtra solo los canales de voz (type === 2)
  const channels = guild.channels.cache.filter(ch => ch.type === 2); 
  if (!channels.size) {
    console.log(`[Troll Job] No se encontraron canales de voz en el servidor: ${guild.name}`);
    return;
  }

  const channel = channels.random(); // Elige un canal de voz aleatorio

  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    
    console.log(`[Troll Job] Conectado a canal: ${channel.name} en ${guild.name}`);

    const player = createAudioPlayer();
    const resource = createAudioResource("sonido.mp3");

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      console.log(`[Troll Job] Sonido terminado. Desconectando.`);
      connection.destroy(); // Se desconecta al terminar
    });
  } catch (error) {
    console.error(`[Troll Job] Error al conectar o reproducir: ${error.message}`);
  }
}

client.once("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
  
  // TAREA AUTOMÁTICA (CRON JOB)
  const job = new CronJob(
    '*/15 * * * *', // Ejecutar cada 15 minutos.
    () => {
      console.log('--- Iniciando Tarea Programada (15m) ---');
      const guild = client.guilds.cache.get(GUILD_ID_TO_TROL);
      if (guild) {
        playSoundRandom(guild);
      } else {
        console.log(`Error: Servidor con ID ${GUILD_ID_TO_TROL} no encontrado. Asegúrate de que el bot esté en ese servidor.`);
      }
    },
    null,
    true,
    'Europe/Madrid' // ⚠️ IMPORTANTE: Ajusta tu zona horaria si no es Madrid.
  );

  job.start();
  console.log('Tarea automática de 15 minutos iniciada.');
});

client.login(process.env.TOKEN);