const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");
const express = require('express');
const path = require('path'); // ⭐️ AGREGADO: Módulo para rutas absolutas

// ⭐️ ID DEL SERVIDOR: Lista de IDs para el Cron Job y el comando global
const GUILD_IDS_TO_TROL = ["461899811495477250", "939962120446017536"];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

// Función que entra y reproduce el sonido (con filtro de canales)
async function playSoundRandom(guild) {
    if (!guild) {
        console.log("Error: Gremio (Guild) no disponible.");
        return;
    }

    // NOMBRES DE LOS CANALES PERMITIDOS
    const allowedChannels = ['lol', 'GeneralVoz'];
    
    // ⭐️ FILTRAR canales de voz que están permitidos Y que tienen miembros
    const availableChannels = guild.channels.cache.filter(ch => 
        ch.type === 2 && 
        allowedChannels.includes(ch.name) && 
        ch.members.size > 0 
    );

    if (!availableChannels.size) {
        console.log(`[Troll Job] No hay usuarios conectados en los canales permitidos (${allowedChannels.join(', ')}) en ${guild.name}. Cancelando.`);
        return;
    }

    // Elegir un canal aleatorio solo de la lista de canales con gente
    const channel = availableChannels.random();

    try {
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });
        
        console.log(`[Troll Job] Conectado a canal: ${channel.name} en ${guild.name}`);

        const player = createAudioPlayer();
        
        // ⭐️⭐️ MODIFICADO: Uso de la ruta absoluta ⭐️⭐️
        const audioPath = path.join(__dirname, 'sonido.ogg'); 
        const resource = createAudioResource(audioPath); 

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`[Troll Job] Sonido terminado. Desconectando.`);
            connection.destroy();
        });
    } catch (error) {
        console.error(`[Troll Job] Error al conectar o reproducir: ${error.message}`);
    }
}

// ---------------------------------------------
// EVENTO PARA ESCUCHAR COMANDOS DE TEXTO (AHORA GLOBAL)
// ---------------------------------------------
client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!sonido') {
        console.log(`--- Comando !sonido recibido en ${message.guild.name} ---`);
        playSoundRandom(message.guild);
    }
});


client.once("ready", () => {
    console.log(`Bot listo como ${client.user.tag}`);
    
    // -----------------------------------------------------
    // TAREA AUTOMÁTICA (CRON JOB) - CADA 10 MINUTOS
    // -----------------------------------------------------
    const job = new CronJob(
        '*/1 * * * *', 
        () => {
            console.log('--- Iniciando Tarea Programada (10m) para MÚLTIPLES SERVIDORES ---');
            
            GUILD_IDS_TO_TROL.forEach(guildId => {
                const guild = client.guilds.cache.get(guildId);

                if (guild) {
                    playSoundRandom(guild);
                } else {
                    console.log(`Error: Servidor con ID ${guildId} no encontrado (El bot no está en él).`);
                }
            });
        },
        null, 
        true, 
        'Europe/Madrid' 
    );

    job.start();
    console.log(`Tarea automática de 10 minutos iniciada para ${GUILD_IDS_TO_TROL.length} servidores.`);
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