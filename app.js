// State
let currentQuestion = null;
let isRecording = false;
let recognition = null;
let transcript = '';
let startTime = null;
let timerInterval = null;
let timeRemaining = 90;
let isSpeaking = false;

// DOM Elements
const questionCard = document.getElementById('question-card');
const questionCategory = document.getElementById('question-category');
const questionText = document.getElementById('question-text');
const targetWords = document.getElementById('target-words');
const targetTime = document.getElementById('target-time');
const recordBtn = document.getElementById('record-btn');
const recordLabel = document.getElementById('record-label');
const timer = document.getElementById('timer');
const timerDisplay = document.getElementById('timer-display');
const resultsSection = document.getElementById('results-section');
const transcriptText = document.getElementById('transcript-text');
const newQuestionBtn = document.getElementById('new-question-btn');
const resetBtn = document.getElementById('reset-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const rewriteBtn = document.getElementById('rewrite-btn');
const rewriteLoading = document.getElementById('rewrite-loading');
const rewriteResult = document.getElementById('rewrite-result');
const rewriteText = document.getElementById('rewrite-text');
const rewriteError = document.getElementById('rewrite-error');
const rewriteWordCount = document.getElementById('rewrite-word-count');
const rewriteReduction = document.getElementById('rewrite-reduction');
const fillersDetail = document.getElementById('fillers-detail');
const fillersList = document.getElementById('fillers-list');
const speakBtn = document.getElementById('speak-btn');

// Score elements
const wordCountEl = document.getElementById('word-count');
const wordStatusEl = document.getElementById('word-status');
const fillerCountEl = document.getElementById('filler-count');
const fillerStatusEl = document.getElementById('filler-status');
const paceValueEl = document.getElementById('pace-value');
const paceStatusEl = document.getElementById('pace-status');
const longestSentenceEl = document.getElementById('longest-sentence');
const sentenceStatusEl = document.getElementById('sentence-status');

// Initialize Speech Recognition
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser. Please use Safari on iOS or Chrome.');
        return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        transcript = finalTranscript || interimTranscript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please enable microphone permissions in your browser settings.');
        }
    };

    recognition.onend = () => {
        if (isRecording) {
            // Restart if still supposed to be recording
            recognition.start();
        }
    };

    return true;
}

