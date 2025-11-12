// Video Player Logic for YouTube-style interface
document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('mainVideo');
    const screenshot = document.getElementById('screenshotImg');
    const playOverlay = document.getElementById('playOverlay');
    const centerPlayButton = document.getElementById('centerPlayButton');
    const videoControls = document.getElementById('videoControls');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playPauseIcon = document.getElementById('playPauseIcon');
    const muteBtn = document.getElementById('muteBtn');
    const volumeIcon = document.getElementById('volumeIcon');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const talkingHeadCircle = document.getElementById('talkingHeadCircle');
    const circleVideoDisplay = document.getElementById('circleVideoDisplay');
    
    let isPlaying = false;
    let isMuted = false;
    let scrollAnimationFrame = null;
    
    // Get scroll delay from video element
    const scrollDelay = parseInt(video.dataset.scrollDelay) || 0;
    console.log('Scroll delay set to:', scrollDelay, 'seconds');
    
    // Initialize
    function init() {
        video.volume = 0.5;
        updateTimeDisplay();
        
        // Show talking head circle when ready
        if (video.readyState >= 2) {
            showTalkingHead();
        } else {
            video.addEventListener('loadeddata', showTalkingHead);
        }
    }
    
    function showTalkingHead() {
        talkingHeadCircle.style.display = 'block';
        
        // Clone video for talking head
        const clonedVideo = video.cloneNode(true);
        clonedVideo.id = 'talkingHeadVideo';
        clonedVideo.style.display = 'block';
        clonedVideo.muted = true;
        
        // Clear and add cloned video to circle
        circleVideoDisplay.innerHTML = '';
        circleVideoDisplay.appendChild(clonedVideo);
        
        // Sync cloned video with main video
        video.addEventListener('play', () => clonedVideo.play());
        video.addEventListener('pause', () => clonedVideo.pause());
        video.addEventListener('timeupdate', () => {
            if (Math.abs(clonedVideo.currentTime - video.currentTime) > 0.1) {
                clonedVideo.currentTime = video.currentTime;
            }
        });
        video.addEventListener('seeked', () => {
            clonedVideo.currentTime = video.currentTime;
        });
    }
    
    // Center play button
    centerPlayButton.addEventListener('click', function() {
        playVideo();
    });

    // Play/pause button in controls
    playPauseBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent bubbling up
        if (isPlaying) {
            pauseVideo();
        } else {
            playVideo();
        }
    });

    // ENTIRE VIDEO PLAYER AREA - SIMPLE CLICK TO PLAY/PAUSE
    const videoPlayer = document.querySelector('.video-player');
    videoPlayer.addEventListener('click', function(e) {
        // ONLY exclude the control buttons themselves, nothing else
        if (e.target.closest('.control-btn')) {
            return; // Let the control button handle it
        }
        
        // Everything else triggers play/pause
        if (isPlaying) {
            pauseVideo();
        } else {
            playVideo();
        }
    });    // Mute button - needs to NOT trigger play/pause  
    muteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering play/pause
        if (isMuted) {
            unmuteVideo();
        } else {
            muteVideo();
        }
    });
    
    // Progress bar click - needs to NOT trigger play/pause
    progressBar.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering play/pause
        const rect = progressBar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const newTime = pos * video.duration;
        video.currentTime = newTime;
    });
    
    // Fullscreen button - needs to NOT trigger play/pause
    fullscreenBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering play/pause
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    function playVideo() {
        video.play().then(() => {
            isPlaying = true;
            playOverlay.classList.add('hidden');
            updatePlayPauseIcon();
            
            // Start scroll animation after delay (convert seconds to milliseconds)
            if (scrollDelay > 0) {
                setTimeout(() => {
                    if (isPlaying) {
                        startScrollAnimation();
                    }
                }, scrollDelay * 1000); // Convert seconds to milliseconds
            } else {
                startScrollAnimation();
            }
        }).catch(err => {
            console.error('Play failed:', err);
        });
    }
    
    function pauseVideo() {
        video.pause();
        isPlaying = false;
        playOverlay.classList.remove('hidden'); // Show the center play button again
        updatePlayPauseIcon();
        stopScrollAnimation();
    }
    
    function muteVideo() {
        video.muted = true;
        isMuted = true;
        muteBtn.classList.add('muted');
        updateVolumeIcon();
    }
    
    function unmuteVideo() {
        video.muted = false;
        isMuted = false;
        muteBtn.classList.remove('muted');
        updateVolumeIcon();
    }
    
    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
        } else {
            playPauseIcon.innerHTML = '<polygon points="5,3 19,12 5,21" fill="white"/>';
        }
    }
    
    function updateVolumeIcon() {
        if (isMuted) {
            volumeIcon.innerHTML = '<path fill="white" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else {
            volumeIcon.innerHTML = '<path fill="white" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        }
    }
    
    function updateTimeDisplay() {
        const formatTime = (time) => {
            if (isNaN(time)) return '0:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        currentTime.textContent = formatTime(video.currentTime);
        duration.textContent = formatTime(video.duration);
    }
    
    function updateProgress() {
        if (video.duration) {
            const progressPercent = (video.currentTime / video.duration) * 100;
            progress.style.width = `${progressPercent}%`;
        }
    }
    
    function startScrollAnimation() {
        console.log('Starting scroll animation check...');
        // Human-like scroll happens only at specified time
        let scrollTriggered = false;
        
        function checkScrollTrigger() {
            if (!isPlaying) return;
            
            const currentVideoTime = video.currentTime;
            
            // Trigger scroll at the specified delay time
            if (!scrollTriggered && currentVideoTime >= scrollDelay) {
                console.log('Triggering scroll at time:', currentVideoTime);
                scrollTriggered = true;
                performHumanScroll();
                return; // Stop checking after scroll is triggered
            }
            
            if (isPlaying) {
                scrollAnimationFrame = requestAnimationFrame(checkScrollTrigger);
            }
        }
        
        scrollAnimationFrame = requestAnimationFrame(checkScrollTrigger);
    }
    
    function performHumanScroll() {
        console.log('Performing human scroll...');
        const viewport = document.querySelector('.screenshot-viewport');
        const screenshotHeight = screenshot.naturalHeight || screenshot.offsetHeight;
        const viewportHeight = viewport.offsetHeight;
        const maxScroll = Math.max(0, screenshotHeight - viewportHeight);
        const scrollTarget = maxScroll * 0.3; // Scroll to 30% of page
        
        console.log('Scroll dimensions:', {
            screenshotHeight,
            viewportHeight,
            maxScroll,
            scrollTarget
        });
        
        if (maxScroll <= 0) {
            console.log('No scroll needed - screenshot fits in viewport');
            return;
        }
        
        // Add scrolling class for CSS animation
        screenshot.classList.add('scrolling');
        
        // Animate to 30% scroll position
        screenshot.style.transition = 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        screenshot.style.transform = `translateY(-${scrollTarget}px)`;
        
        // After 2 seconds, snap back to top
        setTimeout(() => {
            screenshot.style.transition = 'transform 0.8s ease-in-out';
            screenshot.style.transform = 'translateY(0)';
            
            // Clean up after animation
            setTimeout(() => {
                screenshot.classList.remove('scrolling');
                screenshot.style.transition = '';
                console.log('Scroll animation complete');
            }, 800);
        }, 2000);
    }
    
    function stopScrollAnimation() {
        if (scrollAnimationFrame) {
            cancelAnimationFrame(scrollAnimationFrame);
            scrollAnimationFrame = null;
        }
    }
    
    // Event listeners
    video.addEventListener('loadedmetadata', init);
    video.addEventListener('timeupdate', () => {
        updateTimeDisplay();
        updateProgress();
    });
    
    video.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseIcon();
    });
    
    video.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseIcon();
    });
    
    video.addEventListener('ended', () => {
        isPlaying = false;
        playOverlay.classList.remove('hidden');
        updatePlayPauseIcon();
        stopScrollAnimation();
        screenshot.style.transform = 'translateY(0)';
    });
    
    video.addEventListener('volumechange', () => {
        isMuted = video.muted;
        updateVolumeIcon();
    });
    
    // Show controls on hover
    const playerContainer = document.querySelector('.video-player');
    let controlsTimeout;
    
    function showControls() {
        videoControls.classList.add('show');
        clearTimeout(controlsTimeout);
        controlsTimeout = setTimeout(hideControls, 3000);
    }
    
    function hideControls() {
        if (!isPlaying) return;
        videoControls.classList.remove('show');
    }
    
    playerContainer.addEventListener('mouseenter', showControls);
    playerContainer.addEventListener('mousemove', showControls);
    playerContainer.addEventListener('mouseleave', hideControls);
    
    // Initialize when DOM is ready
    if (video.readyState >= 2) {
        init();
    }
});

// FAQ Functionality
document.addEventListener('DOMContentLoaded', function() {
    const faqContainer = document.getElementById('faq-container');
    if (!faqContainer) return;
    
    // Add click handlers to all FAQ questions
    const faqQuestions = faqContainer.querySelectorAll('.faq-q');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isOpen = faqItem.classList.contains('open');
            
            // Close all other FAQ items
            faqQuestions.forEach(otherQuestion => {
                const otherItem = otherQuestion.parentElement;
                if (otherItem !== faqItem) {
                    otherItem.classList.remove('open');
                    otherQuestion.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            if (isOpen) {
                faqItem.classList.remove('open');
                this.setAttribute('aria-expanded', 'false');
            } else {
                faqItem.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
});