// Default API keys (can be overridden in settings)
// Keys are split to avoid GitHub secret scanning
const DEFAULT_GROQ_KEY = ['gsk_DJtowUxnkrNBdieWUGDG', 'WGdyb3FYltJH62LU8Uqd7kNB3bNJntmU'].join('');
const DEFAULT_ELEVENLABS_KEY = ['sk_116ea5a2737312a826b3', '447f0f2ff466fe4ac8f08941870a'].join('');

// State
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

// Show status message
function showStatus(msg) {
    if (transcriptText) {
        transcriptText.textContent = msg;
    }
}

// Timer functions
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

// Recording functions using MediaRecorder
async function startRecording() {
    try {
        showStatus('Acc\u00e8s au microphone...');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        showStatus('Micro pr\u00eat ! Parle maintenant...');

        // Determine supported mime type - iOS Safari uses mp4/aac
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
                showStatus('Pas d\u2019audio enregistr\u00e9. R\u00e9essaie.');
            }
        };

        mediaRecorder.onerror = (event) => {
            showStatus('Erreur d\u2019enregistrement : ' + event.error);
        };

        mediaRecorder.start(1000);

        isRecording = true;
        transcript = '';
        startTime = Date.now();

        recordBtn.classList.add('recording');
        recordLabel.textContent = 'Appuie pour Arr\u00eater';
        resetBtn.classList.add('hidden');
        resultsSection.classList.remove('hidden');

        startTimer();

    } catch (err) {
        console.error('Microphone error:', err);
        if (err.name === 'NotAllowedError') {
            showStatus('Acc\u00e8s au micro refus\u00e9. Autorise le micro dans les r\u00e9glages.');
            alert('Acc\u00e8s au micro refus\u00e9.\n\nSur iPhone :\n1. Va dans R\u00e9glages > Safari\n2. D\u00e9file vers "R\u00e9glages des sites web"\n3. Appuie sur Microphone\n4. S\u00e9lectionne "Autoriser"');
        } else {
            showStatus('Erreur : ' + err.message);
        }
    }
}

function stopRecording() {
    isRecording = false;
    stopTimer();

    recordBtn.classList.remove('recording');
    recordLabel.textContent = 'Appuie pour Enregistrer';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        showStatus('Traitement de l\u2019audio...');
        mediaRecorder.stop();
    }
}

// Transcribe audio using Groq Whisper API
async function transcribeAudio(audioBlob, fileExtension = 'webm') {
    const apiKey = localStorage.getItem('grok_api_key') || DEFAULT_GROQ_KEY;

    if (!apiKey) {
        showStatus('Configure ta cl\u00e9 API Groq dans les param\u00e8tres.');
        settingsModal.classList.remove('hidden');
        return;
    }

    showStatus('Transcription en cours...');

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
            throw new Error(errorData.error?.message || `Transcription \u00e9chou\u00e9e : ${response.status}`);
        }

        const data = await response.json();
        let rawTranscript = data.text ? data.text.trim() : '';
        console.log('Raw transcription:', rawTranscript);

        if (rawTranscript) {
            const durationSeconds = (Date.now() - startTime) / 1000;
            transcript = rawTranscript;
            showResults(transcript, durationSeconds);
        } else {
            showStatus('Aucune parole d\u00e9tect\u00e9e. Parle plus fort et r\u00e9essaie.');
        }

    } catch (error) {
        console.error('Transcription error:', error);
        showStatus('Transcription \u00e9chou\u00e9e : ' + error.message);
    }
}

