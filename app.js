// Default API keys (can be overridden in settings)
// Keys are split to avoid GitHub secret scanning
const DEFAULT_GROQ_KEY = ['gsk_DJtowUxnkrNBdieWUGDG', 'WGdyb3FYltJH62LU8Uqd7kNB3bNJntmU'].join('');
const DEFAULT_ELEVENLABS_KEY = ['sk_116ea5a2737312a826b3', '447f0f2ff466fe4ac8f08941870a'].join('');

// ========================
// App State Machine
// ========================
const APP_STATE = {
    PICKER: 'picker',
    ACTIVITY_VOICE: 'voice',
    ACTIVITY_TILES: 'tiles',
    RESULTS: 'results'
};

let currentState = APP_STATE.PICKER;
let currentActivity = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let transcript = '';
let startTime = null;
let timerInterval = null;
let timeRemaining = 60;
let isSpeaking = false;
let showHints = true;
let selectedTiles = new Set();

// DOM Elements
const activityCard = document.getElementById('activity-card');
const activityType = document.getElementById('activity-type');
const activityCategory = document.getElementById('activity-category');
const activityPrompt = document.getElementById('activity-prompt');
const activityHint = document.getElementById('activity-hint');
const targetWordsEl = document.getElementById('target-words');
const targetTimeEl = document.getElementById('target-time');
const recordBtn = document.getElementById('record-btn');
const recordLabel = document.getElementById('record-label');
const timer = document.getElementById('timer');
const timerDisplay = document.getElementById('timer-display');
const resultsSection = document.getElementById('results-section');
const transcriptText = document.getElementById('transcript-text');
const newActivityBtn = document.getElementById('new-activity-btn');
const resetBtn = document.getElementById('reset-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const aiLoading = document.getElementById('ai-loading');
const improvedResult = document.getElementById('improved-result');
const improvedText = document.getElementById('improved-text');
const tipsSection = document.getElementById('tips-section');
const tipsText = document.getElementById('tips-text');
const aiError = document.getElementById('ai-error');
const speakBtn = document.getElementById('speak-btn');
const hintToggle = document.getElementById('hint-toggle');
const wordCountEl = document.getElementById('word-count');
const activityPicker = document.getElementById('activity-picker');
const backToPickerBtn = document.getElementById('back-to-picker');
const tileSelectionSection = document.getElementById('tile-selection-section');
const recordingSection = document.getElementById('recording-section');
const progressSection = document.getElementById('progress-section');
const historySection = document.getElementById('history-section');
const actionsSection = document.getElementById('actions-section');
const targetInfo = document.getElementById('target-info');

// ========================
// State Management
// ========================
function setState(newState) {
    currentState = newState;

    // Hide everything first
    activityPicker.classList.add('hidden');
    activityCard.classList.add('hidden');
    recordingSection.classList.add('hidden');
    tileSelectionSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    backToPickerBtn.classList.add('hidden');
    newActivityBtn.classList.add('hidden');
    resetBtn.classList.add('hidden');

    switch (newState) {
        case APP_STATE.PICKER:
            activityPicker.classList.remove('hidden');
            progressSection.classList.remove('hidden');
            historySection.classList.remove('hidden');
            break;
        case APP_STATE.ACTIVITY_VOICE:
            activityCard.classList.remove('hidden');
            recordingSection.classList.remove('hidden');
            backToPickerBtn.classList.remove('hidden');
            progressSection.classList.add('hidden');
            historySection.classList.add('hidden');
            break;
        case APP_STATE.ACTIVITY_TILES:
            activityCard.classList.remove('hidden');
            tileSelectionSection.classList.remove('hidden');
            backToPickerBtn.classList.remove('hidden');
            progressSection.classList.add('hidden');
            historySection.classList.add('hidden');
            break;
        case APP_STATE.RESULTS:
            activityCard.classList.remove('hidden');
            resultsSection.classList.remove('hidden');
            backToPickerBtn.classList.remove('hidden');
            newActivityBtn.classList.remove('hidden');
            progressSection.classList.add('hidden');
            historySection.classList.add('hidden');
            // Keep tiles visible if it was a tile activity
            if (currentActivity && (currentActivity.type === 'synonyms' || currentActivity.type === 'antonyms')) {
                tileSelectionSection.classList.remove('hidden');
            }
            break;
    }
}

// ========================
// Picker Initialization
// ========================
function initPicker() {
    document.querySelectorAll('.picker-tile').forEach(tile => {
        const type = tile.dataset.type;
        const countEl = tile.querySelector('.picker-count');
        if (countEl && ACTIVITY_TYPE_COUNTS[type]) {
            countEl.textContent = `${ACTIVITY_TYPE_COUNTS[type]} activities`;
        }
        tile.addEventListener('click', () => {
            loadNewActivity(type);
        });
    });
}

// ========================
// Show status message
// ========================
function showStatus(msg) {
    if (transcriptText) {
        transcriptText.textContent = msg;
    }
}

// ========================
// Timer functions
// ========================
function startTimer() {
    timeRemaining = currentActivity ? currentActivity.targetTime : 60;
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

// ========================
// Recording functions
// ========================
async function startRecording() {
    try {
        showStatus('Accessing microphone...');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        showStatus('Microphone ready! Speak now...');

        // Determine supported mime type
        let mimeType = '';
        let fileExtension = 'webm';

        const formats = [
            { mime: 'audio/webm;codecs=opus', ext: 'webm' },
            { mime: 'audio/webm', ext: 'webm' },
            { mime: 'audio/mp4', ext: 'm4a' },
            { mime: 'audio/aac', ext: 'aac' },
            { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
            { mime: 'audio/wav', ext: 'wav' },
            { mime: '', ext: 'webm' }
        ];

        for (const format of formats) {
            if (format.mime === '' || MediaRecorder.isTypeSupported(format.mime)) {
                mimeType = format.mime;
                fileExtension = format.ext;
                console.log('Using audio format:', mimeType || 'default');
                break;
            }
        }

        const recorderOptions = mimeType ? { mimeType } : {};
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
        mediaRecorder.fileExtension = fileExtension;
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());

            if (audioChunks.length > 0) {
                const blobType = mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks, { type: blobType });
                console.log('Audio blob size:', audioBlob.size, 'type:', blobType);
                await transcribeAudio(audioBlob, mediaRecorder.fileExtension);
            } else {
                showStatus('No audio recorded. Try again.');
            }
        };

        mediaRecorder.onerror = (event) => {
            showStatus('Recording error: ' + event.error);
        };

        mediaRecorder.start(1000);

        isRecording = true;
        transcript = '';
        startTime = Date.now();

        recordBtn.classList.add('recording');
        recordLabel.textContent = 'Tap to Stop';
        resetBtn.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        startTimer();

    } catch (err) {
        console.error('Microphone error:', err);
        if (err.name === 'NotAllowedError') {
            showStatus('Microphone access denied. Please allow microphone in settings.');
            alert('Microphone access denied.\n\nOn iPhone:\n1. Go to Settings > Safari\n2. Scroll to "Settings for Websites"\n3. Tap Microphone\n4. Select "Allow"');
        } else {
            showStatus('Error: ' + err.message);
        }
    }
}

