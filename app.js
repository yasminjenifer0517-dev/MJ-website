/**
 * Rapido SOP: Ride Stopped Midway Presentation
 * Core Interactive Logic (Vanilla JavaScript)
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. STATE VARIABLES
    // -------------------------------------------------------------
    let currentSlideIndex = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    let isTransitioning = false;
    const transitionDelay = 950; // matches CSS slide transition time

    // Autoplay configuration
    let autoplayInterval = null;
    let isAutoplayActive = false;
    const autoplayDuration = 6000; // 6 seconds per slide

    // Sound effects configurations
    let soundEnabled = true;
    let audioCtx = null;

    // Custom cursor tracking coordinates
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.custom-cursor-dot');

    // Touch Swipe coordinates
    let touchStartY = 0;
    let touchEndY = 0;

    // -------------------------------------------------------------
    // 2. AUDIO SYNTHESIZER (Web Audio API)
    // -------------------------------------------------------------
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(380, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.12);
            } else if (type === 'correct') {
                // Happy chord chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
                gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
            } else if (type === 'incorrect') {
                // Sad buzzer chime
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(196.00, audioCtx.currentTime); // G3
                osc.frequency.setValueAtTime(174.61, audioCtx.currentTime + 0.12); // F3
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.35);
            }
        } catch (error) {
            console.warn("Audio synthesis error: ", error);
        }
    }

    // -------------------------------------------------------------
    // 3. GENERATE SIDE DOT INDICATORS
    // -------------------------------------------------------------
    const dotsContainer = document.getElementById('dots-container');
    const slideTitles = [
        "Cover Page",
        "Vehicle Breakdown",
        "Flat Tyre",
        "Medical Emergency",
        "Route Blocked",
        "Safety Concern",
        "Midway Early End",
        "Core SOP Dashboard",
        "Practice Quiz"
    ];

    slides.forEach((slide, idx) => {
        const dotWrapper = document.createElement('div');
        dotWrapper.classList.add('dot-wrapper');
        if (idx === 0) dotWrapper.classList.add('active');

        const dot = document.createElement('div');
        dot.classList.add('dot');
        dot.setAttribute('data-target', idx);

        const tooltip = document.createElement('div');
        tooltip.classList.add('dot-tooltip');
        tooltip.innerText = `${idx + 1}. ${slideTitles[idx]}`;

        dotWrapper.appendChild(dot);
        dotWrapper.appendChild(tooltip);
        dotsContainer.appendChild(dotWrapper);

        // Click handler for dots
        dotWrapper.addEventListener('click', () => {
            goToSlide(idx);
        });
    });

    const dotWrappers = document.querySelectorAll('.dot-wrapper');

    // -------------------------------------------------------------
    // 4. SLIDE ROUTING & NAVIGATION
    // -------------------------------------------------------------
    function updateHUD() {
        const currentNum = String(currentSlideIndex + 1).padStart(2, '0');
        const totalNum = String(totalSlides).padStart(2, '0');
        
        document.getElementById('current-slide').innerText = currentNum;
        document.getElementById('total-slides').innerText = totalNum;
        
        // Progress bar percentage
        const progressPercentage = (currentSlideIndex / (totalSlides - 1)) * 100;
        document.getElementById('progress-indicator').style.width = `${progressPercentage}%`;

        // Update active dots
        dotWrappers.forEach((wrapper, idx) => {
            if (idx === currentSlideIndex) {
                wrapper.classList.add('active');
            } else {
                wrapper.classList.remove('active');
            }
        });
    }

    function goToSlide(index) {
        if (index < 0 || index >= totalSlides || index === currentSlideIndex || isTransitioning) return;

        isTransitioning = true;
        playSound('click');

        const previousSlide = slides[currentSlideIndex];
        const nextSlide = slides[index];

        // Manage previous active states
        slides.forEach((slide) => {
            slide.classList.remove('active', 'previous');
        });

        // Set previous slide state for slide up transitions
        if (index > currentSlideIndex) {
            previousSlide.classList.add('previous');
        }

        // Activate target slide
        nextSlide.classList.add('active');
        currentSlideIndex = index;
        
        updateHUD();

        // Control videos: Play the active slide's video, pause others
        slides.forEach((slide, idx) => {
            const video = slide.querySelector('.scenario-video');
            if (video) {
                if (idx === index) {
                    video.currentTime = 0;
                    video.play().catch(e => console.log("Video auto-play blocked", e));
                } else {
                    video.pause();
                }
            }
        });

        setTimeout(() => {
            isTransitioning = false;
        }, transitionDelay);

        // Pause autoplay if active, unless triggered by autoplay itself
        if (isAutoplayActive && !autoplayInterval) {
            toggleAutoplay(false);
        }
    }

    function nextSlide() {
        if (currentSlideIndex < totalSlides - 1) {
            goToSlide(currentSlideIndex + 1);
        } else {
            // Loop back to cover in autoplay or end it
            goToSlide(0);
        }
    }

    // Wrap-around previous button
    function prevSlide() {
        if (currentSlideIndex > 0) {
            goToSlide(currentSlideIndex - 1);
        } else {
            goToSlide(totalSlides - 1);
        }
    }

    // -------------------------------------------------------------
    // 5. AUTOPLAY MANAGEMENT
    // -------------------------------------------------------------
    const autoplayBtn = document.getElementById('autoplay-btn');
    const autoplayIndicator = document.getElementById('autoplay-indicator');

    function toggleAutoplay(forceState = null) {
        const targetState = forceState !== null ? forceState : !isAutoplayActive;

        if (targetState) {
            isAutoplayActive = true;
            autoplayBtn.classList.add('playing');
            autoplayBtn.querySelector('i').className = 'fa-solid fa-pause';
            autoplayIndicator.classList.add('visible');

            autoplayInterval = setInterval(() => {
                nextSlide();
            }, autoplayDuration);
        } else {
            isAutoplayActive = false;
            autoplayBtn.classList.remove('playing');
            autoplayBtn.querySelector('i').className = 'fa-solid fa-play';
            autoplayIndicator.classList.remove('visible');

            if (autoplayInterval) {
                clearInterval(autoplayInterval);
                autoplayInterval = null;
            }
        }
    }

    autoplayBtn.addEventListener('click', () => {
        initAudio();
        toggleAutoplay();
    });

    // -------------------------------------------------------------
    // 6. EVENT LISTENERS: WHEEL & SWIPE & KEYBOARD
    // -------------------------------------------------------------
    
    // Wheel event throttling
    window.addEventListener('wheel', (e) => {
        // Prevent scrolling if user is reading scrollable lists in tablet landscape
        if (e.target.closest('.actions-list') || e.target.closest('.dashboard-grid')) {
            // Let them scroll naturally inside the box
            const scrollBox = e.target.closest('.actions-list') || e.target.closest('.dashboard-grid');
            if (scrollBox.scrollHeight > scrollBox.clientHeight) {
                return; 
            }
        }

        e.preventDefault();
        if (isTransitioning) return;

        if (e.deltaY > 0) {
            nextSlide();
        } else if (e.deltaY < 0) {
            prevSlide();
        }
    }, { passive: false });

    // Touch support (swipes)
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchStartY - touchEndY;
        const threshold = 50; // swipe length minimum

        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    });

    // Keyboard keys handler
    window.addEventListener('keydown', (e) => {
        initAudio();
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'p':
            case 'P':
                toggleAutoplay();
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'm':
            case 'M':
                toggleSound();
                break;
            case 'Escape':
                closeModal();
                break;
        }
    });

    // Button clicks
    document.getElementById('next-btn').addEventListener('click', nextSlide);
    document.getElementById('prev-btn').addEventListener('click', prevSlide);
    document.getElementById('start-btn').addEventListener('click', () => goToSlide(1));
    document.getElementById('quiz-jump-btn').addEventListener('click', () => goToSlide(8));

    // -------------------------------------------------------------
    // 7. UTILITIES: SOUND TOGGLE, FULLSCREEN, MODALS
    // -------------------------------------------------------------
    const soundToggleBtn = document.getElementById('sound-toggle');
    function toggleSound() {
        soundEnabled = !soundEnabled;
        if (soundEnabled) {
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            playSound('click');
        } else {
            soundToggleBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
    }
    soundToggleBtn.addEventListener('click', toggleSound);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    }
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);

    // Keyboard shortcuts modal logic
    const modal = document.getElementById('shortcuts-modal');
    const shortcutsBtn = document.getElementById('shortcuts-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    function openModal() {
        modal.classList.add('open');
    }
    function closeModal() {
        modal.classList.remove('open');
    }

    shortcutsBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // -------------------------------------------------------------
    // 8. INTERACTIVE CURSOR INTERPOLATION
    // -------------------------------------------------------------
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Dot moves instantly
        if (cursorDot) {
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
        }
    });

    function updateCursor() {
        // Linear interpolation for cursor circle lag
        cursorX += (mouseX - cursorX) * 0.15;
        cursorY += (mouseY - cursorY) * 0.15;

        if (cursor) {
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
        }

        requestAnimationFrame(updateCursor);
    }
    updateCursor();

    // Attach hover listener to interactive UI elements for cursor scaling
    const hoverables = 'button, a, .dot, .action-card, .sop-card, .quiz-option, .close-btn, .btn';
    
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverables)) {
            cursor.classList.add('hovered');
            if (e.target.closest('.quiz-option') || e.target.closest('#sound-toggle')) {
                // Add minor differentiation or color
            }
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverables)) {
            cursor.classList.remove('hovered');
        }
    });

    // -------------------------------------------------------------
    // 9. INTERACTIVE QUIZ MECHANICS
    // -------------------------------------------------------------
    const quizQuestions = [
        {
            situation: "The Captain's bike breaks down on a busy flyover midway through the trip. What is the immediate first action required by SOP?",
            options: [
                "Apologize, push the bike to a safe location off the roadway, and inform the customer clearly.",
                "Demand extra cash for completing half the ride, leave the customer, and push the bike.",
                "Tell the customer to book an auto, then drive away to the mechanic.",
                "Sit on the bike and wait for emergency support without talking to the customer."
            ],
            correct: 0,
            explanation: "SOP Scenario 1: Always prioritize pulling over to a safe area, inform the customer immediately, and apologize."
        },
        {
            situation: "The Captain gets a flat tyre midway. The customer is in a hurry and requests to walk. What is the Captain's responsibility?",
            options: [
                "Tell the customer they cannot walk, and force them to wait until the tyre is fixed.",
                "Confirm that the customer is in a safe, well-lit location, assist with booking another ride, end the trip correctly in the app, and remain polite.",
                "Immediately take cash for the partial ride and rush to the repair shop leaving the customer.",
                "Offer a lift on the flat tire to complete the trip."
            ],
            correct: 1,
            explanation: "SOP Scenario 2: Safely stop, explain clearly, ensure the customer reaches a safe place, and assist in arranging alternate transport."
        },
        {
            situation: "The customer requests to end the ride early on a high-speed express highway. What is the correct protocol?",
            options: [
                "Stop immediately on the fast lane, click end ride, and tell them to walk.",
                "Politely confirm, pull over at the nearest safe exit/drop-off point, end the ride correctly in the app, and ensure they are safe.",
                "Refuse to end the ride and force them to travel to the original destination.",
                "Argue with the customer and demand a tip outside the app."
            ],
            correct: 1,
            explanation: "SOP Scenario 6: Customer safety first. Ensure they are in a safe drop-off location before ending the ride in the app."
        }
    ];

    let currentQuestionIndex = 0;
    let quizScore = 0;

    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsContainer = document.getElementById('quiz-options-container');
    const quizFeedback = document.getElementById('quiz-feedback');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackDesc = document.getElementById('feedback-desc');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quizScoreboard = document.getElementById('quiz-scoreboard');
    const qCurrent = document.getElementById('q-current');
    const finalScore = document.getElementById('final-score');
    const scoreEvaluation = document.getElementById('score-evaluation');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');

    function loadQuestion() {
        const questionObj = quizQuestions[currentQuestionIndex];
        qCurrent.innerText = currentQuestionIndex + 1;
        quizQuestionText.innerText = questionObj.situation;
        
        quizOptionsContainer.innerHTML = '';
        quizFeedback.classList.add('hidden');

        questionObj.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.classList.add('quiz-option');
            btn.innerText = opt;
            btn.addEventListener('click', () => selectAnswer(idx));
            quizOptionsContainer.appendChild(btn);
        });
    }

    function selectAnswer(selectedIndex) {
        const questionObj = quizQuestions[currentQuestionIndex];
        const optionsButtons = quizOptionsContainer.querySelectorAll('.quiz-option');

        // Disable all options
        optionsButtons.forEach((btn, idx) => {
            btn.classList.add('disabled');
            if (idx === questionObj.correct) {
                btn.classList.add('correct');
            }
        });

        // Show feedback
        quizFeedback.classList.remove('hidden');

        if (selectedIndex === questionObj.correct) {
            quizScore++;
            playSound('correct');
            feedbackTitle.innerText = "Correct Action!";
            feedbackTitle.className = "success";
            feedbackDesc.innerText = questionObj.explanation;
        } else {
            optionsButtons[selectedIndex].classList.add('incorrect');
            playSound('incorrect');
            feedbackTitle.innerText = "Incorrect Protocol";
            feedbackTitle.className = "danger";
            feedbackDesc.innerText = `SOP guidelines say: ${questionObj.explanation}`;
        }
    }

    nextQuestionBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizQuestions.length) {
            loadQuestion();
        } else {
            // Show score board
            document.querySelector('.quiz-box').classList.add('hidden');
            quizScoreboard.classList.remove('hidden');
            finalScore.innerText = quizScore;
            
            // Evaluation text
            if (quizScore === quizQuestions.length) {
                scoreEvaluation.innerText = "Perfect! You have an excellent understanding of Rapido's 'Ride Stopped Midway' Standard Operating Procedures.";
            } else if (quizScore >= 2) {
                scoreEvaluation.innerText = "Good job! A few minor errors. Review the slides to ensure perfect compliance.";
            } else {
                scoreEvaluation.innerText = "SOP Review Recommended. Please go through the presentation slides again to clarify safe protocols.";
            }
        }
    });

    restartQuizBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        quizScore = 0;
        document.querySelector('.quiz-box').classList.remove('hidden');
        quizScoreboard.classList.add('hidden');
        loadQuestion();
    });

    // Initialize the quiz
    loadQuestion();
});
