const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron"); // <-- NUEVO: Importamos CronJob

// Tu token está en Render, así que usamos process.env.TOKEN
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent] 
});

// Función que entra y reproduce el sonido (la misma que tenías)
async function playSoundRandom(guild) {
  // Solo se ejecuta si el bot está conectado a un servidor
  if (!guild) {
    console.log("Error: Gremio (Guild) no disponible.");
    return;
  }

  const channels = guild.channels.cache.filter(ch => ch.type === 2); // 2 = Voice Channel
  if (!channels.size) {
    console.log("No se encontraron canales de voz.");
    return;
  }

  const channel = channels.random(); // Elige un canal aleatorio

  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
    });
    
    console.log(`[Troll Job] Conectado a canal: ${channel.name} en ${guild.name}`);

    const player = createAudioPlayer();
    const resource = createAudioResource("sonido.mp3"); // TU ARCHIVO

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
  
  // -----------------------------------------------------
  // ⭐️ TAREA AUTOMÁTICA (CRON JOB)
  // -----------------------------------------------------
  // SINTAXIS CRON: * * * * *
  //                 | | | | |
  //                 | | | | DÍA DE LA SEMANA (0-7)
  //                 | | | MES (1-12)
  //                 | | DÍA DEL MES (1-31)
  //                 | HORA (0-23)
  //                 MINUTO (0-59)
  //
  // '*/15 * * * *' = Cada 15 minutos
  
  // IMPORTANTE: Debes cambiar 'TU_ID_DE_SERVIDOR' por el ID del servidor donde está el bot.
  // CLIC DERECHO EN EL NOMBRE DEL SERVIDOR -> Copiar ID.
  const GUILD_ID_TO_TROL = "TU_ID_DE_SERVIDOR"; 

  const job = new CronJob(
    '*/15 * * * *', // Ejecutar cada 15 minutos
    () => {
      console.log('--- Iniciando Tarea Programada (15m) ---');
      const guild = client.guilds.cache.get(GUILD_ID_TO_TROL);
      if (guild) {
        playSoundRandom(guild);
      } else {
        console.log(`Error: Servidor con ID ${GUILD_ID_TO_TROL} no encontrado.`);
      }
    },
    null, // onComplete function
    true, // start the job right now
    'Europe/Madrid' // Zona horaria: ¡Asegúrate de que sea tu zona horaria para que sea exacto!
  );

  job.start();
  console.log('Tarea automática de 15 minutos iniciada.');
});

client.login(process.env.TOKEN);