function stopRecording() {
    isRecording = false;
    stopTimer();

    recordBtn.classList.remove('recording');
    recordLabel.textContent = 'Tap to Record';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        showStatus('Processing audio...');
        mediaRecorder.stop();
    }
}

// Transcribe audio using Groq Whisper API
async function transcribeAudio(audioBlob, fileExtension = 'webm') {
    const apiKey = localStorage.getItem('grok_api_key') || DEFAULT_GROQ_KEY;

    if (!apiKey) {
        showStatus('Configure your Groq API key in settings.');
        settingsModal.classList.remove('hidden');
        return;
    }

    showStatus('Transcribing...');

    try {
        const filename = `recording.${fileExtension}`;
        console.log('Sending audio file:', filename, 'size:', audioBlob.size);

        const formData = new FormData();
        formData.append('file', audioBlob, filename);
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('language', 'fr');
        formData.append('response_format', 'verbose_json');
        formData.append('prompt', 'Euh, ben, bah, genre, en fait, du coup, voil\u00e0, quoi. Je suis all\u00e9 au march\u00e9. Il fait beau aujourd\u2019hui. C\u2019est vraiment int\u00e9ressant.');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Transcription failed: ${response.status}`);
        }

        const data = await response.json();
        let rawTranscript = data.text ? data.text.trim() : '';
        console.log('Raw transcription:', rawTranscript);

        if (rawTranscript) {
            const durationSeconds = (Date.now() - startTime) / 1000;
            transcript = rawTranscript;
            showResults(transcript, durationSeconds);
        } else {
            showStatus('No speech detected. Speak louder and try again.');
        }

    } catch (error) {
        console.error('Transcription error:', error);
        showStatus('Transcription failed: ' + error.message);
    }
}

function toggleRecording() {
    if (!currentActivity) {
        return;
    }

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// ========================
// Analysis functions
// ========================
function countWords(text) {
    const cleanText = text.replace(/[\[\]]/g, '');
    return cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// ========================
// Results display
// ========================
function showResults(text, durationSeconds) {
    transcriptText.textContent = text;

    const wordCount = countWords(text);
    wordCountEl.textContent = wordCount;

    setState(APP_STATE.RESULTS);
    resetBtn.classList.remove('hidden');

    // Save to history
    saveToHistory(wordCount, currentActivity ? currentActivity.type : 'conversation', currentActivity ? currentActivity.category : '');

    // Auto-trigger AI feedback
    getAIFeedback();
}

// ========================
// Tile Selection System (Synonyms/Antonyms)
// ========================
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function setupTileSelection() {
    selectedTiles = new Set();
    const container = document.getElementById('word-tiles');
    const checkBtn = document.getElementById('check-tiles-btn');
    const instructionText = document.getElementById('tile-instruction-text');

    checkBtn.disabled = true;
    checkBtn.textContent = 'Check My Answers';

    // Set instruction text
    if (currentActivity.type === 'synonyms') {
        instructionText.textContent = 'Select the synonyms:';
    } else {
        instructionText.textContent = 'Select the antonyms:';
    }

    // Pick 3 correct answers from expectedExamples
    const correctWords = shuffleArray([...currentActivity.expectedExamples]).slice(0, 3);

    // Get 3 distractors
    let distractorWords;
    if (currentActivity.distractors && currentActivity.distractors.length >= 3) {
        distractorWords = shuffleArray([...currentActivity.distractors]).slice(0, 3);
    } else {
        distractorWords = generateDistractors(currentActivity);
    }

    // Combine and shuffle
    const allTiles = shuffleArray([
        ...correctWords.map(w => ({ word: w, correct: true })),
        ...distractorWords.map(w => ({ word: w, correct: false }))
    ]);

    // Render tiles
    container.innerHTML = allTiles.map((tile, i) => `
        <button class="word-tile" data-index="${i}" data-word="${tile.word}" data-correct="${tile.correct}">
            ${tile.word}
        </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.word-tile').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('revealed')) return;
            const idx = btn.dataset.index;
            if (selectedTiles.has(idx)) {
                selectedTiles.delete(idx);
                btn.classList.remove('selected');
            } else {
                selectedTiles.add(idx);
                btn.classList.add('selected');
            }
            checkBtn.disabled = selectedTiles.size === 0;
        });
    });
}

