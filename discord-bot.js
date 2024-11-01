// Import des modules nécessaires et configuration du bot
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();

// Initialisation du client Discord avec les intents nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration avec les variables d'environnement
const CONFIG = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    colors: {
        black: '#000000',
        red: '#FF0000',
        gold: '#FFD700'
    },
    emojis: {
        anarchist: 'Ⓐ',
        solidarity: '✨',
        revolution: '⚔️',
        peace: '🕊️',
        vote: '📊',
        assembly: '🏛️'
    }
};

// Configuration du serveur Express pour le maintien en ligne
app.get('/', (req, res) => {
    res.send('Bot is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Fonction anti-veille pour garder le bot en ligne et reconnecter si déconnecté
function keepAlive() {
    setInterval(() => {
        if (client.ws.ping > 0) {
            console.log(`Bot actif - Ping: ${client.ws.ping}ms`);
        } else {
            console.log('Reconnexion...');
            client.login(CONFIG.token);
        }
    }, 300000); // Vérifie toutes les 5 minutes (300000ms)
}

// Définition des commandes Slash
const commands = [
    new SlashCommandBuilder()
        .setName('assemblee')
        .setDescription('Crée une nouvelle assemblée populaire')
        .addStringOption(option =>
            option.setName('sujet')
                .setDescription('Sujet de l\'assemblée')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Lance un vote collectif')
        .addStringOption(option =>
            option.setName('proposition')
                .setDescription('La proposition à voter')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duree')
                .setDescription('Durée du vote en heures')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('sondage')
        .setDescription('Crée un sondage participatif')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question du sondage')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Options séparées par des virgules')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('manifeste')
        .setDescription('Affiche le manifeste de notre communauté'),
    new SlashCommandBuilder()
        .setName('aide')
        .setDescription('Affiche toutes les commandes disponibles')
];

// Initialisation de l'API REST pour déployer les commandes slash
const rest = new REST({ version: '10' }).setToken(CONFIG.token);

(async () => {
    try {
        console.log('Déploiement des commandes slash...');
        await rest.put(
            Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
            { body: commands.map(command => command.toJSON()) }
        );
        console.log('Commandes slash déployées avec succès!');
    } catch (error) {
        console.error('Erreur lors du déploiement des commandes:', error);
    }
})();

// Gestion des interactions Slash Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Exécution des commandes en fonction de leur nom
    switch (interaction.commandName) {
        case 'assemblee':
            const sujet = interaction.options.getString('sujet');
            const assembleeEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.red)
                .setTitle(`${CONFIG.emojis.assembly} Nouvelle Assemblée Populaire`)
                .setDescription(`**Sujet:** ${sujet}\n${CONFIG.emojis.solidarity} Cette assemblée est un espace de discussion horizontale.`)
                .setTimestamp();
            await interaction.reply({ embeds: [assembleeEmbed] });
            break;

        case 'vote':
            const proposition = interaction.options.getString('proposition');
            const duree = parseInt(interaction.options.getString('duree')) * 3600000;
            const voteEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.red)
                .setTitle(`${CONFIG.emojis.vote} Vote Collectif`)
                .setDescription(`**Proposition:** ${proposition}\n**Durée:** ${duree / 3600000} heures`)
                .setTimestamp();
            const voteMessage = await interaction.reply({ embeds: [voteEmbed], fetchReply: true });
            await voteMessage.react('✅');
            await voteMessage.react('❌');
            await voteMessage.react('⚪');
            break;

        case 'sondage':
            const question = interaction.options.getString('question');
            const options = interaction.options.getString('options').split(',');
            const sondageEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.red)
                .setTitle(`${CONFIG.emojis.vote} Sondage Participatif`)
                .setDescription(`**Question:** ${question}\n**Options:**\n${options.map((option, index) => `**${index + 1}**. ${option.trim()}`).join('\n')}`)
                .setTimestamp();
            const sondageMessage = await interaction.reply({ embeds: [sondageEmbed], fetchReply: true });
            const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            for (let i = 0; i < options.length && i < 10; i++) {
                await sondageMessage.react(emojiNumbers[i]);
            }
            break;

        case 'manifeste':
            const manifesteEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.red)
                .setTitle(`${CONFIG.emojis.anarchist} Manifeste de notre Communauté Anarchiste`)
                .setDescription('Voici le manifeste de notre communauté...\n**Rejoignez-nous dans cette lutte pour la liberté et l\'égalité !**')
                .setTimestamp();
            await interaction.reply({ embeds: [manifesteEmbed] });
            break;

        case 'aide':
            const helpEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.gold)
                .setTitle('Liste des Commandes')
                .setDescription('Voici toutes les commandes disponibles dans ce bot :')
                .addFields(
                    { name: '/assemblee', value: 'Crée une nouvelle assemblée populaire' },
                    { name: '/vote', value: 'Lance un vote collectif' },
                    { name: '/sondage', value: 'Crée un sondage participatif' },
                    { name: '/manifeste', value: 'Affiche le manifeste de notre communauté' }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [helpEmbed] });
            break;

        default:
            await interaction.reply({ content: 'Commande inconnue.', ephemeral: true });
    }
});

// Connexion du client Discord et démarrage de la fonction anti-veille
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
    keepAlive(); // Démarre la fonction anti-veille pour maintenir le bot en ligne
});

client.login(CONFIG.token);
