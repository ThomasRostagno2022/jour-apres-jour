const ACTIVITY_TYPES = {
    CONVERSATION: 'conversation',
    SYNONYMS: 'synonyms',
    ANTONYMS: 'antonyms',
    SENTENCE_BUILDING: 'sentence_building',
    DESCRIBE_SCENE: 'describe_scene',
    FILL_BLANK: 'fill_blank'
};

const ACTIVITIES = [
    // ============================
    // CONVERSATION - Vie Personnelle
    // ============================
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Parle-moi de ta famille. Qui sont les personnes les plus importantes pour toi ?',
        hint: 'Tell me about your family. Who are the most important people to you?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'D\u00e9cris ton/ta meilleur(e) ami(e). Pourquoi cette personne compte autant pour toi ?',
        hint: 'Describe your best friend. Why does this person matter so much to you?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Quel est ton plus beau souvenir d\u2019enfance ?',
        hint: 'What is your most beautiful childhood memory?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Si tu pouvais changer une chose dans ta vie, qu\u2019est-ce que ce serait ?',
        hint: 'If you could change one thing in your life, what would it be?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Raconte-moi un moment o\u00f9 tu as \u00e9t\u00e9 vraiment fi\u00e8re de toi.',
        hint: 'Tell me about a moment when you were really proud of yourself.',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Qu\u2019est-ce qui te rend heureuse au quotidien ?',
        hint: 'What makes you happy on a daily basis?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'D\u00e9cris l\u2019endroit o\u00f9 tu as grandi. Qu\u2019est-ce que tu aimais l\u00e0-bas ?',
        hint: 'Describe the place where you grew up. What did you love about it?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Quelle le\u00e7on importante as-tu apprise r\u00e9cemment ?',
        hint: 'What important lesson have you learned recently?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Parle-moi d\u2019une personne qui t\u2019inspire. Pourquoi ?',
        hint: 'Tell me about a person who inspires you. Why?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Personnelle',
        prompt: 'Qu\u2019est-ce que tu aimerais accomplir dans les cinq prochaines ann\u00e9es ?',
        hint: 'What would you like to accomplish in the next five years?',
        targetWords: 40,
        targetTime: 60
    },

    // ============================
    // CONVERSATION - Vie Quotidienne
    // ============================
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'D\u00e9cris ta routine du matin. Que fais-tu en premier ?',
        hint: 'Describe your morning routine. What do you do first?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Qu\u2019est-ce que tu as fait ce week-end ?',
        hint: 'What did you do this weekend?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Quel est ton plat pr\u00e9f\u00e9r\u00e9 \u00e0 cuisiner ? Explique la recette.',
        hint: 'What is your favorite dish to cook? Explain the recipe.',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Comment est ta journ\u00e9e typique au travail ?',
        hint: 'What does a typical day at work look like for you?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'D\u00e9cris ton quartier. Qu\u2019est-ce que tu aimes et n\u2019aimes pas ?',
        hint: 'Describe your neighborhood. What do you like and dislike?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Qu\u2019est-ce que tu fais pour te d\u00e9tendre apr\u00e8s une longue journ\u00e9e ?',
        hint: 'What do you do to relax after a long day?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Raconte ta derni\u00e8re sortie au restaurant. Qu\u2019as-tu command\u00e9 ?',
        hint: 'Tell me about your last time eating out. What did you order?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Quel temps fait-il aujourd\u2019hui ? Comment le temps affecte-t-il ton humeur ?',
        hint: 'What is the weather like today? How does the weather affect your mood?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'D\u00e9cris les derni\u00e8res courses que tu as faites. Qu\u2019as-tu achet\u00e9 ?',
        hint: 'Describe your last grocery shopping trip. What did you buy?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Vie Quotidienne',
        prompt: 'Quelle s\u00e9rie ou quel film regardes-tu en ce moment ? Pourquoi ?',
        hint: 'What show or movie are you watching right now? Why?',
        targetWords: 35,
        targetTime: 60
    },

    // ============================
    // CONVERSATION - Cr\u00e9atif & Fun
    // ============================
    {
        type: 'conversation',
        category: 'Imaginaire',
        prompt: 'Si tu pouvais vivre dans n\u2019importe quel pays, lequel choisirais-tu et pourquoi ?',
        hint: 'If you could live in any country, which would you choose and why?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Imaginaire',
        prompt: 'D\u00e9cris ton restaurant id\u00e9al : la d\u00e9coration, le menu, l\u2019ambiance.',
        hint: 'Describe your ideal restaurant: the decor, the menu, the atmosphere.',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Imaginaire',
        prompt: 'Si tu gagnais au loto demain, que ferais-tu en premier ?',
        hint: 'If you won the lottery tomorrow, what would you do first?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Imaginaire',
        prompt: 'Tu peux d\u00eener avec n\u2019importe quelle personne, vivante ou morte. Qui choisis-tu et pourquoi ?',
        hint: 'You can have dinner with anyone, alive or dead. Who do you choose and why?',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Imaginaire',
        prompt: 'Si tu pouvais avoir un superpouvoir, lequel choisirais-tu ?',
        hint: 'If you could have a superpower, which one would you choose?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Opinions',
        prompt: 'Qu\u2019est-ce que tu penses des r\u00e9seaux sociaux ? Sont-ils utiles ou dangereux ?',
        hint: 'What do you think about social media? Are they useful or dangerous?',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Opinions',
        prompt: 'Quel est le meilleur conseil qu\u2019on t\u2019ait jamais donn\u00e9 ?',
        hint: 'What is the best advice anyone has ever given you?',
        targetWords: 35,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Opinions',
        prompt: 'Pr\u00e9f\u00e8res-tu la ville ou la campagne ? Explique ton choix.',
        hint: 'Do you prefer the city or the countryside? Explain your choice.',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Culture',
        prompt: 'Quel est le dernier livre que tu as lu ? Raconte l\u2019histoire bri\u00e8vement.',
        hint: 'What is the last book you read? Briefly tell the story.',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'conversation',
        category: 'Culture',
        prompt: 'D\u00e9cris ton dernier voyage. Qu\u2019est-ce qui t\u2019a marqu\u00e9 ?',
        hint: 'Describe your last trip. What stood out to you?',
        targetWords: 45,
        targetTime: 60
    },

    // ============================
    // SYNONYMES
    // ============================
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Content(e)',
        hint: 'happy',
        expectedExamples: ['heureux', 'joyeux', 'ravi', 'enchant\u00e9', 'satisfait', '\u00e9panoui'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Beau / Belle',
        hint: 'beautiful',
        expectedExamples: ['joli', 'magnifique', 'splendide', 'superbe', 'ravissant', 'charmant'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Triste',
        hint: 'sad',
        expectedExamples: ['malheureux', 'm\u00e9lancolique', 'chagrin\u00e9', 'abattu', 'morose', 'd\u00e9prim\u00e9'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Rapide',
        hint: 'fast',
        expectedExamples: ['vite', 'v\u00e9loce', 'prompt', 'press\u00e9', 'expéditif', 'vif'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Manger',
        hint: 'to eat',
        expectedExamples: ['d\u00e9vorer', 'se nourrir', 'd\u00e9guster', 'avaler', 'grignoter', 'se r\u00e9galer'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Maison',
        hint: 'house',
        expectedExamples: ['demeure', 'logement', 'habitation', 'domicile', 'r\u00e9sidence', 'foyer'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Parler',
        hint: 'to speak',
        expectedExamples: ['discuter', 'bavarder', 'converser', 's\u2019exprimer', 'dire', 'raconter'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Difficult',
        hint: 'difficult',
        expectedExamples: ['dur', 'compliqu\u00e9', 'ardu', 'p\u00e9nible', 'complexe', '\u00e9prouvant'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Int\u00e9ressant',
        hint: 'interesting',
        expectedExamples: ['captivant', 'passionnant', 'fascinant', 'stimulant', 'enrichissant', 'attrayant'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Commencer',
        hint: 'to begin',
        expectedExamples: ['d\u00e9buter', 'entamer', 'amorcer', 'inaugurer', 'lancer', 'd\u00e9marrer'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Peur',
        hint: 'fear',
        expectedExamples: ['crainte', 'frayeur', 'terreur', 'angoisse', 'effroi', 'appréhension'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Travail',
        hint: 'work',
        expectedExamples: ['emploi', 'm\u00e9tier', 'profession', 'poste', 'activit\u00e9', 'boulot'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Gentil(le)',
        hint: 'kind / nice',
        expectedExamples: ['aimable', 'sympathique', 'bienveillant', 'attentionn\u00e9', 'doux', 'adorable'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Regarder',
        hint: 'to look / to watch',
        expectedExamples: ['observer', 'contempler', 'examiner', 'fixer', 'scruter', 'admirer'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'synonyms',
        category: 'Synonymes',
        prompt: 'Voyage',
        hint: 'trip / journey',
        expectedExamples: ['p\u00e9riple', 'excursion', 'exp\u00e9dition', 'escapade', 'trajet', 'randonn\u00e9e'],
        targetWords: 5,
        targetTime: 30
    },

    // ============================
    // ANTONYMES
    // ============================
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Grand(e)',
        hint: 'big / tall',
        expectedExamples: ['petit', 'minuscule', 'court', 'bas', 'modeste'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Chaud',
        hint: 'hot',
        expectedExamples: ['froid', 'frais', 'gel\u00e9', 'glac\u00e9', 'frigide'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Riche',
        hint: 'rich',
        expectedExamples: ['pauvre', 'd\u00e9muni', 'modeste', 'fauch\u00e9', 'n\u00e9cessiteux'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Ancien',
        hint: 'old / ancient',
        expectedExamples: ['nouveau', 'moderne', 'r\u00e9cent', 'neuf', 'contemporain'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'L\u00e9ger',
        hint: 'light (weight)',
        expectedExamples: ['lourd', 'pesant', 'massif', '\u00e9pais', 'dense'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Aimer',
        hint: 'to love',
        expectedExamples: ['d\u00e9tester', 'ha\u00efr', 'abhorrer', 'ex\u00e9crer', 'm\u00e9priser'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Monter',
        hint: 'to go up',
        expectedExamples: ['descendre', 'baisser', 'tomber', 'chuter', 'd\u00e9gringoler'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Gagner',
        hint: 'to win',
        expectedExamples: ['perdre', '\u00e9chouer', 'rater', 'louper'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Bruyant',
        hint: 'noisy',
        expectedExamples: ['silencieux', 'calme', 'tranquille', 'paisible', 'discret'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'G\u00e9n\u00e9reux',
        hint: 'generous',
        expectedExamples: ['avare', '\u00e9go\u00efste', 'radin', 'pingre', 'mesquin'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Ouvrir',
        hint: 'to open',
        expectedExamples: ['fermer', 'clore', 'verrouiller', 'sceller', 'bloquer'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Courage',
        hint: 'courage',
        expectedExamples: ['l\u00e2chet\u00e9', 'peur', 'couardise', 'timidit\u00e9', 'faiblesse'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Facile',
        hint: 'easy',
        expectedExamples: ['difficile', 'dur', 'compliqu\u00e9', 'ardu', 'complexe'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Sucr\u00e9',
        hint: 'sweet',
        expectedExamples: ['sal\u00e9', 'amer', 'acide', 'aigre', '\u00e2pre'],
        targetWords: 5,
        targetTime: 30
    },
    {
        type: 'antonyms',
        category: 'Antonymes',
        prompt: 'Accepter',
        hint: 'to accept',
        expectedExamples: ['refuser', 'rejeter', 'd\u00e9cliner', 'repousser', 'nier'],
        targetWords: 5,
        targetTime: 30
    },

    // ============================
    // CONSTRUCTION DE PHRASES
    // ============================
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'hier / aller / cin\u00e9ma / ami',
        hint: 'Build a sentence using: yesterday / to go / cinema / friend',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'toujours / r\u00eaver / voyager / Japon',
        hint: 'Build a sentence using: always / to dream / to travel / Japan',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'si / pouvoir / apprendre / instrument / guitare',
        hint: 'Build a sentence using: if / to be able / to learn / instrument / guitar',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'demain / devoir / rendez-vous / m\u00e9decin',
        hint: 'Build a sentence using: tomorrow / must / appointment / doctor',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'week-end / pr\u00e9f\u00e9rer / rester / maison / lire',
        hint: 'Build a sentence using: weekend / to prefer / to stay / home / to read',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'enfant / adorer / jouer / parc / apr\u00e8s / \u00e9cole',
        hint: 'Build a sentence using: child / to love / to play / park / after / school',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'bien que / fatig\u00e9 / continuer / travailler / projet',
        hint: 'Build a sentence using: although / tired / to continue / to work / project',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'avant / partir / v\u00e9rifier / fen\u00eatres / ferm\u00e9',
        hint: 'Build a sentence using: before / to leave / to check / windows / closed',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'depuis / trois ans / habiter / Paris / adorer',
        hint: 'Build a sentence using: for (since) / three years / to live / Paris / to love',
        targetWords: 15,
        targetTime: 45
    },
    {
        type: 'sentence_building',
        category: 'Construction de Phrases',
        prompt: 'chaque / matin / boire / caf\u00e9 / balcon',
        hint: 'Build a sentence using: every / morning / to drink / coffee / balcony',
        targetWords: 15,
        targetTime: 45
    },

    // ============================
    // DESCRIPTION
    // ============================
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris ce qui se passe dans un march\u00e9 le dimanche matin.',
        hint: 'Describe what happens at a Sunday morning market.',
        targetWords: 50,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris ta chambre en d\u00e9tail. Qu\u2019est-ce qu\u2019on y trouve ?',
        hint: 'Describe your bedroom in detail. What can you find there?',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'Imagine que tu es dans un caf\u00e9 parisien. D\u00e9cris l\u2019atmosph\u00e8re.',
        hint: 'Imagine you are in a Parisian caf\u00e9. Describe the atmosphere.',
        targetWords: 50,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris ta saison pr\u00e9f\u00e9r\u00e9e. Qu\u2019est-ce que tu vois, sens, entends ?',
        hint: 'Describe your favorite season. What do you see, smell, hear?',
        targetWords: 50,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris un repas de f\u00eate en famille : la table, les plats, l\u2019ambiance.',
        hint: 'Describe a family holiday meal: the table, the dishes, the atmosphere.',
        targetWords: 50,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'Tu te prom\u00e8nes sur une plage au coucher du soleil. D\u00e9cris la sc\u00e8ne.',
        hint: 'You are walking on a beach at sunset. Describe the scene.',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris ton lieu de travail ou l\u2019endroit o\u00f9 tu \u00e9tudies.',
        hint: 'Describe your workplace or where you study.',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris un jour de pluie dans ta ville. Que font les gens ?',
        hint: 'Describe a rainy day in your city. What are people doing?',
        targetWords: 45,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'D\u00e9cris ton animal de compagnie (ou ton animal id\u00e9al).',
        hint: 'Describe your pet (or your ideal pet).',
        targetWords: 40,
        targetTime: 60
    },
    {
        type: 'describe_scene',
        category: 'Description',
        prompt: 'Tu arrives dans une nouvelle ville. D\u00e9cris tes premi\u00e8res impressions.',
        hint: 'You arrive in a new city. Describe your first impressions.',
        targetWords: 50,
        targetTime: 60
    },

    // ============================
    // COMPL\u00c8TE LA PHRASE
    // ============================
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Je suis all\u00e9(e) au supermarch\u00e9 pour acheter ___.',
        hint: 'I went to the supermarket to buy ___.',
        targetWords: 10,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Si j\u2019avais plus de temps libre, je ___.',
        hint: 'If I had more free time, I would ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Le probl\u00e8me avec les r\u00e9seaux sociaux, c\u2019est que ___.',
        hint: 'The problem with social media is that ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Quand j\u2019\u00e9tais petit(e), je r\u00eavais de ___.',
        hint: 'When I was little, I dreamed of ___.',
        targetWords: 12,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'La chose la plus importante dans la vie, c\u2019est ___.',
        hint: 'The most important thing in life is ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Pour \u00eatre en bonne sant\u00e9, il faut ___.',
        hint: 'To be in good health, you need to ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Mon plus grand d\u00e9faut, c\u2019est que je ___.',
        hint: 'My biggest flaw is that I ___.',
        targetWords: 12,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Ce week-end, je vais ___ parce que ___.',
        hint: 'This weekend, I am going to ___ because ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Si je pouvais recommencer ma journ\u00e9e, je ___.',
        hint: 'If I could start my day over, I would ___.',
        targetWords: 15,
        targetTime: 30
    },
    {
        type: 'fill_blank',
        category: 'Compl\u00e8te la Phrase',
        prompt: 'Apprendre le fran\u00e7ais est ___ parce que ___.',
        hint: 'Learning French is ___ because ___.',
        targetWords: 15,
        targetTime: 30
    }
];

// French filler words to detect
const FRENCH_FILLER_WORDS = [
    'euh', 'ben', 'bah', 'genre', 'en fait', 'du coup',
    'voil\u00e0', 'quoi', 'bon', 'donc', 'alors',
    'tu vois', 'tu sais', 'enfin', 'c\u2019est-\u00e0-dire'
];

// Activity type display names
const ACTIVITY_TYPE_LABELS = {
    conversation: 'Conversation',
    synonyms: 'Synonymes',
    antonyms: 'Antonymes',
    sentence_building: 'Construction',
    describe_scene: 'Description',
    fill_blank: 'Compl\u00e8te'
};

// Activity type icons
const ACTIVITY_TYPE_ICONS = {
    conversation: '\ud83d\udcac',
    synonyms: '\ud83d\udd04',
    antonyms: '\u2194\ufe0f',
    sentence_building: '\ud83e\udde9',
    describe_scene: '\ud83c\udfa8',
    fill_blank: '\u270d\ufe0f'
};