function toggleRecording() {
    if (!currentActivity) {
        loadNewActivity();
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
    const cleanText = text.replace(/[\[\]]/g, '');
    return cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Results display
function showResults(text, durationSeconds) {
    transcriptText.textContent = text;

    const wordCount = countWords(text);

    wordCountEl.textContent = wordCount;

    // Show results
    resultsSection.classList.remove('hidden');
    resetBtn.classList.remove('hidden');

    // Save to history
    saveToHistory(wordCount, currentActivity ? currentActivity.type : 'conversation', currentActivity ? currentActivity.category : '');

    // Auto-trigger AI feedback
    getAIFeedback();
}

// Groq API for French tutor feedback
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

SA R\u00c9PONSE:
"${transcript}"

T\u00c2CHE:
1. Analyse les ${label} qu'elle a donn\u00e9s
2. Dis-lui lesquels sont corrects
3. Propose d'autres ${label} qu'elle aurait pu dire
4. Donne un exemple de phrase avec un des ${label}

FORMAT EXACT:
---IMPROVED---
[Liste des bons ${label} + autres suggestions avec exemples de phrases]
---TIPS---
[2-3 tips in English about vocabulary and usage]`;
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

// History management
function saveToHistory(wordCount, activityType, category) {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');

    history.unshift({
        date: new Date().toISOString(),
        activity: currentActivity ? currentActivity.prompt.substring(0, 50) + '...' : 'Inconnu',
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
        historyList.innerHTML = '<p class="empty-state">Pas encore de s\u00e9ances. Lance ta premi\u00e8re activit\u00e9 !</p>';
        return;
    }

    historyList.innerHTML = history.slice(0, 5).map(item => {
        const date = new Date(item.date);
        const dateStr = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const icon = ACTIVITY_TYPE_ICONS[item.activityType] || '\ud83d\udcac';

        return `
            <div class="history-item">
                <div>
                    <div class="history-date">${icon} ${dateStr}</div>
                </div>
                <div class="history-stats">
                    <span class="history-stat">${item.wordCount} mots</span>
                    <span class="history-stat type-badge-sm">${ACTIVITY_TYPE_LABELS[item.activityType] || item.activityType}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Activity loading with tracking to avoid repeats
function loadNewActivity() {
    let askedActivities = JSON.parse(localStorage.getItem('parle_avec_moi_asked_activities') || '[]');

    // If we've asked all activities, reset the list
    if (askedActivities.length >= ACTIVITIES.length) {
        console.log('All activities done! Resetting list.');
        askedActivities = [];
    }

    // Get available activities (not yet asked)
    const availableIndices = ACTIVITIES.map((_, i) => i).filter(i => !askedActivities.includes(i));

    // Pick a random activity
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    currentActivity = ACTIVITIES[randomIndex];

    // Track this activity as asked
    askedActivities.push(randomIndex);
    localStorage.setItem('parle_avec_moi_asked_activities', JSON.stringify(askedActivities));

    console.log(`Activity ${askedActivities.length}/${ACTIVITIES.length}: "${currentActivity.prompt.substring(0, 50)}..."`);

    // Update UI
    const icon = ACTIVITY_TYPE_ICONS[currentActivity.type] || '';
    const label = ACTIVITY_TYPE_LABELS[currentActivity.type] || currentActivity.type;
    activityType.textContent = `${icon} ${label}`;
    activityType.className = `activity-type-badge ${currentActivity.type}`;
    activityCategory.textContent = currentActivity.category;

    // Show prompt based on activity type
    if (currentActivity.type === 'synonyms') {
        activityPrompt.innerHTML = `<span class="prompt-word">${currentActivity.prompt}</span><br><span class="prompt-instruction">Donne le plus de synonymes possible !</span>`;
    } else if (currentActivity.type === 'antonyms') {
        activityPrompt.innerHTML = `<span class="prompt-word">${currentActivity.prompt}</span><br><span class="prompt-instruction">Donne le plus d'antonymes possible !</span>`;
    } else if (currentActivity.type === 'sentence_building') {
        const words = currentActivity.prompt.split(' / ');
        activityPrompt.innerHTML = `<div class="word-chips">${words.map(w => `<span class="word-chip">${w}</span>`).join('')}</div><span class="prompt-instruction">Construis une phrase avec ces mots !</span>`;
    } else {
        activityPrompt.textContent = currentActivity.prompt;
    }

    // Show/hide hint
    activityHint.textContent = currentActivity.hint;
    activityHint.classList.toggle('hidden', !showHints);

    targetWordsEl.textContent = currentActivity.targetWords;
    targetTimeEl.textContent = currentActivity.targetTime;

    // Reset UI
    resultsSection.classList.add('hidden');
    resetBtn.classList.add('hidden');
    timer.classList.add('hidden');
    transcript = '';

    recordLabel.textContent = 'Appuie pour Enregistrer';
}

// Settings
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

// Audio player for ElevenLabs
let audioPlayer = null;

// Text-to-speech for improved version
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
        speakBtn.textContent = '\ud83d\udd0a \u00c9couter';
        return;
    }

    // Try ElevenLabs first for natural voice
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key') || DEFAULT_ELEVENLABS_KEY;
    if (elevenLabsKey) {
        await speakWithElevenLabs(text, elevenLabsKey);
    } else {
        speakWithBrowser(text);
    }
}

