document.addEventListener('DOMContentLoaded', () => {

    // ═══════════════════════════════════════════════
    //  Config
    // ═══════════════════════════════════════════════
    const BROWN_SHADES = ['#3A2E28', '#5A4D44', '#B58451', '#D4A373', '#8B5E3C'];
    const CONNECTOR_GAP = 24;   // px from card edge to start of line
    const GLOW_HALF    = 260;   // half-height (px) of the illuminated scroll band

    // ═══════════════════════════════════════════════
    //  Sparkle Effect (unchanged behaviour)
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

    /** Return an element's bounding info in tree-local coordinates. */
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

    function cardPos(id)  { return pos(`[data-id="${id}"]`); }
    function ecePos()     { return pos('.ece-card'); }

    /**
     * Build all SVG path `d` strings for the family tree.
     *
     * Relationship map:
     *  Anneanne + Dede1  ──► Anne, Sule  (maternal grandparents)
     *  Babanne  + Dede2  ──► Baba        (paternal grandparents)
     *  Anne  ─marriage─► Baba ──► Ceren, Memo, Kaan, Ece
     *  Sule              ──► Öykü
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

        // Guard — abort if any card not yet in DOM
        if ([anneanne, dede1, babanne, dede2, anne, sule, baba, oyku, ceren, memo, kaan, ece].some(p => !p)) return paths;

        // ── 1. Maternal grandparents ──► Anne + Sule ──────────────────────
        const matBarY      = Math.max(anneanne.bottom, dede1.bottom) + G;
        const matMidX      = (anneanne.x + dede1.x)  / 2;
        const anneSuleBarY = Math.min(anne.top, sule.top) - G;
        const leftAS       = Math.min(anne.x,  sule.x);
        const rightAS      = Math.max(anne.x,  sule.x);

        // Couple bracket
        paths.push(`M ${anneanne.x} ${anneanne.bottom} L ${anneanne.x} ${matBarY} L ${dede1.x} ${matBarY} L ${dede1.x} ${dede1.bottom}`);
        // Drop then horizontal span
        paths.push(`M ${matMidX} ${matBarY} L ${matMidX} ${anneSuleBarY} L ${leftAS} ${anneSuleBarY} L ${rightAS} ${anneSuleBarY}`);
        // Drops to Anne and Sule
        paths.push(`M ${anne.x} ${anneSuleBarY} L ${anne.x} ${anne.top}`);
        paths.push(`M ${sule.x} ${anneSuleBarY} L ${sule.x} ${sule.top}`);

        // ── 2. Paternal grandparents ──► Baba ────────────────────────────
        const patBarY = Math.max(babanne.bottom, dede2.bottom) + G;
        const patMidX = (babanne.x + dede2.x) / 2;

        paths.push(`M ${babanne.x} ${babanne.bottom} L ${babanne.x} ${patBarY} L ${dede2.x} ${patBarY} L ${dede2.x} ${dede2.bottom}`);
        paths.push(`M ${patMidX} ${patBarY} L ${patMidX} ${baba.top - G} L ${baba.x} ${baba.top - G} L ${baba.x} ${baba.top}`);

        // ── 3. Anne + Baba (marriage bar) ──► Ceren, Memo, Kaan ─────────
        const coupleBarY    = Math.max(anne.bottom, baba.bottom) + G;
        const coupleMidX    = (anne.x + baba.x) / 2;
        const siblingsBarY  = Math.min(ceren.top, memo.top, kaan.top) - G;
        const leftSib       = Math.min(ceren.x, memo.x, kaan.x);
        const rightSib      = Math.max(ceren.x, memo.x, kaan.x);

        // Marriage bracket
        paths.push(`M ${anne.x} ${anne.bottom} L ${anne.x} ${coupleBarY} L ${baba.x} ${coupleBarY} L ${baba.x} ${baba.bottom}`);
        // Drop then horizontal span at siblings level
        paths.push(`M ${coupleMidX} ${coupleBarY} L ${coupleMidX} ${siblingsBarY} L ${leftSib} ${siblingsBarY} L ${rightSib} ${siblingsBarY}`);
        // Drops to each sibling
        paths.push(`M ${ceren.x} ${siblingsBarY} L ${ceren.x} ${ceren.top}`);
        paths.push(`M ${memo.x}  ${siblingsBarY} L ${memo.x}  ${memo.top}`);
        paths.push(`M ${kaan.x}  ${siblingsBarY} L ${kaan.x}  ${kaan.top}`);

        // ── 4. Siblings ──► Ece (focal point) ────────────────────────────
        const sibsBottomBarY = Math.max(ceren.bottom, memo.bottom, kaan.bottom) + G;
        const midSibX        = (leftSib + rightSib) / 2;

        // Bottom bracket across siblings
        paths.push(`M ${ceren.x} ${ceren.bottom} L ${ceren.x} ${sibsBottomBarY} L ${rightSib} ${sibsBottomBarY}`);
        paths.push(`M ${memo.x}  ${memo.bottom}  L ${memo.x}  ${sibsBottomBarY}`);
        paths.push(`M ${kaan.x}  ${kaan.bottom}  L ${kaan.x}  ${sibsBottomBarY}`);
        // Drop to Ece
        paths.push(`M ${midSibX} ${sibsBottomBarY} L ${midSibX} ${ece.top - G} L ${ece.x} ${ece.top - G} L ${ece.x} ${ece.top}`);

        // ── 5. Sule ──► Öykü ─────────────────────────────────────────────
        const suleOykuBarY = sule.bottom + G * 1.5;
        paths.push(`M ${sule.x} ${sule.bottom} L ${sule.x} ${suleOykuBarY} L ${oyku.x} ${suleOykuBarY} L ${oyku.x} ${oyku.top}`);

        return paths;
    }

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
        const tree     = document.getElementById('family-tree');
        const svg      = document.getElementById('tree-svg');
        const dimLayer = document.getElementById('dim-layer');
        const glowLayer= document.getElementById('glow-layer');

        svg.setAttribute('height', tree.scrollHeight);

        buildPaths().forEach(d => {
            addPath(d, dimLayer, 'dim-path');
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

        // Viewport centre expressed in tree-local Y coordinates
        const treeRect    = tree.getBoundingClientRect();
        const viewCenterY = window.innerHeight / 2;
        const localCenterY = viewCenterY - treeRect.top;

        // Move gradient to illuminate a band around the viewport centre
        gradient.setAttribute('y1', localCenterY - GLOW_HALF);
        gradient.setAttribute('y2', localCenterY + GLOW_HALF);
    }

    // ═══════════════════════════════════════════════
    //  Initialise
    // ═══════════════════════════════════════════════
    // Small delay lets the browser finish layout before measuring positions.
    requestAnimationFrame(() => {
        setTimeout(() => {
            drawConnections();
            updateGlow();
        }, 150);
    });

    window.addEventListener('scroll', updateGlow, { passive: true });

    // Redraw on resize (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            drawConnections();
            updateGlow();
        }, 300);
    });

});
