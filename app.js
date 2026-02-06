// State
let currentQuestion = null;
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
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

// Show status message
function showStatus(msg) {
    if (transcriptText) {
        transcriptText.textContent = msg;
    }
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

// Recording functions using MediaRecorder
async function startRecording() {
    try {
        showStatus('Requesting microphone...');

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        showStatus('Microphone ready! Speak now...');

        // Determine supported mime type - iOS Safari uses mp4/aac
        let mimeType = '';
        let fileExtension = 'webm';

        // Check supported formats in order of preference for Whisper API
        const formats = [
            { mime: 'audio/webm;codecs=opus', ext: 'webm' },
            { mime: 'audio/webm', ext: 'webm' },
            { mime: 'audio/mp4', ext: 'm4a' },
            { mime: 'audio/aac', ext: 'aac' },
            { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
            { mime: 'audio/wav', ext: 'wav' },
            { mime: '', ext: 'webm' } // default fallback
        ];

        for (const format of formats) {
            if (format.mime === '' || MediaRecorder.isTypeSupported(format.mime)) {
                mimeType = format.mime;
                fileExtension = format.ext;
                console.log('Using audio format:', mimeType || 'default');
                break;
            }
        }

        // Create MediaRecorder with or without explicit mimeType
        const recorderOptions = mimeType ? { mimeType } : {};
        mediaRecorder = new MediaRecorder(stream, recorderOptions);

        // Store extension for later use
        mediaRecorder.fileExtension = fileExtension;
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());

            if (audioChunks.length > 0) {
                const blobType = mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunks, { type: blobType });
                console.log('Audio blob size:', audioBlob.size, 'type:', blobType);
                await transcribeAudio(audioBlob, mediaRecorder.fileExtension);
            } else {
                showStatus('No audio recorded. Please try again.');
            }
        };

        mediaRecorder.onerror = (event) => {
            showStatus('Recording error: ' + event.error);
        };

        // Start recording
        mediaRecorder.start(1000); // Collect data every second

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
            showStatus('Microphone access denied. Please allow microphone in Settings > Safari.');
            alert('Microphone access denied.\n\nOn iPhone:\n1. Go to Settings > Safari\n2. Scroll to "Settings for Websites"\n3. Tap Microphone\n4. Set to "Allow"');
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
    const apiKey = localStorage.getItem('grok_api_key');

    if (!apiKey) {
        showStatus('Please set your Groq API key in settings first.');
        settingsModal.classList.remove('hidden');
        return;
    }

    showStatus('Transcribing with AI...');

    try {
        // Create form data with audio file - use correct extension for iOS
        const filename = `recording.${fileExtension}`;
        console.log('Sending audio file:', filename, 'size:', audioBlob.size);

        const formData = new FormData();
        formData.append('file', audioBlob, filename);
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'en');
        formData.append('response_format', 'text');

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

        transcript = await response.text();
        transcript = transcript.trim();

        if (transcript) {
            const durationSeconds = (Date.now() - startTime) / 1000;
            showResults(transcript, durationSeconds);
        } else {
            showStatus('No speech detected. Please speak louder and try again.');
        }

    } catch (error) {
        console.error('Transcription error:', error);
        showStatus('Transcription failed: ' + error.message);
    }
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

