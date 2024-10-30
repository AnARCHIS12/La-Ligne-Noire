// Import des modules nécessaires
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

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
    maxRetries: 3, // Nombre maximum de tentatives de reconnexion
    retryDelay: 60000, // Délai entre les tentatives (1 minute)
    welcomeChannel: process.env.WELCOME_CHANNEL,
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

// Définition des commandes Slash avec les nouvelles fonctionnalités
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
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('rappel')
        .setDescription('Programmer un rappel')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message de rappel')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('delai')
                .setDescription('Délai en minutes avant le rappel')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('aide')
        .setDescription('Affiche toutes les commandes disponibles')
];

const rest = new REST({ version: '10' }).setToken(CONFIG.token);

// Déploiement des commandes slash
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

            // Intervalle pour mise à jour des résultats
            const updateInterval = setInterval(async () => {
                const updatedMessage = await interaction.channel.messages.fetch(voteMessage.id);
                const results = {
                    pour: updatedMessage.reactions.cache.get('✅')?.count - 1 || 0,
                    contre: updatedMessage.reactions.cache.get('❌')?.count - 1 || 0,
                    abstention: updatedMessage.reactions.cache.get('⚪')?.count - 1 || 0
                };
                const resultsEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.red)
                    .setTitle(`${CONFIG.emojis.vote} Mise à jour du Vote`)
                    .setDescription(`✅ Pour: ${results.pour}\n❌ Contre: ${results.contre}\n⚪ Abstention: ${results.abstention}`)
                    .setTimestamp();
                await interaction.followUp({ embeds: [resultsEmbed] });
            }, 60000); // Mise à jour toutes les minutes

            setTimeout(() => {
                clearInterval(updateInterval);
                const finalEmbed = new EmbedBuilder()
                    .setColor(CONFIG.colors.red)
                    .setTitle(`${CONFIG.emojis.vote} Résultats du Vote Final`)
                    .setDescription(`✅ Pour: ${results.pour}\n❌ Contre: ${results.contre}\n⚪ Abstention: ${results.abstention}`)
                    .setTimestamp();
                interaction.channel.send({ embeds: [finalEmbed] });
            }, duree);
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

        case 'rappel':
            const rappelMessage = interaction.options.getString('message');
            const delai = interaction.options.getInteger('delai') * 60000;
            await interaction.reply(`Rappel programmé dans ${delai / 60000} minutes : "${rappelMessage}"`);
            setTimeout(() => {
                interaction.followUp(`${interaction.user}, voici votre rappel : ${rappelMessage}`);
            }, delai);
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
                    { name: '/manifeste', value: 'Affiche le manifeste de notre communauté' },
                    { name: '/entraide', value: 'Système d\'entraide mutuelle' },
                    { name: '/rappel', value: 'Programme un rappel personnel' }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [helpEmbed] });
            break;

        default:
            await interaction.reply({ content: 'Commande inconnue.', ephemeral: true });
    }
});

// Connexion du client Discord
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.login(CONFIG.token);