// Timer functions
function startTimer() {
    timeRemaining = currentQuestion ? currentQuestion.targetTime : 90;
    updateTimerDisplay();
    timer.classList.remove('hidden');
    timer.classList.add('recording');

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            stopRecording();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timer.classList.remove('recording');
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Recording functions
function startRecording() {
    if (!recognition && !initSpeechRecognition()) {
        return;
    }

    isRecording = true;
    transcript = '';
    startTime = Date.now();

    recordBtn.classList.add('recording');
    recordLabel.textContent = 'Tap to Stop';
    resultsSection.classList.add('hidden');
    resetBtn.classList.add('hidden');

    startTimer();
    recognition.start();
}

function stopRecording() {
    isRecording = false;
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;

    recordBtn.classList.remove('recording');
    recordLabel.textContent = 'Tap to Record';

    stopTimer();

    if (recognition) {
        recognition.stop();
    }

    // Small delay to capture final transcript
    setTimeout(() => {
        if (transcript.trim()) {
            showResults(transcript, durationSeconds);
        } else {
            alert('No speech detected. Please try again and speak clearly.');
        }
    }, 500);
}

function toggleRecording() {
    if (!currentQuestion) {
        loadNewQuestion();
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Analysis functions
function countWords(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function findFillers(text) {
    const lowerText = text.toLowerCase();
    const found = [];

    FILLER_WORDS.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            matches.forEach(() => found.push(filler));
        }
    });

    return found;
}

function getLongestSentence(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let maxWords = 0;

    sentences.forEach(sentence => {
        const wordCount = countWords(sentence);
        if (wordCount > maxWords) {
            maxWords = wordCount;
        }
    });

    return maxWords;
}

function calculatePace(wordCount, durationSeconds) {
    if (durationSeconds === 0) return 0;
    return Math.round((wordCount / durationSeconds) * 60);
}

function getStatus(value, good, warning) {
    if (typeof good === 'object') {
        // Range: { min, max }
        if (value >= good.min && value <= good.max) return 'good';
        if (value >= warning.min && value <= warning.max) return 'warning';
        return 'bad';
    } else {
        // Threshold: lower is better
        if (value <= good) return 'good';
        if (value <= warning) return 'warning';
        return 'bad';
    }
}

// Results display
function showResults(text, durationSeconds) {
    transcriptText.textContent = text;

    const wordCount = countWords(text);
    const fillers = findFillers(text);
    const fillerCount = fillers.length;
    const fillerRate = ((fillerCount / wordCount) * 100).toFixed(1);
    const pace = calculatePace(wordCount, durationSeconds);
    const longestSentence = getLongestSentence(text);
    const targetWordCount = currentQuestion ? currentQuestion.targetWords : 120;

    // Update scorecard
    wordCountEl.textContent = wordCount;
    const wordStatus = getStatus(wordCount, targetWordCount * 1.1, targetWordCount * 1.3);
    wordStatusEl.textContent = wordCount <= targetWordCount ? `Target: ${targetWordCount}` : `${Math.round((wordCount / targetWordCount - 1) * 100)}% over`;
    wordStatusEl.className = `score-status ${wordCount <= targetWordCount * 1.1 ? 'good' : wordCount <= targetWordCount * 1.3 ? 'warning' : 'bad'}`;

    fillerCountEl.textContent = fillerCount;
    fillerStatusEl.textContent = `${fillerRate}% of words`;
    fillerStatusEl.className = `score-status ${fillerCount <= 2 ? 'good' : fillerCount <= 5 ? 'warning' : 'bad'}`;

    paceValueEl.textContent = `${pace}`;
    paceStatusEl.textContent = 'wpm';
    paceStatusEl.className = `score-status ${pace >= 140 && pace <= 170 ? 'good' : pace >= 120 && pace <= 180 ? 'warning' : 'bad'}`;

    longestSentenceEl.textContent = longestSentence;
    sentenceStatusEl.textContent = 'words';
    sentenceStatusEl.className = `score-status ${longestSentence <= 25 ? 'good' : longestSentence <= 35 ? 'warning' : 'bad'}`;

    // Show fillers detail if any found
    if (fillers.length > 0) {
        fillersDetail.classList.remove('hidden');
        const uniqueFillers = [...new Set(fillers)];
        fillersList.innerHTML = uniqueFillers.map(f =>
            `<span class="filler-word">${f} (${fillers.filter(x => x === f).length})</span>`
        ).join(' ');
    } else {
        fillersDetail.classList.add('hidden');
    }

    // Reset rewrite section
    rewriteBtn.classList.remove('hidden');
    rewriteLoading.classList.add('hidden');
    rewriteResult.classList.add('hidden');
    rewriteError.classList.add('hidden');

    // Show results
    resultsSection.classList.remove('hidden');
    resetBtn.classList.remove('hidden');

    // Save to history
    saveToHistory(wordCount, fillerCount, pace, longestSentence);
}

// Grok API integration
async function getRewrite() {
    const apiKey = localStorage.getItem('grok_api_key');

    if (!apiKey) {
        settingsModal.classList.remove('hidden');
        return;
    }

    rewriteBtn.classList.add('hidden');
    rewriteLoading.classList.remove('hidden');
    rewriteError.classList.add('hidden');

    const prompt = `You are a communication coach helping a French professional speak like a crisp American executive.

Rewrite this interview answer following these rules:
1. Cut all filler words (uh, um, like, you know, basically, actually, so, right)
2. Reduce word count by 30-40%
3. Lead with the headline - put the main point first
4. Keep sentences under 20 words
5. Use active voice
6. Preserve all facts and meaning
7. Sound natural, not robotic

Original answer:
"${transcript}"

Question being answered:
"${currentQuestion ? currentQuestion.question : 'Interview question'}"

Return ONLY the rewritten answer, nothing else.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a communication coach helping professionals speak more concisely. Return only the rewritten text, no explanations.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const rewrittenText = data.choices[0].message.content.trim();

        // Show result
        rewriteText.textContent = rewrittenText;
        const originalWords = countWords(transcript);
        const newWords = countWords(rewrittenText);
        const reduction = Math.round((1 - newWords / originalWords) * 100);

        rewriteWordCount.textContent = `${newWords} words`;
        rewriteReduction.textContent = `${reduction}% shorter`;

        rewriteLoading.classList.add('hidden');
        rewriteResult.classList.remove('hidden');

    } catch (error) {
        console.error('Rewrite error:', error);
        rewriteLoading.classList.add('hidden');
        rewriteError.classList.remove('hidden');
        rewriteError.querySelector('.error-text').textContent = error.message;
        rewriteBtn.classList.remove('hidden');
    }
}

// History management
function saveToHistory(wordCount, fillerCount, pace, longestSentence) {
    const history = JSON.parse(localStorage.getItem('voice_drill_history') || '[]');

    history.unshift({
        date: new Date().toISOString(),
        question: currentQuestion ? currentQuestion.question.substring(0, 50) + '...' : 'Unknown',
        wordCount,
        fillerCount,
        pace,
        longestSentence
    });

    // Keep only last 20 sessions
    if (history.length > 20) {
        history.pop();
    }

    localStorage.setItem('voice_drill_history', JSON.stringify(history));
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('voice_drill_history') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No sessions yet. Start your first drill!</p>';
        return;
    }

    historyList.innerHTML = history.slice(0, 5).map(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="history-item">
                <div>
                    <div class="history-date">${dateStr}</div>
                </div>
                <div class="history-stats">
                    <span class="history-stat">${item.wordCount}w</span>
                    <span class="history-stat">${item.fillerCount}f</span>
                    <span class="history-stat">${item.pace}wpm</span>
                </div>
            </div>
        `;
    }).join('');
}