// Groq API for rewrite with coaching feedback
async function getRewrite() {
    const apiKey = localStorage.getItem('grok_api_key');

    if (!apiKey) {
        settingsModal.classList.remove('hidden');
        return;
    }

    rewriteBtn.classList.add('hidden');
    rewriteLoading.classList.remove('hidden');
    rewriteError.classList.add('hidden');

    // Hide previous feedback
    const feedbackSection = document.getElementById('coaching-feedback');
    if (feedbackSection) feedbackSection.classList.add('hidden');

    const fillers = findFillers(transcript);
    const longestSentence = getLongestSentence(transcript);
    const wordCount = countWords(transcript);
    const targetWordCount = currentQuestion ? currentQuestion.targetWords : 120;

    const prompt = `You are an executive communication coach helping a French professional sound like a polished American business leader.

CONTEXT:
- Question: "${currentQuestion ? currentQuestion.question : 'Interview question'}"
- Target word count: ${targetWordCount} words
- Their answer: ${wordCount} words
- Fillers detected: ${fillers.length > 0 ? fillers.join(', ') : 'none'}
- Longest sentence: ${longestSentence} words

THEIR ORIGINAL ANSWER:
"${transcript}"

YOUR TASK:
Provide TWO things in your response, clearly separated:

PART 1 - CRISP VERSION:
Rewrite their answer following these principles:
- Lead with the headline (main point first, then support)
- Keep ALL important context, examples, and specifics - don't oversimplify
- Remove filler words and verbal padding
- Break run-on sentences (max 20 words each)
- Use active voice and strong verbs
- Maintain their authentic voice and personality
- Target ${Math.round(targetWordCount * 0.9)}-${targetWordCount} words (preserve substance!)

PART 2 - COACHING TIPS:
Give 2-3 specific, actionable tips based on THEIR answer. Be specific about what they said vs what to say. Examples:
- "You started with context. Try: '[Main point]. Here's why...' instead of 'So basically what happened was...'"
- "Your 35-word sentence about X could be two punchy ones"
- "Replace 'kind of' and 'sort of' with confident statements"

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
---CRISP---
[The rewritten answer here]
---TIPS---
[2-3 bullet points with specific coaching tips]`;

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
                        content: 'You are an elite executive communication coach. You help non-native English speakers sound crisp, confident, and natural - like polished American executives. You preserve substance while cutting fluff. Always respond in the exact format requested.'
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
        let crispVersion = fullResponse;
        let tips = '';

        if (fullResponse.includes('---CRISP---') && fullResponse.includes('---TIPS---')) {
            const crispMatch = fullResponse.match(/---CRISP---\s*([\s\S]*?)\s*---TIPS---/);
            const tipsMatch = fullResponse.match(/---TIPS---\s*([\s\S]*?)$/);

            if (crispMatch) crispVersion = crispMatch[1].trim();
            if (tipsMatch) tips = tipsMatch[1].trim();
        }

        // Show crisp version
        rewriteText.textContent = crispVersion;
        const originalWords = countWords(transcript);
        const newWords = countWords(crispVersion);
        const reduction = Math.round((1 - newWords / originalWords) * 100);

        rewriteWordCount.textContent = `${newWords} words`;
        rewriteReduction.textContent = reduction > 0 ? `${reduction}% shorter` : `${Math.abs(reduction)}% longer`;

        // Show coaching tips if we got them
        if (tips && feedbackSection) {
            const feedbackText = document.getElementById('feedback-text');
            if (feedbackText) {
                // Format tips as bullet points
                const formattedTips = tips
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => line.replace(/^[-•*]\s*/, '').trim())
                    .filter(line => line.length > 0)
                    .map(tip => `<li>${tip}</li>`)
                    .join('');
                feedbackText.innerHTML = `<ul>${formattedTips}</ul>`;
                feedbackSection.classList.remove('hidden');
            }
        }

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
    updateProgressChart();
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

    // Save ElevenLabs key
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

// Text-to-speech for crisp version
async function speakCrispVersion() {
    const text = rewriteText.textContent;

    if (!text) return;

    // Stop if already speaking
    if (isSpeaking) {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            audioPlayer = null;
        }
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.textContent = '🔊 Listen';
        return;
    }

    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');

    // Use ElevenLabs if key is available
    if (elevenLabsKey) {
        await speakWithElevenLabs(text, elevenLabsKey);
    } else {
        speakWithBrowser(text);
    }
}

// ElevenLabs TTS (natural voice)
async function speakWithElevenLabs(text, apiKey) {
    speakBtn.textContent = '⏳ Loading...';

    try {
        // Using "Rachel" voice - professional American female
        // Other good options: "Drew" (male), "Clyde" (male), "Domi" (female)
        const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.0,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('ElevenLabs error:', error);
            // Fallback to browser TTS
            speakWithBrowser(text);
            return;
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        audioPlayer = new Audio(audioUrl);

        audioPlayer.onplay = () => {
            isSpeaking = true;
            speakBtn.textContent = '⏹️ Stop';
        };

        audioPlayer.onended = () => {
            isSpeaking = false;
            speakBtn.textContent = '🔊 Listen';
            URL.revokeObjectURL(audioUrl);
            audioPlayer = null;
        };

        audioPlayer.onerror = () => {
            isSpeaking = false;
            speakBtn.textContent = '🔊 Listen';
            URL.revokeObjectURL(audioUrl);
            audioPlayer = null;
            // Fallback to browser TTS
            speakWithBrowser(text);
        };

        audioPlayer.play();

    } catch (error) {
        console.error('ElevenLabs TTS error:', error);
        speakBtn.textContent = '🔊 Listen';
        // Fallback to browser TTS
        speakWithBrowser(text);
    }
}

