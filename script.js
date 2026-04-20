document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════════
    //  Config
    // ═══════════════════════════════════════════════
    const BROWN_SHADES = ['#3A2E28', '#5A4D44', '#B58451', '#D4A373', '#8B5E3C'];
    const CONNECTOR_GAP = 24;  // px from card edge to first connector point
    const GLOW_HALF    = 260;  // half-height (px) of the illuminated scroll band

    // ═══════════════════════════════════════════════
    //  Intro Reveal Sequence
    // ═══════════════════════════════════════════════
    const sequence = [
        document.querySelector('header'),
        document.querySelector('.ece-card'),
        ...document.querySelectorAll('#row-siblings .video-card'),
        ...document.querySelectorAll('#row-parents .video-card'),
        ...document.querySelectorAll('#row-gp .video-card')
    ];

    sequence.forEach(el => {
        if (el) el.classList.add('start-hidden');
    });

    const treeSvg = document.getElementById('tree-svg');
    if (treeSvg) {
        treeSvg.style.opacity = '0';
        // Need to add pointer-events:none or something? No, it already has pointer-events: none;
    }

    // Start sequence
    setTimeout(() => {
        const whiteout = document.getElementById('whiteout-overlay');
        if (whiteout) whiteout.style.opacity = '0';
        
        let delay = 1500; 
        
        sequence.forEach((el) => {
            if (el) {
                setTimeout(() => {
                    el.style.animation = 'fadeInItem 1.5s ease-out forwards';
                    el.addEventListener('animationend', () => {
                        el.classList.remove('start-hidden');
                        el.style.animation = ''; // clean up so hover transforms work
                    }, { once: true });
                }, delay);
                delay += 400; // 400ms stagger between elements
            }
        });

        if (treeSvg) {
            setTimeout(() => {
                treeSvg.style.transition = 'opacity 2s ease-in-out';
                treeSvg.style.opacity = '1';
            }, delay + 500); 
        }
    }, 500);

    // ═══════════════════════════════════════════════

    //  Sparkle Effect
    // ═══════════════════════════════════════════════
    document.querySelectorAll('.video-card').forEach(card => {
        let interval;
        card.addEventListener('mouseenter', () => {
            interval = setInterval(() => spawnSparkle(card), 100);
        });
        card.addEventListener('mouseleave', () => clearInterval(interval));
    });

    function spawnSparkle(card) {
        const r  = card.getBoundingClientRect();
        const sx = window.pageXOffset, sy = window.pageYOffset;
        const edge = Math.floor(Math.random() * 4);
        let x, y, dx, dy;

        switch (edge) {
            case 0: x = r.left + Math.random() * r.width;  y = r.top;    dx = (Math.random() - .5) * 100; dy = -80 - Math.random() * 80; break;
            case 1: x = r.right;  y = r.top + Math.random() * r.height;  dx =  80 + Math.random() * 80;  dy = (Math.random() - .5) * 100; break;
            case 2: x = r.left + Math.random() * r.width;  y = r.bottom; dx = (Math.random() - .5) * 100; dy =  80 + Math.random() * 80; break;
            case 3: x = r.left;   y = r.top + Math.random() * r.height;  dx = -80 - Math.random() * 80;  dy = (Math.random() - .5) * 100; break;
        }

        const el = document.createElement('div');
        el.classList.add('confetti');
        el.style.backgroundColor = BROWN_SHADES[Math.floor(Math.random() * BROWN_SHADES.length)];
        el.style.left = (x + sx) + 'px';
        el.style.top  = (y + sy) + 'px';
        el.style.setProperty('--dx', dx + 'px');
        el.style.setProperty('--dy', dy + 'px');
        const dur = 1.5 + Math.random() * 1.5;
        el.style.animation = `confettiBurst ${dur}s ease-out forwards`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), dur * 1000);
    }

    // ═══════════════════════════════════════════════
    //  Tree Connection Lines
    // ═══════════════════════════════════════════════

    /** Return card bounding info in tree-local coordinates. */
    function pos(selector) {
        const el = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;
        if (!el) return null;
        const tR = document.getElementById('family-tree').getBoundingClientRect();
        const eR = el.getBoundingClientRect();
        return {
            x:      eR.left - tR.left + eR.width  / 2,
            top:    eR.top  - tR.top,
            bottom: eR.bottom - tR.top,
            left:   eR.left - tR.left,
            right:  eR.right - tR.left,
        };
    }

    function cardPos(id) { return pos(`[data-id="${id}"]`); }
    function ecePos()    { return pos('.ece-card'); }

    /**
     * Build all SVG path `d` strings for the INVERTED tree.
     *
     * Layout (top → bottom):
     *   Row 1:  ★ Ece ★
     *   Row 2:  Öykü  |  Ceren  Memo  Kaan
     *   Row 3:  Sule  Anne  …………………  Baba
     *   Row 4:  Anneanne Dede  ……  Babanne Dede
     *
     * Connections flow DOWNWARD from Ece to grandparents:
     *   1. Ece → siblings bar → Ceren, Memo, Kaan
     *   2. Siblings bottom bar → couple bar (Anne–Baba) → Anne, Baba
     *   3. Öykü → Sule  (L-shape)
     *   4. Anne + Sule → maternal GP bar → Anneanne, Dede1
     *   5. Baba → paternal GP bar → Babanne, Dede2
     */
    function buildPaths() {
        const G = CONNECTOR_GAP;
        const paths = [];

        const anneanne = cardPos('anneanne');
        const dede1    = cardPos('dede1');
        const babanne  = cardPos('babanne');
        const dede2    = cardPos('dede2');
        const anne     = cardPos('anne');
        const sule     = cardPos('sule');
        const baba     = cardPos('baba');
        const oyku     = cardPos('oyku');
        const ceren    = cardPos('ceren');
        const memo     = cardPos('memo');
        const kaan     = cardPos('kaan');
        const ece      = ecePos();

        if ([anneanne, dede1, babanne, anne, sule, baba,
             oyku, ceren, memo, kaan, ece].some(p => !p)) return paths;

        // Sibling extents
        const leftSib  = Math.min(ceren.x, memo.x, kaan.x);
        const rightSib = Math.max(ceren.x, memo.x, kaan.x);
        const midSibX  = (leftSib + rightSib) / 2;

        // ── 1. Ece → Ceren, Memo, Kaan ───────────────────────────────────
        const eceDropY    = ece.bottom + G;
        const sibsTopBarY = Math.min(ceren.top, memo.top, kaan.top) - G;

        // Ece bottom → step across to midSibX → drop to siblings top bar
        paths.push(`M ${ece.x} ${ece.bottom} L ${ece.x} ${eceDropY} L ${midSibX} ${eceDropY} L ${midSibX} ${sibsTopBarY}`);
        // Horizontal bar spanning all siblings
        paths.push(`M ${leftSib} ${sibsTopBarY} L ${rightSib} ${sibsTopBarY}`);
        // Drops to each sibling
        paths.push(`M ${ceren.x} ${sibsTopBarY} L ${ceren.x} ${ceren.top}`);
        paths.push(`M ${memo.x}  ${sibsTopBarY} L ${memo.x}  ${memo.top}`);
        paths.push(`M ${kaan.x}  ${sibsTopBarY} L ${kaan.x}  ${kaan.top}`);

        // ── 2. Siblings → Parents (Anne + Baba marriage bar) ─────────────
        const sibsBottomBarY = Math.max(ceren.bottom, memo.bottom, kaan.bottom) + G;
        const coupleMidX     = (anne.x + baba.x) / 2;
        const coupleBarY     = Math.min(anne.top, baba.top) - G;

        // Bottom bracket under siblings
        paths.push(`M ${leftSib} ${sibsBottomBarY} L ${rightSib} ${sibsBottomBarY}`);
        paths.push(`M ${ceren.x} ${ceren.bottom} L ${ceren.x} ${sibsBottomBarY}`);
        paths.push(`M ${memo.x}  ${memo.bottom}  L ${memo.x}  ${sibsBottomBarY}`);
        paths.push(`M ${kaan.x}  ${kaan.bottom}  L ${kaan.x}  ${sibsBottomBarY}`);

        // Step from sibling-mid down & across to couple-mid, then to couple bar
        const stepY = sibsBottomBarY + (coupleBarY - sibsBottomBarY) * 0.5;
        paths.push(`M ${midSibX} ${sibsBottomBarY} L ${midSibX} ${stepY} L ${coupleMidX} ${stepY} L ${coupleMidX} ${coupleBarY}`);

        // Couple bar + drops to Anne and Baba
        paths.push(`M ${anne.x} ${coupleBarY} L ${baba.x} ${coupleBarY}`);
        paths.push(`M ${anne.x} ${coupleBarY} L ${anne.x} ${anne.top}`);
        paths.push(`M ${baba.x} ${coupleBarY} L ${baba.x} ${baba.top}`);

        // ── 3. Öykü → Sule (L-shape downward) ───────────────────────────
        const oykuDropBarY = oyku.bottom + G * 1.5;
        paths.push(`M ${oyku.x} ${oyku.bottom} L ${oyku.x} ${oykuDropBarY} L ${sule.x} ${oykuDropBarY} L ${sule.x} ${sule.top}`);

        // ── 4. Anne + Sule → Anneanne + Dede1 (maternal GPs) ─────────────
        const leftAS           = Math.min(anne.x, sule.x);
        const rightAS          = Math.max(anne.x, sule.x);
        const midASX           = (leftAS + rightAS) / 2;
        const anneSuleDropBarY = Math.max(anne.bottom, sule.bottom) + G;
        const matGpBarY        = Math.min(anneanne.top, dede1.top) - G;
        const leftMat          = Math.min(anneanne.x, dede1.x);
        const rightMat         = Math.max(anneanne.x, dede1.x);

        // Bracket under Anne + Sule
        paths.push(`M ${anne.x} ${anne.bottom} L ${anne.x} ${anneSuleDropBarY}`);
        paths.push(`M ${sule.x} ${sule.bottom} L ${sule.x} ${anneSuleDropBarY}`);
        paths.push(`M ${leftAS} ${anneSuleDropBarY} L ${rightAS} ${anneSuleDropBarY}`);
        // Drop to maternal GP bar + horizontal span + drops to GPs
        paths.push(`M ${midASX} ${anneSuleDropBarY} L ${midASX} ${matGpBarY} L ${leftMat} ${matGpBarY} L ${rightMat} ${matGpBarY}`);
        paths.push(`M ${anneanne.x} ${matGpBarY} L ${anneanne.x} ${anneanne.top}`);
        paths.push(`M ${dede1.x}    ${matGpBarY} L ${dede1.x}    ${dede1.top}`);

        // ── 5. Baba → Babanne (+ Dede2 if exists) ─────────────────────
        if (dede2) {
            const patGpBarY = Math.min(babanne.top, dede2.top) - G;
            const leftPat   = Math.min(babanne.x, dede2.x);
            const rightPat  = Math.max(babanne.x, dede2.x);

            paths.push(`M ${baba.x} ${baba.bottom} L ${baba.x} ${patGpBarY} L ${leftPat} ${patGpBarY} L ${rightPat} ${patGpBarY}`);
            paths.push(`M ${babanne.x} ${patGpBarY} L ${babanne.x} ${babanne.top}`);
            paths.push(`M ${dede2.x}   ${patGpBarY} L ${dede2.x}   ${dede2.top}`);
        } else {
            const patGpBarY = babanne.top - G;
            paths.push(`M ${baba.x} ${baba.bottom} L ${baba.x} ${patGpBarY} L ${babanne.x} ${patGpBarY} L ${babanne.x} ${babanne.top}`);
        }

        return paths;
    }

    // ─── SVG helpers ────────────────────────────────────────────────────

    function addPath(d, layer, cls) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', d);
        p.classList.add(cls);
        layer.appendChild(p);
    }

    function clearLayers() {
        document.getElementById('dim-layer').innerHTML  = '';
        document.getElementById('glow-layer').innerHTML = '';
    }

    function drawConnections() {
        clearLayers();
        const tree      = document.getElementById('family-tree');
        const svg       = document.getElementById('tree-svg');
        const dimLayer  = document.getElementById('dim-layer');
        const glowLayer = document.getElementById('glow-layer');

        svg.setAttribute('height', tree.scrollHeight);

        buildPaths().forEach(d => {
            addPath(d, dimLayer,  'dim-path');
            addPath(d, glowLayer, 'glow-path');
        });
    }

    // ═══════════════════════════════════════════════
    //  Scroll-Driven Glow
    // ═══════════════════════════════════════════════
    function updateGlow() {
        const gradient = document.getElementById('scroll-gradient');
        const tree     = document.getElementById('family-tree');
        if (!gradient || !tree) return;

        // Viewport centre in tree-local Y coordinates
        const treeRect     = tree.getBoundingClientRect();
        const localCenterY = window.innerHeight / 2 - treeRect.top;

        gradient.setAttribute('y1', localCenterY - GLOW_HALF);
        gradient.setAttribute('y2', localCenterY + GLOW_HALF);
    }

    // ═══════════════════════════════════════════════
    //  Initialise
    // ═══════════════════════════════════════════════
    requestAnimationFrame(() => {
        setTimeout(() => {
            drawConnections();
            updateGlow();
        }, 150);
    });

    window.addEventListener('scroll', updateGlow, { passive: true });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            drawConnections();
            updateGlow();
        }, 300);
    });

    // ═══════════════════════════════════════════════
    //  Video Lightbox Handling
    // ═══════════════════════════════════════════════
    const lightbox = document.getElementById('video-lightbox');
    const lightboxIframe = document.getElementById('lightbox-iframe');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxClose = document.getElementById('lightbox-close');
    
    if (lightbox) {
        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                const iframe = card.querySelector('iframe');
                if (!iframe) return; 
                
                const titleEl = card.querySelector('h2');
                lightboxTitle.textContent = titleEl ? titleEl.textContent : '';
                
                lightboxIframe.src = iframe.src;
                
                lightbox.classList.remove('hidden');
                setTimeout(() => lightbox.classList.add('active'), 10);
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            setTimeout(() => {
                lightbox.classList.add('hidden');
                lightboxIframe.src = ''; // stop audio/video
            }, 400); 
        };

        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
    }

});
