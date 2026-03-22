let quizData = [];
let currentQuestionIndex = 0;
let timerInterval;
let answerAccepted = false;
let isPaused = false;
let breakTimer = null;

// Settings
let timerDuration = 5000;
let shouldShuffle = true;
const BREAK_DURATION = 2000;

const setupScreen        = document.getElementById('setup-screen');
const quizScreen         = document.getElementById('quiz-screen');
const startBtn           = document.getElementById('start-btn');
const settingsBtn        = document.getElementById('settings-btn');
const settingsModal      = document.getElementById('settings-modal');
const saveSettingsBtn    = document.getElementById('save-settings-btn');
const secondsInput       = document.getElementById('seconds-input');
const shuffleToggle      = document.getElementById('shuffle-toggle');

const questionsFileInput = document.getElementById('questions-file');
const answersFileInput   = document.getElementById('answers-file');
const questionStem       = document.getElementById('question-stem');
const optionsList        = document.getElementById('options-list');
const timerBar           = document.getElementById('timer-bar');
const voiceStatus        = document.getElementById('voice-status');
const resultStatus       = document.getElementById('result-status');
const pauseBtn           = document.getElementById('pause-btn');
const pauseOverlay      = document.getElementById('pause-overlay');

// ── Settings Logic ──────────────────────────────────────────────────────────
settingsBtn.addEventListener('click', () => {
    // Sync UI with current settings
    secondsInput.value = timerDuration / 1000;
    shuffleToggle.checked = shouldShuffle;
    settingsModal.classList.remove('hidden');
});

saveSettingsBtn.addEventListener('click', () => {
    timerDuration = parseInt(secondsInput.value) * 1000;
    shouldShuffle = shuffleToggle.checked;
    settingsModal.classList.add('hidden');
});

// Close modal if clicking outside content
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

// ── Pause Logic ─────────────────────────────────────────────────────────────
function togglePause() {
    if (setupScreen.classList.contains('hidden')) {
        isPaused = !isPaused;
        if (isPaused) {
            pauseOverlay.classList.remove('hidden');
            if (recognition) recognition.stop();
            // If timer is running, we just let it be handled by the logic
        } else {
            pauseOverlay.classList.add('hidden');
            if (!answerAccepted) {
                startVoiceRecognition();
            }
        }
    }
}

pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    togglePause();
});

pauseOverlay.addEventListener('click', togglePause);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
    }
});

// ── Number-words → digits ─────────────────────────────────────────────────────
// ... (rest of the wordsToNumber and normaliseSpoken functions)
const ones = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,
    ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,
    sixteen:16,seventeen:17,eighteen:18,nineteen:19
};
const tens  = { twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90 };

function wordsToNumber(text) {
    text = text.trim().toLowerCase();
    let negative = false;
    if (/^(negative|minus)\s+/.test(text)) {
        negative = true;
        text = text.replace(/^(negative|minus)\s+/, '');
    }

    if (text.includes(' point ')) {
        const [intStr, decStr] = text.split(' point ');
        const intPart = wordsToNumber(intStr);
        const decPart = decStr.split(' ').map(w => (ones[w] !== undefined ? ones[w] : w)).join('');
        const result  = parseFloat(`${intPart}.${decPart}`);
        return negative ? -result : result;
    }

    const words = text.split(/\s+/);
    let current = 0;
    let result  = 0;
    for (const word of words) {
        if (ones[word]   !== undefined) { current += ones[word];           continue; }
        if (tens[word]   !== undefined) { current += tens[word];           continue; }
        if (word === 'hundred')         { current  = current ? current*100 : 100;   continue; }
        if (word === 'thousand')        { result  += current * 1000; current = 0;   continue; }
        if (word === 'million')         { result  += current * 1000000; current = 0; continue; }
        if (!isNaN(word) && word !== '') { current += parseFloat(word); }
    }
    result += current;
    return negative ? -result : result;
}

