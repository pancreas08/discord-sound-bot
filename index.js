const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");
const express = require('express'); // ⭐️ NECESARIO para el servidor web de Render

// ID DEL SERVIDOR ÚNICO
const GUILD_ID_TO_TROL = "461899811495477250"; 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildVoiceStates, 
    GatewayIntentBits.MessageContent // ⭐️ NECESARIO para leer mensajes de texto
  ] 
});

// Función que entra y reproduce el sonido (MODIFICADA)
async function playSoundRandom(guild) {
    if (!guild) {
        console.log("Error: Gremio (Guild) no disponible.");
        return;
    }

    // ⭐️ NOMBRES DE LOS CANALES PERMITIDOS ⭐️
    const allowedChannels = ['lol', 'GeneralVoz'];
    
    // Filtrar canales de voz por tipo (2) Y por nombre
    const filteredChannels = guild.channels.cache.filter(ch => 
        ch.type === 2 && allowedChannels.includes(ch.name) // 2 = Voice Channel
    );

    if (!filteredChannels.size) {
        console.log(`[Troll Job] No se encontraron canales de voz permitidos (${allowedChannels.join(', ')}) en ${guild.name}.`);
        return;
    }

    // Elegir un canal aleatorio solo de la lista filtrada
    const channel = filteredChannels.random();

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

// ---------------------------------------------
// ⭐️ EVENTO PARA ESCUCHAR COMANDOS DE TEXTO
// ---------------------------------------------
client.on('messageCreate', message => {
  // Ignora mensajes de bots (incluyéndote a ti mismo)
  if (message.author.bot) return;

  // Verifica si el mensaje es el comando "!sonido" y es del servidor correcto
  if (message.content.toLowerCase() === '!sonido' && message.guild.id === GUILD_ID_TO_TROL) {
    console.log(`--- Comando !sonido recibido en ${message.guild.name} ---`);
    playSoundRandom(message.guild);
    // Opcional: Puedes enviar un mensaje de confirmación al canal de texto
    // message.reply('¡Ejecutando sonido ahora!');
  }
});


client.once("ready", () => {
  console.log(`Bot listo como ${client.user.tag}`);
  
  // -----------------------------------------------------
  // TAREA AUTOMÁTICA (CRON JOB)
  // -----------------------------------------------------
  const job = new CronJob(
    '* * * * *', // ⭐️ Ejecutar CADA MINUTO (a los 0 segundos de cada minuto)
    () => {
      console.log('--- Iniciando Tarea Programada (1m) ---');
      const guild = client.guilds.cache.get(GUILD_ID_TO_TROL);
      if (guild) {
        playSoundRandom(guild);
      } else {
        console.log(`Error: Servidor con ID ${GUILD_ID_TO_TROL} no encontrado.`);
      }
    },
    null, // onComplete function
    true, // start the job right now
    'Europe/Madrid' // Zona horaria
  );

  job.start();
  console.log('Tarea automática de 15 minutos iniciada.');
});

client.login(process.env.TOKEN);

// --- CÓDIGO PARA EVITAR QUE RENDER APAGUE EL BOT (EXPRESS SERVER) ---
const app = express();
const port = process.env.PORT || 3000; 

app.get('/', (req, res) => {
  res.send('Bot de sonido está activo y escuchando comandos.');
});

app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto ${port}`);
});
// ----------------------------------------------------