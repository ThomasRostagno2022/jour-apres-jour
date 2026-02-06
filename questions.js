const QUESTIONS = [
    // Behavioral - Core Stories
    {
        category: "Behavioral",
        question: "Tell me about yourself and your background.",
        targetWords: 150,
        targetTime: 90
    },
    {
        category: "Behavioral",
        question: "Tell me about a project you're most proud of.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Behavioral",
        question: "Tell me about a time you failed. What did you learn?",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Behavioral",
        question: "Describe a time you influenced a senior leader who disagreed with you.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Behavioral",
        question: "Tell me about a time you had to deliver bad news to leadership.",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Behavioral",
        question: "Describe a situation where you had to make a decision with incomplete data.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Behavioral",
        question: "Tell me about a time you had to get alignment across multiple stakeholders.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Behavioral",
        question: "Describe a time you changed someone's mind with data.",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Behavioral",
        question: "Tell me about a time you inherited a project or analysis you thought was wrong.",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Behavioral",
        question: "Describe a situation where you had to prioritize competing demands.",
        targetWords: 100,
        targetTime: 75
    },

    // Motivation & Fit
    {
        category: "Motivation",
        question: "Why this company? Why this role? Why now?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Motivation",
        question: "This is an IC role. You've managed teams. Are you OK with that?",
        targetWords: 80,
        targetTime: 60
    },
    {
        category: "Motivation",
        question: "What type of leader do you work best with?",
        targetWords: 80,
        targetTime: 60
    },
    {
        category: "Motivation",
        question: "What frustrates you most in a role like this?",
        targetWords: 80,
        targetTime: 60
    },
    {
        category: "Motivation",
        question: "Where do you see yourself in 3-5 years?",
        targetWords: 80,
        targetTime: 60
    },

    // GTM Strategy
    {
        category: "GTM Strategy",
        question: "How would you diagnose a GTM problem you've never seen before?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "GTM Strategy",
        question: "How do you think about coverage models?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "GTM Strategy",
        question: "How would you approach building a business case with unreliable data?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "GTM Strategy",
        question: "What's the biggest GTM lever to go from $5B to $10B?",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "GTM Strategy",
        question: "How do you think about land vs. expand motions differently?",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "GTM Strategy",
        question: "How would you think about GTM for a brand new product vs. a mature one?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "GTM Strategy",
        question: "When would you use partners vs. direct sales?",
        targetWords: 100,
        targetTime: 75
    },

    // Situational
    {
        category: "Situational",
        question: "A Regional VP says 60% of rep time goes to 15% of revenue. What do you do?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Situational",
        question: "The CRO disagrees with your recommendation. How do you handle it?",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Situational",
        question: "I give you 3 urgent projects at once. How do you prioritize?",
        targetWords: 100,
        targetTime: 75
    },
    {
        category: "Situational",
        question: "Walk me through how you'd structure a Q3 executive GTM review.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Situational",
        question: "How would you approach your first 90 days in this role?",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Situational",
        question: "How would you work with Rev Ops vs. the BU GTM teams?",
        targetWords: 100,
        targetTime: 75
    },

    // Data & Analysis
    {
        category: "Data & Analysis",
        question: "Tell me about building a model with bad or incomplete data.",
        targetWords: 120,
        targetTime: 90
    },
    {
        category: "Data & Analysis",
        question: "How do you validate assumptions when you don't have historical data?",
        targetWords: 100,
        targetTime: 75
    }
];

// Filler words to detect
const FILLER_WORDS = [
    'uh', 'um', 'eh', 'ah', 'er',
    'like', 'you know', 'basically', 'actually', 'literally',
    'right', 'so', 'well', 'i mean', 'kind of', 'sort of',
    'honestly', 'obviously', 'definitely', 'probably',
    'just', 'really', 'very', 'stuff', 'things',
    'anyway', 'anyways'
];