function normaliseSpoken(text) {
    // Strip trailing "percent" or "%" — answers are stored as plain numbers
    text = text.trim().toLowerCase().replace(/\s*percent$/, '').replace(/%$/, '').trim();
    if (!isNaN(text) && text !== '') return String(parseFloat(text));
    const converted = wordsToNumber(text);
    if (!isNaN(converted)) return String(converted);
    return text;
}

// ── Speech Recognition ────────────────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let recognitionActive = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults  = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false; // We'll handle restarting manually for better control

    recognition.onstart = () => {
        recognitionActive = true;
        console.log('Voice recognition started');
    };

    recognition.onresult = (event) => {
        if (answerAccepted || isPaused) return;
        
        // results is a list of results, each with alternatives
        // Since continuous is false, we usually just look at the last result
        const resultIndex = event.resultIndex;
        const alternatives = event.results[resultIndex];

        for (let i = 0; i < alternatives.length; i++) {
            const raw        = alternatives[i].transcript.toLowerCase().trim();
            const normalised = normaliseSpoken(raw);
            console.log(`Heard (alt ${i}): "${raw}" (confidence: ${alternatives[i].confidence})`);
            
            voiceStatus.innerText = `Heard: "${raw}"`;
            if (checkAnswer(normalised, raw)) {
                break;
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognitionActive = false;

        if (event.error === 'no-speech') {
            // Quietly restart if no speech was detected
            if (!answerAccepted && !isPaused) restartRecognition();
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            voiceStatus.innerText = 'Error: Microphone blocked';
            voiceStatus.classList.remove('listening');
        } else {
            voiceStatus.innerText = `Error: ${event.error}`;
            if (!answerAccepted && !isPaused) restartRecognition();
        }
    };

    recognition.onend = () => {
        recognitionActive = false;
        console.log('Voice recognition ended');
        if (!answerAccepted && !isPaused) {
            restartRecognition();
        }
    };
} else {
    alert('Speech Recognition not supported. Please use Chrome or Edge.');
}

function restartRecognition() {
    if (answerAccepted || !recognition || recognitionActive || isPaused) return;
    try {
        recognition.start();
    } catch (e) {
        console.warn('Failed to restart recognition:', e);
    }
}

// ── Shuffle Function ──────────────────────────────────────────────────────────
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ── Upload & Start ────────────────────────────────────────────────────────────
startBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const questionsFile = questionsFileInput.files[0];
    const answersFile   = answersFileInput.files[0];

    if (!questionsFile || !answersFile) {
        alert('Please select both questions and answers Excel files.');
        return;
    }

    startBtn.innerText = 'LOADING...';
    startBtn.disabled  = true;

    const formData = new FormData();
    formData.append('questions', questionsFile);
    formData.append('answers',   answersFile);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload files.');
        }

        quizData = await response.json();
        if (!quizData || quizData.length === 0) {
            throw new Error('No valid questions found in the Excel sheets.');
        }
        
        // Randomize the questions if setting is enabled
        if (shouldShuffle) {
            shuffleArray(quizData);
        }
        
        startQuiz();
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert(`Error: ${error.message}\n\nMake sure the backend is running (npm start).`);
        startBtn.innerText = 'START QUIZ';
        startBtn.disabled  = false;
    }
});

