const { Client, GatewayIntentBits, getVoiceConnection } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");
const express = require('express');

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
        ch.type === 2 && // Debe ser un canal de voz
        allowedChannels.includes(ch.name) && // Debe estar en la lista permitida
        ch.members.size > 0 // SOLO SI TIENE MIEMBROS CONECTADOS
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
        // ⭐️ Usamos "sonido.mp3" con la ruta relativa ⭐️
        const resource = createAudioResource("sonido.mp3"); 

        // Listener para detectar fallos del AudioPlayer
        player.on('error', (error) => {
            console.error(`[Troll Job] Error del AudioPlayer (FALLO DE REPRODUCCIÓN): ${error.message}`);
            connection.destroy(); 
        });

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            console.log(`[Troll Job] Sonido terminado. Desconectando.`);
            connection.destroy(); // Se desconecta al terminar
        });
    } catch (error) {
        // Manejo de errores críticos de conexión
        console.error(`[Troll Job] Error CRÍTICO de Conexión: ${error.message}.`);
        // Intentar desconectar si hay una conexión parcial para limpiar el estado.
        try {
            const existingConnection = getVoiceConnection(guild.id);
            if (existingConnection) {
                existingConnection.destroy();
            }
        } catch (disconnectError) {
            // Ignorar errores al intentar desconectar
        }
    }
}

// ---------------------------------------------
// EVENTO PARA ESCUCHAR COMANDOS DE TEXTO
// ---------------------------------------------
client.on('messageCreate', message => {
    // Ignora mensajes de bots
    if (message.author.bot) return;

    // Se ejecuta si es "!sonido" en CUALQUIER servidor
    if (message.content.toLowerCase() === '!sonido') {
        console.log(`--- Comando !sonido recibido en ${message.guild.name} ---`);
        playSoundRandom(message.guild); // Le pasamos el objeto del servidor
    }
});


client.once("ready", () => {
    console.log(`Bot listo como ${client.user.tag}`);
    
    // -----------------------------------------------------
    // TAREA AUTOMÁTICA (CRON JOB) - CADA 10 MINUTOS
    // -----------------------------------------------------
    const job = new CronJob(
        '*/10 * * * *', // Ejecutar CADA 10 MINUTOS
        () => {
            console.log('--- Iniciando Tarea Programada (10m) para MÚLTIPLES SERVIDORES ---');
            
            // Itera sobre la lista de IDs de servidores
            GUILD_IDS_TO_TROL.forEach(guildId => {
                const guild = client.guilds.cache.get(guildId);

                if (guild) {
                    playSoundRandom(guild);
                } else {
                    console.log(`Error: Servidor con ID ${guildId} no encontrado.`);
                }
            });
        },
        null, // onComplete function
        true, // start the job right now
        'Europe/Madrid' // Zona horaria
    );

    job.start();
    console.log(`Tarea automática de 10 minutos iniciada para ${GUILD_IDS_TO_TROL.length} servidores.`);
});

client.login(process.env.TOKEN);

// --- CÓDIGO CRUCIAL PARA REPLIT: EXPRESS SERVER ---
// Esto mantiene el bot "despierto" 24/7 cuando UptimeRobot lo visita.
const app = express();
const port = 3000; // Usamos el puerto 3000 estándar para Replit/Node

app.get('/', (req, res) => {
    // Respuesta para UptimeRobot
    res.send('Bot de sonido está activo y escuchando comandos.');
});

app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});