// Browser TTS fallback
function speakWithBrowser(text) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Configure for clear American English
    utterance.rate = 0.95;
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

// Load voices (needed for some browsers)
if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

speakBtn.addEventListener('click', speakCrispVersion);

// Progress chart functionality
function updateProgressChart() {
    const history = JSON.parse(localStorage.getItem('voice_drill_history') || '[]');
    const chartContainer = document.getElementById('progress-chart');
    const progressStats = document.getElementById('progress-stats');
    const metricSelect = document.getElementById('progress-metric');

    if (history.length < 3) {
        chartContainer.innerHTML = '<p class="empty-state">Complete 3+ drills to see your progress</p>';
        progressStats.classList.add('hidden');
        return;
    }

    progressStats.classList.remove('hidden');
    const metric = metricSelect ? metricSelect.value : 'fillers';

    // Get last 10 sessions (reversed to show oldest first)
    const recentHistory = history.slice(0, 10).reverse();

    // Get metric values and thresholds
    const metricConfig = {
        fillers: {
            getValue: (h) => h.fillerCount,
            goodMax: 2,
            warnMax: 5,
            label: 'fillers',
            lowerIsBetter: true
        },
        pace: {
            getValue: (h) => h.pace,
            goodMin: 140,
            goodMax: 170,
            warnMin: 120,
            warnMax: 180,
            label: 'wpm',
            lowerIsBetter: false
        },
        words: {
            getValue: (h) => h.wordCount,
            goodMax: 130,
            warnMax: 160,
            label: 'words',
            lowerIsBetter: true
        },
        longest: {
            getValue: (h) => h.longestSentence,
            goodMax: 25,
            warnMax: 35,
            label: 'words',
            lowerIsBetter: true
        }
    };

    const config = metricConfig[metric];
    const values = recentHistory.map(h => config.getValue(h));
    const maxValue = Math.max(...values, 1);

    // Calculate status for each value
    const getStatus = (value) => {
        if (metric === 'pace') {
            if (value >= config.goodMin && value <= config.goodMax) return 'good';
            if (value >= config.warnMin && value <= config.warnMax) return 'warning';
            return 'bad';
        }
        if (value <= config.goodMax) return 'good';
        if (value <= config.warnMax) return 'warning';
        return 'bad';
    };

    // Build chart HTML
    chartContainer.innerHTML = recentHistory.map((h, i) => {
        const value = config.getValue(h);
        const height = Math.max(10, (value / maxValue) * 100);
        const status = getStatus(value);
        const date = new Date(h.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
            <div class="chart-bar-container">
                <span class="chart-value">${value}</span>
                <div class="chart-bar ${status}" style="height: ${height}px;"></div>
                <span class="chart-label">${dateStr}</span>
            </div>
        `;
    }).join('');

    // Update stats
    document.getElementById('total-sessions').textContent = history.length;

    const avgFillers = (history.reduce((sum, h) => sum + h.fillerCount, 0) / history.length).toFixed(1);
    document.getElementById('avg-fillers').textContent = avgFillers;

    // Calculate trend (compare first half to second half of recent sessions)
    if (recentHistory.length >= 4) {
        const mid = Math.floor(recentHistory.length / 2);
        const firstHalf = recentHistory.slice(0, mid);
        const secondHalf = recentHistory.slice(mid);

        const firstAvg = firstHalf.reduce((sum, h) => sum + config.getValue(h), 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, h) => sum + config.getValue(h), 0) / secondHalf.length;

        const trendIndicator = document.getElementById('trend-indicator');
        const improvement = config.lowerIsBetter ? firstAvg - secondAvg : secondAvg - firstAvg;

        if (Math.abs(improvement) < 0.5) {
            trendIndicator.textContent = '→ Stable';
            trendIndicator.className = 'stat-value';
        } else if (improvement > 0) {
            trendIndicator.textContent = '↑ Improving';
            trendIndicator.className = 'stat-value improving';
        } else {
            trendIndicator.textContent = '↓ Needs work';
            trendIndicator.className = 'stat-value declining';
        }
    } else {
        document.getElementById('trend-indicator').textContent = '--';
    }
}

// Event listener for metric selector
const metricSelect = document.getElementById('progress-metric');
if (metricSelect) {
    metricSelect.addEventListener('change', updateProgressChart);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateHistoryDisplay();
    updateProgressChart();
});