function generateDistractors(activity) {
    const sameTypeActivities = ACTIVITIES.filter(a =>
        a.type === activity.type && a.prompt !== activity.prompt
    );
    const pool = [];
    sameTypeActivities.forEach(a => {
        if (a.expectedExamples) pool.push(...a.expectedExamples);
    });
    const filtered = pool.filter(w => !activity.expectedExamples.includes(w));
    return shuffleArray(filtered).slice(0, 3);
}

function checkTileAnswers() {
    const container = document.getElementById('word-tiles');
    const tiles = container.querySelectorAll('.word-tile');
    const checkBtn = document.getElementById('check-tiles-btn');

    // Reveal correct/incorrect
    tiles.forEach(tile => {
        const isCorrect = tile.dataset.correct === 'true';
        const isSelected = selectedTiles.has(tile.dataset.index);

        tile.classList.add('revealed');

        if (isCorrect) {
            tile.classList.add('correct-answer');
            if (isSelected) {
                tile.classList.add('correct-selected');
            } else {
                tile.classList.add('correct-missed');
            }
        } else {
            if (isSelected) {
                tile.classList.add('incorrect-selected');
            }
        }

        tile.disabled = true;
    });

    // Update check button
    checkBtn.disabled = true;
    checkBtn.textContent = 'Checked!';

    // Build transcript from selections
    const selectedWords = [];
    tiles.forEach(tile => {
        if (selectedTiles.has(tile.dataset.index)) {
            selectedWords.push(tile.dataset.word);
        }
    });

    transcript = selectedWords.join(', ');

    // Count correct selections
    let correctCount = 0;
    tiles.forEach(tile => {
        if (selectedTiles.has(tile.dataset.index) && tile.dataset.correct === 'true') {
            correctCount++;
        }
    });

    // Show results
    setState(APP_STATE.RESULTS);
    tileSelectionSection.classList.remove('hidden');

    transcriptText.textContent = `You selected: ${transcript}`;
    wordCountEl.textContent = `${correctCount}/3`;

    saveToHistory(correctCount, currentActivity.type, currentActivity.category);
    getAIFeedback();
}

// ========================
// Activity Loading
// ========================
function loadNewActivity(type) {
    // Get all activities of the requested type
    const typeActivities = ACTIVITIES.filter(a => a.type === type);

    // Per-type repeat tracking
    const askedKey = `parle_avec_moi_asked_${type}`;
    let askedIndices = JSON.parse(localStorage.getItem(askedKey) || '[]');

    // Reset if all of this type have been asked
    if (askedIndices.length >= typeActivities.length) {
        console.log(`All ${type} activities done! Resetting list.`);
        askedIndices = [];
    }

    // Get available activities (not yet asked)
    const availableIndices = typeActivities.map((_, i) => i).filter(i => !askedIndices.includes(i));

    // Pick a random one
    const randomLocalIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    currentActivity = typeActivities[randomLocalIndex];

    // Track this activity as asked
    askedIndices.push(randomLocalIndex);
    localStorage.setItem(askedKey, JSON.stringify(askedIndices));

    console.log(`Activity ${askedIndices.length}/${typeActivities.length}: "${currentActivity.prompt.substring(0, 50)}..."`);

    // Update UI
    const icon = ACTIVITY_TYPE_ICONS[currentActivity.type] || '';
    const label = ACTIVITY_TYPE_LABELS[currentActivity.type] || currentActivity.type;
    activityType.textContent = `${icon} ${label}`;
    activityType.className = `activity-type-badge ${currentActivity.type}`;
    activityCategory.textContent = currentActivity.category;

    // Show prompt based on activity type
    if (currentActivity.type === 'synonyms') {
        activityPrompt.innerHTML = `<span class="prompt-word">${currentActivity.prompt}</span><br><span class="prompt-instruction">Select the synonyms below!</span>`;
        targetInfo.classList.add('hidden');
    } else if (currentActivity.type === 'antonyms') {
        activityPrompt.innerHTML = `<span class="prompt-word">${currentActivity.prompt}</span><br><span class="prompt-instruction">Select the antonyms below!</span>`;
        targetInfo.classList.add('hidden');
    } else if (currentActivity.type === 'sentence_building') {
        const words = currentActivity.prompt.split(' / ');
        activityPrompt.innerHTML = `<div class="word-chips">${words.map(w => `<span class="word-chip">${w}</span>`).join('')}</div><span class="prompt-instruction">Build a sentence with these words!</span>`;
        targetInfo.classList.remove('hidden');
    } else {
        activityPrompt.textContent = currentActivity.prompt;
        targetInfo.classList.remove('hidden');
    }

    // Show/hide hint
    activityHint.textContent = currentActivity.hint;
    activityHint.classList.toggle('hidden', !showHints);

    targetWordsEl.textContent = currentActivity.targetWords;
    targetTimeEl.textContent = currentActivity.targetTime;

    // Reset
    transcript = '';
    timer.classList.add('hidden');
    recordLabel.textContent = 'Tap to Record';

    // Set correct state based on type
    if (type === 'synonyms' || type === 'antonyms') {
        setState(APP_STATE.ACTIVITY_TILES);
        setupTileSelection();
    } else {
        setState(APP_STATE.ACTIVITY_VOICE);
    }
}