function startQuiz() {
    setupScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    try {
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch(e) {}
    currentQuestionIndex = 0;
    showNextQuestion();
}

// ── Question Rendering ────────────────────────────────────────────────────────
function renderQuestion(rawText) {
    const lines   = String(rawText).split('\n').map(l => l.trim()).filter(Boolean);
    const stem    = lines[0] || '';
    const options = lines.slice(1);

    questionStem.style.opacity = '0';
    optionsList.style.opacity  = '0';

    setTimeout(() => {
        questionStem.innerText = stem;
        optionsList.innerHTML  = '';
        options.forEach(opt => {
            const li      = document.createElement('li');
            li.innerText  = opt;
            optionsList.appendChild(li);
        });
        questionStem.style.opacity = '1';
        optionsList.style.opacity  = '1';
    }, 200);
}

function showNextQuestion() {
    if (currentQuestionIndex >= quizData.length) { finishQuiz(); return; }

    answerAccepted = false;

    resultStatus.innerText = '';
    resultStatus.className = '';
    voiceStatus.innerText  = 'LISTENING...';
    voiceStatus.classList.add('listening');

    renderQuestion(quizData[currentQuestionIndex].question);
    startTimer();
    startVoiceRecognition();
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
    if (timerInterval) clearTimeout(timerInterval);
    
    // Check if paused during timer start - though we shouldn't be
    if (isPaused) {
        setTimeout(startTimer, 100);
        return;
    }

    timerBar.style.transition = 'none';
    timerBar.style.width      = '100%';
    void timerBar.offsetWidth;
    timerBar.style.transition = `width ${timerDuration}ms linear`;
    timerBar.style.width      = '0%';
    
    let startTime = Date.now();
    let remaining = timerDuration;

    const tick = () => {
        if (isPaused) {
            startTime = Date.now(); // Reset start time to "now" while paused
            timerBar.style.transition = 'none'; // Freeze bar
            setTimeout(tick, 100);
            return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed >= remaining) {
            handleTimeout();
        } else {
            timerInterval = setTimeout(tick, 100);
        }
    };
    
    tick();
}

function stopTimer() {
    clearTimeout(timerInterval);
    const computed            = getComputedStyle(timerBar).width;
    timerBar.style.transition = 'none';
    timerBar.style.width      = computed;
}

// ── Voice ─────────────────────────────────────────────────────────────────────
function startVoiceRecognition() {
    if (!recognition || isPaused) return;
    try { recognition.start(); } catch(e) {}
}

function startBreak() {
    let timeLeft = 2; // Changed to 2 seconds
    
    const tick = () => {
        if (isPaused) {
            setTimeout(tick, 100);
            return;
        }

        voiceStatus.innerText = `Next question in ${timeLeft}s...`;
        if (timeLeft > 0) {
            timeLeft--;
            breakTimer = setTimeout(tick, 1000);
        } else {
            currentQuestionIndex++;
            showNextQuestion();
        }
    };
    
    tick();
}

// Returns true if the spoken answer matched
function checkAnswer(normalisedSpoken, rawSpoken) {
    if (answerAccepted || isPaused) return true;

    const correctRaw        = String(quizData[currentQuestionIndex].answer).trim();
    const correctNormalised = normaliseSpoken(correctRaw);

    const isCorrect = normalisedSpoken === correctNormalised ||
                      normalisedSpoken.includes(correctNormalised) ||
                      correctNormalised.includes(normalisedSpoken);

    if (!isCorrect) return false;

    answerAccepted = true;
    stopTimer();
    if (recognition) recognition.stop();

    voiceStatus.classList.remove('listening');
    voiceStatus.innerText  = `Heard: "${rawSpoken}"`;
    resultStatus.innerText = 'CORRECT';
    resultStatus.className = 'correct';

    setTimeout(startBreak, 1000);
    return true;
}

function handleTimeout() {
    if (answerAccepted) return;
    answerAccepted = true;
    if (recognition) recognition.stop();

    const correct          = String(quizData[currentQuestionIndex].answer).trim();
    resultStatus.innerText = `TIME EXPIRED — Answer: ${correct}`;
    resultStatus.className = 'incorrect';
    voiceStatus.innerText  = '';
    voiceStatus.classList.remove('listening');

    setTimeout(startBreak, 2000);
}

function finishQuiz() {
    questionStem.innerText    = 'PRACTICE COMPLETE';
    optionsList.innerHTML     = '';
    voiceStatus.innerText     = '';
    resultStatus.innerText    = 'EXCELLENT WORK';
    resultStatus.className    = 'correct';
    timerBar.style.transition = 'none';
    timerBar.style.width      = '0%';

    setTimeout(() => {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        location.reload();
    }, 4000);
}