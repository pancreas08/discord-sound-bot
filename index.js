const { Client, GatewayIntentBits, getVoiceConnection } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { CronJob } = require("cron");
// Se mantiene limpio sin Express para Render:
// const express = require('express'); 

// ⭐️ ID DEL SERVIDOR: Lista de IDs para el Cron Job
const GUILD_IDS_TO_TROL = ["461899811495477250", "939962120446017536"];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        // Eliminamos MessageContent ya que no necesitamos el comando !sonido
    ]
});

// Función que entra y reproduce el sonido (con filtro de canales)
async function playSoundRandom(guild) {
    if (!guild) {
        console.log("Error: Gremio (Guild) no disponible.");
        return;
    }

    // NOMBRES DE LOS CANALES PERMITIDOS (los que mencionaste)
    const allowedChannels = ['lol', 'GeneralVoz'];
    
    // FILTRAR canales de voz que están permitidos Y que tienen miembros
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
        // Usamos "sonido.mp3"
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
// ❌ ELIMINAMOS TODA LA LÓGICA DE messageCreate ❌
/*
client.on('messageCreate', message => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() === '!sonido') {
        // ... (Código eliminado)
    }
});
*/


client.once("ready", () => {
    console.log(`Bot listo como ${client.user.tag}`);
    
    // -----------------------------------------------------
    // TAREA AUTOMÁTICA (CRON JOB) - CADA MINUTO
    // -----------------------------------------------------
    const job = new CronJob(
        '* * * * *', // ⭐️ ESTO SE EJECUTA CADA MINUTO ⭐️
        () => {
            console.log('--- Iniciando Tarea Programada (CADA MINUTO) para MÚLTIPLES SERVIDORES ---');
            
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
    console.log(`Tarea automática (cada minuto) iniciada para ${GUILD_IDS_TO_TROL.length} servidores.`);
});

client.login(process.env.TOKEN);