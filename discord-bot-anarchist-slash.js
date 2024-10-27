// Import des modules
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const app = express();

// Initialisation du client
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
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    port: 3000,  // Port fixé directement ici
    pingInterval: 300000,
    welcomeChannel: process.env.WELCOME_CHANNEL,  // Nom ou ID du canal de bienvenue récupéré depuis .env
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

// Définition des commandes
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
        .setName('entraide')
        .setDescription('Système d\'entraide mutuelle')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type d\'entraide')
                .setRequired(true)
                .addChoices(
                    { name: 'Offrir', value: 'offre' },
                    { name: 'Demander', value: 'demande' }
                ))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description de l\'entraide')
                .setRequired(true))
];

// Déploiement des commandes
const rest = new REST({ version: '10' }).setToken(CONFIG.token);

(async () => {
    try {
        console.log('Déploiement des commandes slash...');
        await rest.put(
            Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
            { body: commands }
        );
        console.log('Commandes slash déployées avec succès!');
    } catch (error) {
        console.error(error);
    }
})();

// Message de bienvenue
client.on('guildMemberAdd', member => {
    const welcomeEmbed = new EmbedBuilder()
        .setColor(CONFIG.colors.black)
        .setTitle(`${CONFIG.emojis.anarchist} Bienvenue dans la Commune Libre!`)
        .setDescription(`
            **Salutations ${member.user.username}!**
            
            Tu viens de rejoindre un espace d'autogestion et de liberté.
            
            ${CONFIG.emojis.solidarity} **Notre Vision:**
            • Démocratie directe et participative
            • Entraide mutuelle et solidarité
            • Organisation horizontale
            • Action directe et autonomie
            
            ${CONFIG.emojis.revolution} **Participe à la vie collective:**
            • /assemblee - Pour créer une assemblée
            • /vote - Pour les décisions collectives
            • /entraide - Pour l'entraide mutuelle
            • /manifeste - Pour comprendre nos principes
        `)
        .setImage('https://wallpapercave.com/wp/3JChxzg.jpg')
        .setTimestamp()
        .setFooter({ text: 'No Gods, No Masters | Power to the People' });

    const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === CONFIG.welcomeChannel || ch.id === CONFIG.welcomeChannel);
    if (welcomeChannel) {
        welcomeChannel.send({ embeds: [welcomeEmbed] });
    } else {
        console.error("Le canal de bienvenue n'a pas été trouvé.");
    }
});

// Gestion des interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

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
            const duree = interaction.options.getString('duree');
            const voteEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.gold)
                .setTitle(`${CONFIG.emojis.vote} Vote Collectif`)
                .setDescription(`**Proposition:** ${proposition}\n**Durée:** ${duree} heures`)
                .setTimestamp();
            const voteMessage = await interaction.reply({ embeds: [voteEmbed], fetchReply: true });
            await voteMessage.react('✅');
            await voteMessage.react('❌');
            await voteMessage.react('⚪');
            setTimeout(async () => {
                const fetchedMessage = await interaction.channel.messages.fetch(voteMessage.id);
                const results = {
                    pour: fetchedMessage.reactions.cache.get('✅').count - 1,
                    contre: fetchedMessage.reactions.cache.get('❌').count - 1,
                    abstention: fetchedMessage.reactions.cache.get('⚪').count - 1
                };
                const resultsEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.gold)
                    .setTitle(`${CONFIG.emojis.vote} Résultats du Vote`)
                    .setDescription(`✅ Pour: ${results.pour}\n❌ Contre: ${results.contre}\n⚪ Abstention: ${results.abstention}`)
                    .setTimestamp();
                interaction.channel.send({ embeds: [resultsEmbed] });
            }, parseInt(duree) * 3600000);
            break;

        case 'entraide':
            const type = interaction.options.getString('type');
            const description = interaction.options.getString('description');
            const entraideEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.red)
                .setTitle(`${CONFIG.emojis.solidarity} Réseau d'Entraide Mutuelle`)
                .setDescription(`**Type:** ${type === 'offre' ? 'Offre d\'aide' : 'Demande d\'aide'}\n**Description:** ${description}`)
                .setTimestamp();
            const entraideMessage = await interaction.reply({ embeds: [entraideEmbed], fetchReply: true });
            await entraideMessage.react(CONFIG.emojis.solidarity);
            break;

        case 'manifeste':
            const manifesteEmbed = new EmbedBuilder()
                .setColor(CONFIG.colors.black)
                .setTitle(`${CONFIG.emojis.revolution} Manifeste de la Commune Numérique`)
                .setDescription(`**Nos Principes Fondamentaux**\n1. **Autogestion**\n2. **Solidarité**\n3. **Action Directe**\n4. **Paix et Liberté**`)
                .setTimestamp();
            await interaction.reply({ embeds: [manifesteEmbed] });
            break;
    }
});

// Système de ping pour vérifier l'activité du bot
setInterval(() => {
    console.log(`${CONFIG.emojis.anarchist} Bot actif - ${new Date().toLocaleString()}`);
}, CONFIG.pingInterval);

// Connexion du bot
client.login(CONFIG.token);

// Lancement d’un serveur web pour garder le bot actif sur le port défini
app.get('/', (req, res) => res.send('Bot actif'));
app.listen(CONFIG.port, () => console.log(`Serveur en écoute sur le port ${CONFIG.port}`));