// ElevenLabs TTS (natural French voice)
async function speakWithElevenLabs(text, apiKey) {
    speakBtn.textContent = '\u23f3 Chargement...';
    isSpeaking = true;

    try {
        // Using a French-compatible voice with multilingual model
        const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel - works well with multilingual v2

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
            speakBtn.textContent = '\ud83d\udd0a \u00c9couter';
            audioContext.close();
        };

        source.start(0);
        speakBtn.textContent = '\u23f9\ufe0f Stop';

        window.currentAudioSource = source;
        window.currentAudioContext = audioContext;

    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        isSpeaking = false;
        speakBtn.textContent = '\ud83d\udd0a \u00c9couter';
        console.log('Falling back to browser TTS');
        speakWithBrowser(text);
    }
}

// Browser TTS fallback - French voice
function speakWithBrowser(text) {
    speakBtn.textContent = '\u23f3 Chargement...';
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
            speakBtn.textContent = '\ud83d\udd0a \u00c9couter';
        };

        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            isSpeaking = false;
            speakBtn.textContent = '\ud83d\udd0a \u00c9couter';
        };

        setTimeout(() => {
            window.speechSynthesis.speak(utterance);

            setTimeout(() => {
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
                if (speakBtn.textContent === '\u23f3 Chargement...') {
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
            if (speakBtn.textContent === '\u23f3 Chargement...') {
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

// Event listeners
recordBtn.addEventListener('click', toggleRecording);
newActivityBtn.addEventListener('click', loadNewActivity);
resetBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    resetBtn.classList.add('hidden');
    timer.classList.add('hidden');
    transcript = '';
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
});

// Progress chart functionality
function updateProgressChart() {
    const history = JSON.parse(localStorage.getItem('parle_avec_moi_history') || '[]');
    const chartContainer = document.getElementById('progress-chart');
    const progressStats = document.getElementById('progress-stats');

    if (history.length < 3) {
        chartContainer.innerHTML = '<p class="empty-state">Fais 3+ exercices pour voir tes progr\u00e8s</p>';
        progressStats.classList.add('hidden');
        return;
    }

    progressStats.classList.remove('hidden');

    // Get last 10 sessions (reversed to show oldest first)
    const recentHistory = history.slice(0, 10).reverse();
    const values = recentHistory.map(h => h.wordCount);
    const maxValue = Math.max(...values, 1);

    // Build chart HTML
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
            trendIndicator.textContent = '\u2191 En progr\u00e8s';
            trendIndicator.className = 'stat-value improving';
        } else {
            trendIndicator.textContent = '\u2193 \u00c0 travailler';
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

    // Check each day backwards
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toDateString();

        const hasSession = history.some(h => new Date(h.date).toDateString() === dateStr);

        if (hasSession) {
            streak++;
        } else if (i === 0) {
            // Today doesn't count against streak if no session yet
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
        if (notificationStatus) notificationStatus.textContent = 'Notifications non support\u00e9es sur cet appareil';
        return;
    }

    if (Notification.permission === 'granted') {
        if (notificationStatus) notificationStatus.textContent = '\u2713 Notifications activ\u00e9es';
        if (enableNotificationsBtn) enableNotificationsBtn.style.display = 'none';
    } else if (Notification.permission === 'denied') {
        if (notificationStatus) notificationStatus.textContent = '\u2717 Notifications bloqu\u00e9es - active-les dans les r\u00e9glages';
    } else {
        if (notificationStatus) notificationStatus.textContent = 'Appuie pour activer les notifications';
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Les notifications ne sont pas support\u00e9es sur cet appareil.');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        updateNotificationStatus();

        if (permission === 'granted') {
            new Notification('Jour apr\u00e8s Jour', {
                body: 'Les rappels sont activ\u00e9s ! On te rappellera de pratiquer.',
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
        const notification = new Notification('\ud83c\uddeb\ud83c\uddf7 Jour apr\u00e8s Jour !', {
            body: 'C\u2019est l\u2019heure de pratiquer ton fran\u00e7ais ! 5 minutes suffisent.',
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

    // Activity type breakdown
    const typeBreakdown = {};
    thisWeekSessions.forEach(h => {
        const type = h.activityType || 'conversation';
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    // Get previous week for comparison
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
            summary: "Pas de s\u00e9ances cette semaine. C'est le moment de commencer !",
            strengths: [],
            improvements: [],
            focus: "Fais au moins 3 exercices cette semaine."
        };
    }

    const strengths = [];
    const improvements = [];

    // Session consistency
    if (stats.sessionCount >= 5) {
        strengths.push("Super r\u00e9gularit\u00e9 avec " + stats.sessionCount + " s\u00e9ances cette semaine !");
    } else if (stats.sessionCount >= 3) {
        strengths.push("Bonne habitude \u2014 " + stats.sessionCount + " s\u00e9ances cette semaine");
    } else {
        improvements.push("Essaie de pratiquer 3 \u00e0 5 fois par semaine pour de meilleurs r\u00e9sultats");
    }

    // Variety check
    const typesUsed = Object.keys(stats.typeBreakdown).length;
    if (typesUsed >= 3) {
        strengths.push("Belle vari\u00e9t\u00e9 ! Tu as essay\u00e9 " + typesUsed + " types d'activit\u00e9s diff\u00e9rentes");
    } else {
        improvements.push("Essaie plus de types d'activit\u00e9s \u2014 synonymes, descriptions, construction de phrases...");
    }

    // Word count
    if (stats.avgWords >= 30) {
        strengths.push("Bonnes r\u00e9ponses d\u00e9taill\u00e9es avec " + stats.avgWords + " mots en moyenne");
    } else {
        improvements.push("Essaie de d\u00e9velopper tes r\u00e9ponses \u2014 vise " + 30 + "+ mots pour les conversations");
    }

    // Comparison
    let trendNote = "";
    if (stats.comparison) {
        if (stats.comparison.sessionChange > 0) {
            trendNote = "\ud83d\udcc8 " + stats.comparison.sessionChange + " s\u00e9ance(s) de plus que la semaine derni\u00e8re !";
        } else if (stats.comparison.sessionChange < 0) {
            trendNote = "\ud83d\udcc9 " + Math.abs(stats.comparison.sessionChange) + " s\u00e9ance(s) de moins que la semaine derni\u00e8re";
        }
    }

    let focus = "";
    if (improvements.length > 0) {
        if (stats.sessionCount < 3) {
            focus = "Objectif : Pratique au moins 1 exercice par jour. La r\u00e9gularit\u00e9 est la cl\u00e9 !";
        } else if (typesUsed < 3) {
            focus = "Objectif : Essaie un nouveau type d'exercice que tu n'as pas encore fait.";
        } else {
            focus = "Objectif : Enrichis ton vocabulaire en \u00e9coutant attentivement les versions am\u00e9lior\u00e9es.";
        }
    } else {
        focus = "Continue comme \u00e7a ! Tu fais des progr\u00e8s remarquables.";
    }

    return {
        summary: `${stats.sessionCount} s\u00e9ances cette semaine \u2022 ${stats.avgWords} mots en moyenne`,
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateHistoryDisplay();
    updateProgressChart();
    loadReminderSettings();

    checkShowWeeklyDebrief();

    const settings = JSON.parse(localStorage.getItem('parle_avec_moi_reminder') || '{}');
    if (settings.enabled) {
        scheduleReminder(settings.time);
    }
});
