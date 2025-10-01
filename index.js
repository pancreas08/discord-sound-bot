const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");

// Lista de los IDs de los servidores donde el bot debe hacer el "trolleo"
const GUILD_IDS_TO_TROL = [
  "461899811495477250", 
  "939962120446017536"
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent] 
});

// Función que entra y reproduce el sonido
async function playSoundRandom(guild) {
  if (!guild) {
    console.log("Error: Gremio (Guild) no disponible.");
    return;
  }

  const channels = guild.channels.cache.filter(ch => ch.type === 2); // 2 = Voice Channel
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
      console.log(`[Troll Job] Sonido terminado en ${guild.name}. Desconectando.`);
      connection.destroy(); // Se desconecta al terminar
    });
  } catch (error) {
    console.error(`[Troll Job] Error al conectar o reproducir en ${guild.name}: ${error.message}`);
  }
}

client.once("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
  
  // TAREA AUTOMÁTICA (CRON JOB)
  const job = new CronJob(
    '*/15 * * * *', // Ejecutar a los 0, 15, 30 y 45 minutos de cada hora.
    () => {
      console.log('--- Iniciando Tarea Programada (15m) para múltiples servidores ---');
      
      // Itera sobre la lista de IDs de servidores
      GUILD_IDS_TO_TROL.forEach(guildId => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
          playSoundRandom(guild); // Llama a la función para cada servidor
        } else {
          console.log(`Error: Servidor con ID ${guildId} no encontrado. Asegúrate de que el bot esté en ese servidor.`);
        }
      });
    },
    null,
    true,
    'Europe/Madrid' // ⚠️ IMPORTANTE: Ajusta tu zona horaria si no es Madrid.
  );

  job.start();
  console.log('Tarea automática de 15 minutos iniciada.');
});

client.login(process.env.TOKEN);