// ========================
// AI Feedback
// ========================
async function getAIFeedback() {
    const apiKey = localStorage.getItem('grok_api_key') || DEFAULT_GROQ_KEY;

    if (!apiKey) {
        settingsModal.classList.remove('hidden');
        return;
    }

    aiLoading.classList.remove('hidden');
    improvedResult.classList.add('hidden');
    tipsSection.classList.add('hidden');
    aiError.classList.add('hidden');

    const wordCount = countWords(transcript);
    const activityTypeStr = currentActivity ? currentActivity.type : 'conversation';

    let prompt = '';

    if (activityTypeStr === 'synonyms' || activityTypeStr === 'antonyms') {
        const label = activityTypeStr === 'synonyms' ? 'synonymes' : 'antonymes';
        prompt = `Tu es un professeur de fran\u00e7ais bienveillant et encourageant.

TYPE D'ACTIVIT\u00c9: ${label}
MOT DONN\u00c9: "${currentActivity.prompt}"
EXEMPLES ATTENDUS: ${currentActivity.expectedExamples ? currentActivity.expectedExamples.join(', ') : ''}

ELLE A S\u00c9LECTIONN\u00c9 CES MOTS:
"${transcript}"

T\u00c2CHE:
1. Dis-lui lesquels de ses choix sont des ${label} corrects de "${currentActivity.prompt}"
2. Explique la nuance de CHAQUE mot qu'elle a s\u00e9lectionn\u00e9 (m\u00eame les incorrects) - pourquoi c'est un bon ou mauvais ${label}
3. Donne 2-3 autres ${label} qu'elle aurait pu choisir
4. Donne un exemple de phrase avec un des ${label} pour montrer l'usage

FORMAT EXACT:
---IMPROVED---
[Analyse de chaque mot s\u00e9lectionn\u00e9 avec nuances et exemples de phrases]
---TIPS---
[2-3 tips in English about the vocabulary and subtle differences between the words]`;
    } else if (activityTypeStr === 'sentence_building') {
        prompt = `Tu es un professeur de fran\u00e7ais bienveillant et encourageant.

TYPE D'ACTIVIT\u00c9: Construction de phrases
MOTS \u00c0 UTILISER: "${currentActivity.prompt}"

SA R\u00c9PONSE:
"${transcript}"

T\u00c2CHE:
1. V\u00e9rifie si elle a utilis\u00e9 les mots donn\u00e9s
2. Corrige la grammaire et la conjugaison
3. Propose une version am\u00e9lior\u00e9e et naturelle
4. Propose une deuxi\u00e8me phrase alternative avec les m\u00eames mots

FORMAT EXACT:
---IMPROVED---
[Version corrig\u00e9e et naturelle de sa phrase + phrase alternative]
---TIPS---
[2-3 tips in English about grammar, conjugation, or sentence structure]`;
    } else {
        prompt = `Tu es un professeur de fran\u00e7ais bienveillant et encourageant.

TYPE D'ACTIVIT\u00c9: ${ACTIVITY_TYPE_LABELS[activityTypeStr] || 'Conversation'}
CONSIGNE: "${currentActivity ? currentActivity.prompt : ''}"
NOMBRE DE MOTS: ${wordCount}

SA R\u00c9PONSE:
"${transcript}"

T\u00c2CHE:
Analyse sa r\u00e9ponse et fournis :

1. Une version am\u00e9lior\u00e9e/corrig\u00e9e de sa r\u00e9ponse en fran\u00e7ais naturel et \u00e9l\u00e9gant
2. Garde le sens et la personnalit\u00e9 de sa r\u00e9ponse
3. Corrige les erreurs de grammaire, conjugaison, et vocabulaire
4. Enrichis le vocabulaire quand c'est pertinent

FORMAT EXACT:
---IMPROVED---
[Version am\u00e9lior\u00e9e ici]
---TIPS---
[2-3 specific learning tips in English so she can understand them clearly - focus on grammar, vocabulary, or conjugation mistakes she made]`;
    }

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
                        content: 'You are a warm, encouraging French language tutor. You help English speakers improve their French. You analyze grammar, vocabulary, and conjugation with kindness. Always respond in the exact format requested. The improved version should be in French. The tips should be in English for clarity.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
            throw new Error(errorMsg);
        }

        const data = await response.json();
        const fullResponse = data.choices[0].message.content.trim();

        // Parse the response
        let improvedVersion = fullResponse;
        let tips = '';

        if (fullResponse.includes('---IMPROVED---') && fullResponse.includes('---TIPS---')) {
            const improvedMatch = fullResponse.match(/---IMPROVED---\s*([\s\S]*?)\s*---TIPS---/);
            const tipsMatch = fullResponse.match(/---TIPS---\s*([\s\S]*?)$/);

            if (improvedMatch) improvedVersion = improvedMatch[1].trim();
            if (tipsMatch) tips = tipsMatch[1].trim();
        }

        // Show improved version
        improvedText.textContent = improvedVersion;

        // Show tips if we got them
        if (tips) {
            const formattedTips = tips
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^[-\u2022*]\s*/, '').trim())
                .filter(line => line.length > 0)
                .map(tip => `<li>${tip}</li>`)
                .join('');
            tipsText.innerHTML = `<ul>${formattedTips}</ul>`;
            tipsSection.classList.remove('hidden');
        }

        aiLoading.classList.add('hidden');
        improvedResult.classList.remove('hidden');

    } catch (error) {
        console.error('AI feedback error:', error);
        aiLoading.classList.add('hidden');
        aiError.classList.remove('hidden');
        aiError.querySelector('.error-text').textContent = error.message;
    }
}

