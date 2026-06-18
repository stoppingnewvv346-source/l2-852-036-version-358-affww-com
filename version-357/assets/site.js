import { H as Hls } from './hls-dru42stk.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function initNavigation() {
    const toggle = $('[data-nav-toggle]');
    const menu = $('[data-nav-menu]');

    if (!toggle || !menu) {
        return;
    }

    toggle.addEventListener('click', () => {
        menu.classList.toggle('is-open');
    });
}

function initHero() {
    const root = $('[data-hero]');

    if (!root) {
        return;
    }

    const slides = $$('[data-hero-slide]', root);
    const dots = $$('[data-hero-dot]', root);
    const prev = $('[data-hero-prev]', root);
    const next = $('[data-hero-next]', root);
    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach((slide, current) => {
            slide.classList.toggle('is-active', current === index);
        });
        dots.forEach((dot, current) => {
            dot.classList.toggle('is-active', current === index);
        });
    };

    const restart = () => {
        window.clearInterval(timer);
        timer = window.setInterval(() => show(index + 1), 5000);
    };

    if (prev) {
        prev.addEventListener('click', () => {
            show(index - 1);
            restart();
        });
    }

    if (next) {
        next.addEventListener('click', () => {
            show(index + 1);
            restart();
        });
    }

    dots.forEach((dot, current) => {
        dot.addEventListener('click', () => {
            show(current);
            restart();
        });
    });

    restart();
}

function initHomeTabs() {
    const root = $('[data-home-tabs]');

    if (!root) {
        return;
    }

    const buttons = $$('[data-home-tab]');
    const panels = $$('[data-home-panel]');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.dataset.homeTab;
            buttons.forEach((item) => item.classList.toggle('is-active', item === button));
            panels.forEach((panel) => {
                panel.classList.toggle('is-active', panel.dataset.homePanel === key);
            });
        });
    });
}

function initFilterPanels() {
    $$('[data-filter-panel]').forEach((panel) => {
        const searchInput = $('[data-filter-search]', panel);
        const chips = $$('[data-filter-value]', panel);
        const cards = $$('[data-filter-card]', panel);
        const count = $('[data-filter-count]', panel);
        let active = 'all';

        const matches = (card, term) => {
            const haystack = [
                card.dataset.title,
                card.dataset.region,
                card.dataset.type,
                card.dataset.genre,
                card.dataset.tags
            ].join(' ').toLowerCase();
            const chipMatch = active === 'all' || haystack.includes(active.toLowerCase());
            const termMatch = !term || haystack.includes(term);
            return chipMatch && termMatch;
        };

        const apply = () => {
            const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
            let visible = 0;

            cards.forEach((card) => {
                const ok = matches(card, term);
                card.classList.toggle('is-hidden', !ok);
                if (ok) {
                    visible += 1;
                }
            });

            if (count) {
                count.textContent = `${visible} 部`;
            }
        };

        if (searchInput) {
            searchInput.addEventListener('input', apply);
        }

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                active = chip.dataset.filterValue || 'all';
                chips.forEach((item) => item.classList.toggle('is-active', item === chip));
                apply();
            });
        });
    });
}

function initPlayers() {
    $$('[data-player]').forEach((player) => {
        const video = $('video', player);
        const play = $('[data-player-play]', player);
        const status = $('[data-player-status]', player);
        const source = player.dataset.src;
        let hls = null;
        let attached = false;

        const setStatus = (message) => {
            if (status) {
                status.textContent = message;
            }
        };

        const attach = () => {
            if (attached || !video || !source) {
                return;
            }

            attached = true;
            setStatus('正在加载');

            if (Hls && Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });

                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setStatus('可以播放');
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (!data || !data.fatal) {
                        return;
                    }

                    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                        setStatus('网络重试中');
                        hls.startLoad();
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        setStatus('媒体恢复中');
                        hls.recoverMediaError();
                    } else {
                        setStatus('播放源异常');
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = source;
                setStatus('可以播放');
            } else {
                setStatus('当前浏览器不支持 HLS');
            }
        };

        const start = async () => {
            attach();

            try {
                await video.play();
                player.classList.add('is-playing');
                setStatus('播放中');
            } catch (error) {
                setStatus('点击后播放');
            }
        };

        if (play) {
            play.addEventListener('click', start);
        }

        if (video) {
            video.addEventListener('play', () => {
                player.classList.add('is-playing');
                setStatus('播放中');
            });

            video.addEventListener('pause', () => {
                player.classList.remove('is-playing');
                setStatus('已暂停');
            });
        }

        window.addEventListener('beforeunload', () => {
            if (hls) {
                hls.destroy();
            }
        });
    });
}

function makeSearchCard(movie) {
    const tags = (movie.tags || []).slice(0, 2).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('');
    return `
        <article class="video-card" data-filter-card>
            <a href="${movie.url}" class="video-cover" aria-label="观看 ${escapeHtml(movie.title)}">
                <img src="${movie.cover}" alt="${escapeHtml(movie.title)}" loading="lazy">
                <span class="play-mark">▶</span>
                <span class="year-badge">${escapeHtml(movie.year)}</span>
            </a>
            <div class="video-info">
                <a href="${movie.url}" class="video-title">${escapeHtml(movie.title)}</a>
                <p>${escapeHtml(movie.oneLine)}</p>
                <div class="video-meta">
                    <a href="${movie.categoryUrl}">${escapeHtml(movie.category)}</a>
                    <span>${escapeHtml(movie.region)}</span>
                    <span>${escapeHtml(movie.type)}</span>
                </div>
                <div class="tag-row">${tags}</div>
            </div>
        </article>
    `;
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function initSearchPage() {
    const root = $('[data-search-page]');

    if (!root || !window.SITE_VIDEOS) {
        return;
    }

    const input = $('[data-search-input]', root);
    const results = $('[data-search-results]', root);
    const summary = $('[data-search-summary]', root);
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q') || '';

    if (input) {
        input.value = initialQuery;
    }

    const run = () => {
        const query = (input ? input.value : '').trim().toLowerCase();
        const source = window.SITE_VIDEOS;
        const matched = query
            ? source.filter((movie) => movie.searchText.includes(query))
            : source.slice(0, 80);
        const limited = matched.slice(0, 200);

        if (summary) {
            summary.textContent = query
                ? `找到 ${matched.length} 条相关结果，当前显示 ${limited.length} 条。`
                : `请输入关键词搜索；下方先展示 ${limited.length} 条精选内容。`;
        }

        if (results) {
            results.innerHTML = limited.map(makeSearchCard).join('');
        }
    };

    if (input) {
        input.addEventListener('input', run);
    }

    run();
}

initNavigation();
initHero();
initHomeTabs();
initFilterPanels();
initPlayers();
initSearchPage();
