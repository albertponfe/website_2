document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.video-card');
    const brownShades = ['#3A2E28', '#5A4D44', '#B58451', '#D4A373', '#8B5E3C'];

    cards.forEach(card => {
        let confettiInterval;

        card.addEventListener('mouseenter', () => {
            // Start continuous spawning
            confettiInterval = setInterval(() => {
                spawnParticle(card);
            }, 100); // New particle every 100ms
        });

        card.addEventListener('mouseleave', () => {
            clearInterval(confettiInterval);
        });
    });

    function spawnParticle(card) {
        const rect = card.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Randomly pick an edge (0: Top, 1: Right, 2: Bottom, 3: Left)
        const edge = Math.floor(Math.random() * 4);
        let spawnX, spawnY, moveDirectionX, moveDirectionY;

        switch(edge) {
            case 0: // Top
                spawnX = rect.left + Math.random() * rect.width;
                spawnY = rect.top;
                moveDirectionX = (Math.random() - 0.5) * 100;
                moveDirectionY = -100 - Math.random() * 100;
                break;
            case 1: // Right
                spawnX = rect.right;
                spawnY = rect.top + Math.random() * rect.height;
                moveDirectionX = 100 + Math.random() * 100;
                moveDirectionY = (Math.random() - 0.5) * 100;
                break;
            case 2: // Bottom
                spawnX = rect.left + Math.random() * rect.width;
                spawnY = rect.bottom;
                moveDirectionX = (Math.random() - 0.5) * 100;
                moveDirectionY = 100 + Math.random() * 100;
                break;
            case 3: // Left
                spawnX = rect.left;
                spawnY = rect.top + Math.random() * rect.height;
                moveDirectionX = -100 - Math.random() * 100;
                moveDirectionY = (Math.random() - 0.5) * 100;
                break;
        }

        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.backgroundColor = brownShades[Math.floor(Math.random() * brownShades.length)];
        
        // Position relative to page
        confetti.style.left = (spawnX + scrollLeft) + 'px';
        confetti.style.top = (spawnY + scrollTop) + 'px';

        confetti.style.setProperty('--dx', `${moveDirectionX}px`);
        confetti.style.setProperty('--dy', `${moveDirectionY}px`);

        const duration = 1.5 + Math.random() * 1.5; // Longer, slower float
        confetti.style.animation = `confettiBurst ${duration}s ease-out forwards`;

        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
});