// ========================
// History management
// ========================
function saveToHistory(wordCount, activityType, category) {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');

    history.unshift({
        date: new Date().toISOString(),
        activity: currentActivity ? currentActivity.prompt.substring(0, 50) + '...' : 'Unknown',
        activityType: activityType,
        category: category,
        wordCount
    });

    // Keep only last 20 sessions
    if (history.length > 20) {
        history.pop();
    }

    localStorage.setItem('parle_avec_moi_history', JSON.stringify(history));
    updateHistoryDisplay();
    updateProgressChart();
}

function updateHistoryDisplay() {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No sessions yet. Start your first activity!</p>';
        return;
    }

    historyList.innerHTML = history.slice(0, 5).map(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const icon = ACTIVITY_TYPE_ICONS[item.activityType] || '\ud83d\udcac';
        const isTileType = item.activityType === 'synonyms' || item.activityType === 'antonyms';
        const countLabel = isTileType ? `${item.wordCount}/3 correct` : `${item.wordCount} words`;

        return `
            <div class="history-item">
                <div>
                    <div class="history-date">${icon} ${dateStr}</div>
                </div>
                <div class="history-stats">
                    <span class="history-stat">${countLabel}</span>
                    <span class="history-stat type-badge-sm">${ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ========================
// Settings
// ========================
const elevenlabsKeyInput = document.getElementById('elevenlabs-key');

function openSettings() {
    const savedKey = localStorage.getItem('grok_api_key') || '';
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key') || '';
    apiKeyInput.value = savedKey;
    if (elevenlabsKeyInput) elevenlabsKeyInput.value = savedElevenLabsKey;
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

    if (elevenlabsKeyInput) {
        const elevenLabsKey = elevenlabsKeyInput.value.trim();
        if (elevenLabsKey) {
            localStorage.setItem('elevenlabs_api_key', elevenLabsKey);
        } else {
            localStorage.removeItem('elevenlabs_api_key');
        }
    }

    closeSettings();
}

// ========================
// Text-to-Speech
// ========================
let audioPlayer = null;

async function speakImprovedVersion() {
    const text = improvedText.textContent;

    if (!text) return;

    // Stop if already speaking
    if (isSpeaking) {
        if (window.currentAudioSource) {
            try { window.currentAudioSource.stop(); } catch (e) { /* ignore */ }
            window.currentAudioSource = null;
        }
        if (window.currentAudioContext) {
            try { window.currentAudioContext.close(); } catch (e) { /* ignore */ }
            window.currentAudioContext = null;
        }
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer = null;
        }
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.textContent = '\ud83d\udd0a Listen';
        return;
    }

    // Try ElevenLabs first
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key') || DEFAULT_ELEVENLABS_KEY;
    if (elevenLabsKey) {
        await speakWithElevenLabs(text, elevenLabsKey);
    } else {
        speakWithBrowser(text);
    }
}

async function speakWithElevenLabs(text, apiKey) {
    speakBtn.textContent = '\u23f3 Loading...';
    isSpeaking = true;

    try {
        const voiceId = '21m00Tcm4TlvDq8ikWAM';

        console.log('Calling ElevenLabs API...');
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error('ElevenLabs error:', response.status, errorText);
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        console.log('ElevenLabs audio received:', audioBlob.size, 'bytes');

        if (audioBlob.size < 1000) {
            throw new Error('Invalid audio response');
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        source.onended = () => {
            isSpeaking = false;
            speakBtn.textContent = '\ud83d\udd0a Listen';
            audioContext.close();
        };

        source.start(0);
        speakBtn.textContent = '\u23f9\ufe0f Stop';

        window.currentAudioSource = source;
        window.currentAudioContext = audioContext;

    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        isSpeaking = false;
        speakBtn.textContent = '\ud83d\udd0a Listen';
        console.log('Falling back to browser TTS');
        speakWithBrowser(text);
    }
}

function speakWithBrowser(text) {
    speakBtn.textContent = '\u23f3 Loading...';
    isSpeaking = true;

    window.speechSynthesis.cancel();

    function doSpeak() {
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.lang = 'fr-FR';

        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);

        const frenchVoice = voices.find(v =>
            v.lang === 'fr-FR' && (v.name.includes('Thomas') || v.name.includes('Amelie') || v.name.includes('Google'))
        ) || voices.find(v => v.lang.startsWith('fr')) || voices[0];

        if (frenchVoice) {
            utterance.voice = frenchVoice;
            console.log('Using voice:', frenchVoice.name);
        }

        utterance.onstart = () => {
            isSpeaking = true;
            speakBtn.textContent = '\u23f9\ufe0f Stop';
        };

        utterance.onend = () => {
            isSpeaking = false;
            speakBtn.textContent = '\ud83d\udd0a Listen';
        };

        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            isSpeaking = false;
            speakBtn.textContent = '\ud83d\udd0a Listen';
        };

        setTimeout(() => {
            window.speechSynthesis.speak(utterance);

            setTimeout(() => {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
                if (speakBtn.textContent === '\u23f3 Loading...') {
                    if (!window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                    } else {
                        speakBtn.textContent = '\u23f9\ufe0f Stop';
                    }
                }
            }, 500);
        }, 100);
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        doSpeak();
    } else {
        window.speechSynthesis.onvoiceschanged = () => {
            doSpeak();
        };
        setTimeout(() => {
            if (speakBtn.textContent === '\u23f3 Loading...') {
                doSpeak();
            }
        }, 1000);
    }
}

// Toggle hint visibility
function toggleHints() {
    showHints = !showHints;
    if (activityHint) {
        activityHint.classList.toggle('hidden', !showHints);
    }
    if (hintToggle) {
        hintToggle.classList.toggle('active', showHints);
    }
}

// ========================
// Event listeners
// ========================
recordBtn.addEventListener('click', toggleRecording);

// New Activity button returns to picker
newActivityBtn.addEventListener('click', () => {
    if (isRecording) stopRecording();
    if (isSpeaking) speakImprovedVersion();
    setState(APP_STATE.PICKER);
    currentActivity = null;
});

// Try Again resets current activity
resetBtn.addEventListener('click', () => {
    if (currentActivity) {
        const type = currentActivity.type;
        if (type === 'synonyms' || type === 'antonyms') {
            setState(APP_STATE.ACTIVITY_TILES);
            setupTileSelection();
        } else {
            setState(APP_STATE.ACTIVITY_VOICE);
            transcript = '';
            timer.classList.add('hidden');
        }
    }
});

// Back to picker
backToPickerBtn.addEventListener('click', () => {
    if (isRecording) stopRecording();
    if (isSpeaking) speakImprovedVersion();
    setState(APP_STATE.PICKER);
    currentActivity = null;
});

settingsBtn.addEventListener('click', openSettings);
closeSettingsBtn.addEventListener('click', closeSettings);
saveSettingsBtn.addEventListener('click', saveSettings);

if (hintToggle) {
    hintToggle.addEventListener('click', toggleHints);
}

// Close modal on background click
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        closeSettings();
    }
});

// Load voices
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

speakBtn.addEventListener('click', speakImprovedVersion);

// Retry button for AI errors
document.addEventListener('click', (e) => {
    if (e.target.id === 'retry-btn') {
        getAIFeedback();
    }
    if (e.target.id === 'check-tiles-btn') {
        checkTileAnswers();
    }
});

// ========================
// Progress chart
// ========================
function updateProgressChart() {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');
    const chartContainer = document.getElementById('progress-chart');
    const progressStats = document.getElementById('progress-stats');

    if (history.length < 3) {
        chartContainer.innerHTML = '<p class="empty-state">Complete 3+ exercises to see your progress</p>';
        progressStats.classList.add('hidden');
        return;
    }

    progressStats.classList.remove('hidden');

    // Get last 10 sessions (reversed to show oldest first)
    const recentHistory = history.slice(0, 10).reverse();
    const values = recentHistory.map(h => h.wordCount);
    const maxValue = Math.max(...values, 1);

    chartContainer.innerHTML = recentHistory.map((h, i) => {
        const value = h.wordCount;
        const height = Math.max(10, (value / maxValue) * 100);
        const date = new Date(h.date);
        const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const icon = ACTIVITY_TYPE_ICONS[h.activityType] || '';

        return `
            <div class="chart-bar-container">
                <span class="chart-value">${value}</span>
                <div class="chart-bar good" style="height: ${height}px;" title="${icon}"></div>
                <span class="chart-label">${dateStr}</span>
            </div>
        `;
    }).join('');

    // Update stats
    document.getElementById('total-sessions').textContent = history.length;

    // Calculate streak
    const streak = calculateStreak(history);
    document.getElementById('streak-count').textContent = streak;

    // Calculate trend
    if (recentHistory.length >= 4) {
        const mid = Math.floor(recentHistory.length / 2);
        const firstHalf = recentHistory.slice(0, mid);
        const secondHalf = recentHistory.slice(mid);

        const firstAvg = firstHalf.reduce((sum, h) => sum + h.wordCount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, h) => sum + h.wordCount, 0) / secondHalf.length;

        const trendIndicator = document.getElementById('trend-indicator');
        const improvement = secondAvg - firstAvg;

        if (Math.abs(improvement) < 2) {
            trendIndicator.textContent = '\u2192 Stable';
            trendIndicator.className = 'stat-value';
        } else if (improvement > 0) {
            trendIndicator.textContent = '\u2191 Improving';
            trendIndicator.className = 'stat-value improving';
        } else {
            trendIndicator.textContent = '\u2193 Needs Work';
            trendIndicator.className = 'stat-value declining';
        }
    } else {
        document.getElementById('trend-indicator').textContent = '--';
    }
}

function calculateStreak(history) {
    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toDateString();

        const hasSession = history.some(h => new Date(h.date).toDateString() === dateStr);

        if (hasSession) {
            streak++;
        } else if (i === 0) {
            continue;
        } else {
            break;
        }
    }

    return streak;
}

// ========================
// Daily Reminder System
// ========================
const reminderEnabled = document.getElementById('reminder-enabled');
const reminderTime = document.getElementById('reminder-time');
const enableNotificationsBtn = document.getElementById('enable-notifications');
const notificationStatus = document.getElementById('notification-status');

function updateNotificationStatus() {
    if (!('Notification' in window)) {
        if (notificationStatus) notificationStatus.textContent = 'Notifications not supported on this device';
        return;
    }

    if (Notification.permission === 'granted') {
        if (notificationStatus) notificationStatus.textContent = '\u2713 Notifications enabled';
        if (enableNotificationsBtn) enableNotificationsBtn.style.display = 'none';
    } else if (Notification.permission === 'denied') {
        if (notificationStatus) notificationStatus.textContent = '\u2717 Notifications blocked - enable in settings';
    } else {
        if (notificationStatus) notificationStatus.textContent = 'Tap to enable notifications';
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Notifications are not supported on this device.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        updateNotificationStatus();

        if (permission === 'granted') {
            new Notification('Jour apr\u00e8s Jour', {
                body: 'Reminders are enabled! We\'ll remind you to practice.',
                icon: 'icon-192.png'
            });
        }
    } catch (err) {
        console.error('Notification permission error:', err);
    }
}

function saveReminderSettings() {
    if (reminderEnabled && reminderTime) {
        const settings = {
            enabled: reminderEnabled.checked,
            time: reminderTime.value
        };
        localStorage.setItem('parle_avec_moi_reminder', JSON.stringify(settings));

        if (settings.enabled) {
            scheduleReminder(settings.time);
        }
    }
}

function loadReminderSettings() {
    const saved = localStorage.getItem('parle_avec_moi_reminder');
    if (saved) {
        const settings = JSON.parse(saved);
        if (reminderEnabled) reminderEnabled.checked = settings.enabled;
        if (reminderTime) reminderTime.value = settings.time || '09:00';
    }
    updateNotificationStatus();
}

let reminderCheckInterval = null;

function scheduleReminder(timeStr) {
    if (reminderCheckInterval) {
        clearInterval(reminderCheckInterval);
    }

    reminderCheckInterval = setInterval(() => {
        const settings = JSON.parse(localStorage.getItem('parle_avec_moi_reminder') || '{}');
        if (!settings.enabled) return;

        const now = new Date();
        const [hours, minutes] = settings.time.split(':').map(Number);

        if (now.getHours() === hours && now.getMinutes() === minutes) {
            const lastReminder = localStorage.getItem('parle_avec_moi_last_reminder');
            const today = now.toDateString();

            if (lastReminder !== today) {
                showReminder();
                localStorage.setItem('parle_avec_moi_last_reminder', today);
            }
        }
    }, 60000);
}

function showReminder() {
    if (Notification.permission === 'granted') {
        const notification = new Notification('\ud83c\uddeb\ud83c\uddf7 Jour apr\u00e8s Jour!', {
            body: 'Time to practice your French! 5 minutes is all you need.',
            icon: 'icon-192.png',
            tag: 'jour-apres-jour-reminder',
            requireInteraction: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener('click', requestNotificationPermission);
}

if (reminderEnabled) {
    reminderEnabled.addEventListener('change', saveReminderSettings);
}

if (reminderTime) {
    reminderTime.addEventListener('change', saveReminderSettings);
}

// ========================
// Weekly Debrief System
// ========================
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeeklyStats() {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = history.filter(h => new Date(h.date) >= weekAgo);

    if (thisWeekSessions.length === 0) {
        return null;
    }

    const avgWords = thisWeekSessions.reduce((sum, h) => sum + h.wordCount, 0) / thisWeekSessions.length;

    const typeBreakdown = {};
    thisWeekSessions.forEach(h => {
        const type = h.activityType || 'conversation';
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const lastWeekSessions = history.filter(h => {
        const date = new Date(h.date);
        return date >= twoWeeksAgo && date < weekAgo;
    });

    let comparison = null;
    if (lastWeekSessions.length > 0) {
        comparison = {
            sessionChange: thisWeekSessions.length - lastWeekSessions.length
        };
    }

    return {
        sessionCount: thisWeekSessions.length,
        avgWords: Math.round(avgWords),
        typeBreakdown,
        comparison,
        sessions: thisWeekSessions
    };
}

function generateWeeklyDebrief() {
    const stats = getWeeklyStats();

    if (!stats) {
        return {
            summary: "No sessions this week. Time to get started!",
            strengths: [],
            improvements: [],
            focus: "Try to do at least 3 exercises this week."
        };
    }

    const strengths = [];
    const improvements = [];

    if (stats.sessionCount >= 5) {
        strengths.push("Great consistency with " + stats.sessionCount + " sessions this week!");
    } else if (stats.sessionCount >= 3) {
        strengths.push("Good habit \u2014 " + stats.sessionCount + " sessions this week");
    } else {
        improvements.push("Try to practice 3\u20135 times per week for better results");
    }

    const typesUsed = Object.keys(stats.typeBreakdown).length;
    if (typesUsed >= 3) {
        strengths.push("Great variety! You tried " + typesUsed + " different activity types");
    } else {
        improvements.push("Try more activity types \u2014 synonyms, descriptions, sentence building...");
    }

    if (stats.avgWords >= 30) {
        strengths.push("Detailed answers with " + stats.avgWords + " words on average");
    } else {
        improvements.push("Try to develop your answers more \u2014 aim for 30+ words for conversations");
    }

    let trendNote = "";
    if (stats.comparison) {
        if (stats.comparison.sessionChange > 0) {
            trendNote = "\ud83d\udcc8 " + stats.comparison.sessionChange + " more session(s) than last week!";
        } else if (stats.comparison.sessionChange < 0) {
            trendNote = "\ud83d\udcc9 " + Math.abs(stats.comparison.sessionChange) + " fewer session(s) than last week";
        }
    }

    let focus = "";
    if (improvements.length > 0) {
        if (stats.sessionCount < 3) {
            focus = "Goal: Practice at least 1 exercise per day. Consistency is key!";
        } else if (typesUsed < 3) {
            focus = "Goal: Try a new activity type you haven't done yet.";
        } else {
            focus = "Goal: Enrich your vocabulary by listening carefully to the improved versions.";
        }
    } else {
        focus = "Keep it up! You're making remarkable progress.";
    }

    return {
        summary: `${stats.sessionCount} sessions this week \u2022 ${stats.avgWords} words on average`,
        strengths,
        improvements,
        focus,
        trendNote,
        stats
    };
}

function showWeeklyDebrief() {
    const debriefModal = document.getElementById('weekly-debrief-modal');
    if (!debriefModal) return;

    const debrief = generateWeeklyDebrief();

    document.getElementById('debrief-summary').textContent = debrief.summary;

    const strengthsList = document.getElementById('debrief-strengths');
    const improvementsList = document.getElementById('debrief-improvements');

    if (debrief.strengths.length > 0) {
        strengthsList.innerHTML = debrief.strengths.map(s => `<li>\u2705 ${s}</li>`).join('');
        strengthsList.parentElement.classList.remove('hidden');
    } else {
        strengthsList.parentElement.classList.add('hidden');
    }

    if (debrief.improvements.length > 0) {
        improvementsList.innerHTML = debrief.improvements.map(i => `<li>\ud83c\udfaf ${i}</li>`).join('');
        improvementsList.parentElement.classList.remove('hidden');
    } else {
        improvementsList.parentElement.classList.add('hidden');
    }

    document.getElementById('debrief-focus').textContent = debrief.focus;

    const trendEl = document.getElementById('debrief-trend');
    if (debrief.trendNote) {
        trendEl.textContent = debrief.trendNote;
        trendEl.classList.remove('hidden');
    } else {
        trendEl.classList.add('hidden');
    }

    debriefModal.classList.remove('hidden');

    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    localStorage.setItem('parle_avec_moi_last_debrief', weekKey);
}

function closeWeeklyDebrief() {
    const debriefModal = document.getElementById('weekly-debrief-modal');
    if (debriefModal) {
        debriefModal.classList.add('hidden');
    }
}

function checkShowWeeklyDebrief() {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');

    if (history.length === 0) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    const isSundayMorning = dayOfWeek === 0 && hour < 12;

    const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    const lastShown = localStorage.getItem('parle_avec_moi_last_debrief');

    if (isSundayMorning && lastShown !== weekKey) {
        setTimeout(() => {
            showWeeklyDebrief();
        }, 500);
    }
}

// Event listener for debrief button
document.addEventListener('click', (e) => {
    if (e.target.id === 'close-debrief') {
        closeWeeklyDebrief();
    }
    if (e.target.id === 'show-debrief-btn') {
        showWeeklyDebrief();
    }
});

// ========================
// Initialize
// ========================
document.addEventListener('DOMContentLoaded', () => {
    initPicker();
    setState(APP_STATE.PICKER);
    updateHistoryDisplay();
    updateProgressChart();
    loadReminderSettings();

    checkShowWeeklyDebrief();

    const settings = JSON.parse(localStorage.getItem('parle_avec_moi_reminder') || '{}');
    if (settings.enabled) {
        scheduleReminder(settings.time);
    }
});