// Question loading
function loadNewQuestion() {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    currentQuestion = QUESTIONS[randomIndex];

    questionCategory.textContent = currentQuestion.category;
    questionText.textContent = currentQuestion.question;
    targetWords.textContent = currentQuestion.targetWords;
    targetTime.textContent = currentQuestion.targetTime;

    // Reset UI
    resultsSection.classList.add('hidden');
    resetBtn.classList.add('hidden');
    timer.classList.add('hidden');
    transcript = '';

    recordLabel.textContent = 'Tap to Record';
}

// Settings
function openSettings() {
    const savedKey = localStorage.getItem('grok_api_key') || '';
    apiKeyInput.value = savedKey;
    settingsModal.classList.remove('hidden');
}

function closeSettings() {
    settingsModal.classList.add('hidden');
}

function saveSettings() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
        localStorage.setItem('grok_api_key', apiKey);
    } else {
        localStorage.removeItem('grok_api_key');
    }
    closeSettings();
}

// Event listeners
recordBtn.addEventListener('click', toggleRecording);
newQuestionBtn.addEventListener('click', loadNewQuestion);
resetBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    resetBtn.classList.add('hidden');
    timer.classList.add('hidden');
    transcript = '';
});
settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', saveSettings);
rewriteBtn.addEventListener('click', getRewrite);

// Close modal on background click
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

// Text-to-speech for crisp version
function speakCrispVersion() {
    const text = rewriteText.textContent;

    if (!text) return;

    // Stop if already speaking
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.textContent = '🔊 Listen';
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure for clear American English
    utterance.rate = 0.95;  // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to get an American English voice
    const voices = window.speechSynthesis.getVoices();
    const americanVoice = voices.find(v =>
        v.lang === 'en-US' && (v.name.includes('Samantha') || v.name.includes('Alex') || v.name.includes('Google'))
    ) || voices.find(v => v.lang === 'en-US') || voices[0];

    if (americanVoice) {
        utterance.voice = americanVoice;
    }

    utterance.onstart = () => {
        isSpeaking = true;
        speakBtn.textContent = '⏹️ Stop';
    };

    utterance.onend = () => {
        isSpeaking = false;
        speakBtn.textContent = '🔊 Listen';
    };

    utterance.onerror = () => {
        isSpeaking = false;
        speakBtn.textContent = '🔊 Listen';
    };

    window.speechSynthesis.speak(utterance);
}

// Load voices (needed for some browsers)
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

speakBtn.addEventListener('click', speakCrispVersion);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    updateHistoryDisplay();
});
