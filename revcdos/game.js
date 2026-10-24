window.__REVCDOS_STATUS__ = {
    haveOriginalGame: false,
    dataLoadedBytes: 0,
    wasmReady: false,
    mainCalled: false,
    fetchedAssetsCount: 0,
    failedFetchesCount: 0,
    lastFetchedUrl: null,
    lastError: null,
    cacheHit: false,
};

if (typeof Element !== "undefined" && Element.prototype) {
    const origRequestPointerLock = Element.prototype.requestPointerLock;
    if (typeof origRequestPointerLock === "function") {
        Element.prototype.requestPointerLock = function (...args) {
            try {
                const res = origRequestPointerLock.apply(this, args);
                if (res && typeof res.catch === "function") {
                    return res.catch(() => {});
                }
                return res;
            } catch (_) {
                return Promise.resolve();
            }
        };
    }
    const origRequestFullscreen = Element.prototype.requestFullscreen;
    if (typeof origRequestFullscreen === "function") {
        Element.prototype.requestFullscreen = function (...args) {
            try {
                const res = origRequestFullscreen.apply(this, args);
                if (res && typeof res.catch === "function") {
                    return res.catch(() => {});
                }
                return res;
            } catch (_) {
                return Promise.resolve();
            }
        };
    }
}

const cloudSavesStatus = document.getElementById('cloud-saves-status');
var statusElement = document.getElementById("status");
var progressElement = document.getElementById("progress");
var spinnerElement = document.getElementById('spinner');
var data_content;
var wasm_content;

const params = new URLSearchParams(window.location.search);

// Base URLs & expected payload metrics
const replaceBR = "vcbr/";
const EXPECTED_EN_DATA_SIZE = 135355111;
const EXPECTED_EN_WASM_SIZE = 7625877;
const CACHE_NAME = "revcdos-pack-v1";
const dataSize = EXPECTED_EN_DATA_SIZE;

let resolvedTunnelOrigin = "";
(function initTunnelParam() {
    const srv = params.get("server") || params.get("backend_url");
    if (srv && /^https?:\/\//i.test(srv.trim())) {
        resolvedTunnelOrigin = srv.trim().replace(/\/+$/, "");
    }
})();

async function resolveTunnelOriginFromConfig() {
    if (resolvedTunnelOrigin) return resolvedTunnelOrigin;
    try {
        const resp = await fetch("../tunnel.json", { cache: "no-store" });
        if (resp.ok) {
            const cfg = await resp.json();
            const candidate = cfg.url || cfg.public_https_url || cfg.backend_url || "";
            if (typeof candidate === "string" && /^https?:\/\//i.test(candidate.trim())) {
                resolvedTunnelOrigin = candidate.trim().replace(/\/+$/, "");
                return resolvedTunnelOrigin;
            }
        }
    } catch (_) {}
    return "";
}

function replaceFetch(str) {
    const raw = String(str || "");
    const qIdx = raw.indexOf("?");
    const pathPart = qIdx === -1 ? raw : raw.slice(0, qIdx);
    const queryPart = qIdx === -1 ? "" : raw.slice(qIdx);

    const basePrefix = resolvedTunnelOrigin ? `${resolvedTunnelOrigin}/revcdos/vcsky/` : "vcsky/";

    const m = pathPart.match(/^(?:https?:\/\/[^/]+\/)?\/?(?:revcdos\/)?vcsky\/(.*)$/i);
    if (m) {
        return basePrefix + m[1].toLowerCase() + queryPart;
    }
    const idx = pathPart.toLowerCase().indexOf("vcsky/");
    if (idx !== -1) {
        return basePrefix + pathPart.slice(idx + "vcsky/".length).toLowerCase() + queryPart;
    }
    return pathPart.toLowerCase() + queryPart;
}
window.replaceFetch = replaceFetch;

// Wrap #canvas getContext so WebGL2/WebGL contexts preserve their drawing buffer for frame inspection
(function wrapCanvasWebGLContext() {
    const canvas = document.getElementById("canvas");
    if (!canvas || canvas.__revcdosWrapped) return;
    const origGetContext = canvas.getContext.bind(canvas);
    canvas.getContext = function (type, attrs) {
        if (type === "webgl2" || type === "webgl" || type === "experimental-webgl") {
            attrs = Object.assign({}, attrs || {}, { preserveDrawingBuffer: true });
        }
        return origGetContext(type, attrs);
    };
    canvas.__revcdosWrapped = true;
})();

// Unlock Web Audio contexts on user gesture
(function setupWebAudioUnlock() {
    const activeAudioContexts = [];
    const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OrigAudioContext && !OrigAudioContext.__revcdosWrapped) {
        const WrappedAudioContext = function (...args) {
            const ctx = new OrigAudioContext(...args);
            activeAudioContexts.push(ctx);
            return ctx;
        };
        WrappedAudioContext.prototype = OrigAudioContext.prototype;
        Object.setPrototypeOf(WrappedAudioContext, OrigAudioContext);
        WrappedAudioContext.__revcdosWrapped = true;
        window.AudioContext = WrappedAudioContext;
        if (window.webkitAudioContext) window.webkitAudioContext = WrappedAudioContext;
    }
    const resumeAllAudio = () => {
        for (const ctx of activeAudioContexts) {
            if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
                try { ctx.resume().catch(() => {}); } catch (_) {}
            }
        }
    };
    ["pointerdown", "click", "keydown", "touchend"].forEach((evt) => {
        window.addEventListener(evt, resumeAllAudio, { passive: true });
    });
})();

// Configurable mode - show settings UI before play
const configurableMode = params.get('configurable') === "1";

// Settings that can be configured via URL or UI
var autoFullScreen = params.get('fullscreen') !== "0";
var cheatsEnabled = params.get('cheats') !== "0";
var maxFPS = parseInt(params.get('max_fps')) || 0;

// Pre-enabled full-game mode (unless ?request_original_game=1)
if (params.get('request_original_game') === "1") {
    try {
        localStorage.removeItem('vcsky.haveOriginalGame');
    } catch (e) {}
} else {
    try {
        localStorage.setItem('vcsky.haveOriginalGame', 'true');
    } catch (e) {}
}

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let isTouch = isMobile && window.matchMedia('(pointer: coarse)').matches;

document.body.dataset.isTouch = isTouch ? 1 : 0;

const textDecoder = new TextDecoder();
let haveOriginalGame = false;

const translations = {
    en: {
        clickToPlayDemo: "Click to play demo",
        clickToPlayFull: "Click to play",
        invalidKey: "invalid key",
        checking: "checking...",
        cloudSaves: "Cloud saves:",
        enabled: "enabled",
        disabled: "disabled",
        playDemoText: "You can play the DEMO version, or provide the original game files to play the full version.",
        disclaimer: "DISCLAIMER:",
        disclaimerSources: "This game is based on an open source version of GTA: Vice City. It is not a commercial release and is not affiliated with Rockstar Games.",
        disclaimerCheckbox: "I own the original game",
        disclaimerPrompt: "You need to provide a file from the original game to confirm ownership of the original game.",
        cantContinuePlaying: "You can't continue playing in DEMO version. Please provide the original game files to continue playing.",
        demoAlert: "The demo version is intended only for familiarizing yourself with the game technology. All features are available, but you won't be able to progress through the game's storyline. Please provide the original game files to launch the full version.",
        downloading: "Downloading",
        enterKey: "enter your key",
        clickToContinue: "Click to continue...",
        enterJsDosKey: "Enter js-dos key (5 len)",
        portBy: "HTML5 port by:",
        ruTranslate: "",
        demoOffDisclaimer: "Due to the unexpectedly high popularity of the project, resulting in significant traffic costs, and in order to avoid any risk of the project being shut down due to rights holder claims, we have disabled the demo version. You can still run the full version by providing the original game resources.",
        configLanguage: "Language:",
        configCheats: "Cheats (F3)",
        configFullscreen: "Fullscreen",
        configMaxFps: "Max FPS:",
        configUnlimited: "(0 = unlimited)",
    },
    ru: {
        clickToPlayDemo: "Играть в демо версию",
        clickToPlayFull: "Играть",
        invalidKey: "неверный ключ",
        checking: "проверка...",
        cloudSaves: "Облачные сохранения:",
        enabled: "включены",
        disabled: "выключены",
        playDemoText: "Вы можете играть в демо версию, или предоставить оригинальные файлы игры для полной версии.",
        disclaimer: "ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ:",
        disclaimerSources: "Эта игра основана на открытой версии GTA: Vice City. Она не является коммерческим изданием и не связана с Rockstar Games.",
        disclaimerCheckbox: "Я владею оригинальной игрой",
        disclaimerPrompt: "Вам потребуется приложить какой-либо файл из оригинальной игры для подтверждения владения оригинальной игрой.",
        cantContinuePlaying: "Вы не можете продолжить игру в демо версии. Пожалуйста, предоставьте оригинальные файлы игры для продолжения игры.",
        demoAlert: "Демо версия предназначена только для ознакомления с технологией игры. Все функции доступны, но вы не сможете продолжить игру по сюжету. Пожалуйста, предоставьте оригинальные файлы игры для запуска полной версии.",
        downloading: "Загрузка",
        enterKey: "введите ваш ключ",
        clickToContinue: "Нажмите для продолжения...",
        enterJsDosKey: "Введите ключ js-dos (5 букв)",
        portBy: "Авторы HTML5 порта:",
        ruTranslate: `
<div class="translated-by">
    <span>Переведено на русский студией</span>
    <a href="https://www.gamesvoice.ru/" target="_blank">GamesVoice</a>
</div>
`,
        demoOffDisclaimer: "В связи с неожиданно высокой популярностью проекта, как следствие — значительными расходами на трафик, а также во избежание рисков закрытия проекта из-за претензий правообладателей, мы отключили возможность запуска демо-версии. При этом вы по-прежнему можете запустить полную версию, предоставив оригинальные ресурсы.",
        configLanguage: "Язык:",
        configCheats: "Читы (F3)",
        configFullscreen: "Полный экран",
        configMaxFps: "Макс. FPS:",
        configUnlimited: "(0 = без ограничений)",
    },
};

var currentLanguage = "en";
if (params.get("lang") === "ru") {
    currentLanguage = "ru";
} else if (params.get("lang") === "en") {
    currentLanguage = "en";
}
window.currentLanguage = currentLanguage;

window.t = function (key) {
    return (translations[currentLanguage] && translations[currentLanguage][key]) ?? translations.en[key] ?? key;
};

function updateGameDataForLanguage(lang) {
    if (lang === 'ru') {
        data_content = `${replaceBR}vc-sky-ru-v6.data`;
        wasm_content = `${replaceBR}vc-sky-ru-v6.wasm`;
    } else {
        data_content = `${replaceBR}vc-sky-en-v6.data`;
        wasm_content = `${replaceBR}vc-sky-en-v6.wasm`;
    }
}

updateGameDataForLanguage(currentLanguage);

function updateAllTranslations() {
    const keyInputEl = document.querySelector('.jsdos-key-input');
    if (keyInputEl) keyInputEl.setAttribute('placeholder', t("enterJsDosKey"));

    const clickToPlayBtn = document.getElementById('click-to-play-button');
    if (clickToPlayBtn) {
        clickToPlayBtn.textContent = haveOriginalGame ? t('clickToPlayFull') : t('clickToPlayDemo');
    }

    const demoOffDisclaimerEl = document.getElementById('demo-off-disclaimer');
    if (demoOffDisclaimerEl) {
        demoOffDisclaimerEl.textContent = haveOriginalGame ? "" : "* " + t('demoOffDisclaimer');
        demoOffDisclaimerEl.hidden = Boolean(haveOriginalGame);
    }

    const cloudSavesLinkEl = document.getElementById('cloud-saves-link');
    if (cloudSavesLinkEl) cloudSavesLinkEl.textContent = t('cloudSaves');

    if (cloudSavesStatus) cloudSavesStatus.textContent = t('enterKey');

    const playDemoTextEl = document.getElementById('play-demo-text');
    if (playDemoTextEl) playDemoTextEl.textContent = t('playDemoText');

    const disclaimerTextEl = document.getElementById('disclaimer-text');
    if (disclaimerTextEl) disclaimerTextEl.textContent = t('disclaimer');

    const disclaimerSourcesEl = document.getElementById('disclaimer-sources');
    if (disclaimerSourcesEl) disclaimerSourcesEl.textContent = t('disclaimerSources');

    const disclaimerCheckboxLabelEl = document.getElementById('disclaimer-checkbox-label');
    if (disclaimerCheckboxLabelEl) disclaimerCheckboxLabelEl.textContent = t('disclaimerCheckbox');

    const portByEl = document.getElementById('port-by');
    if (portByEl) portByEl.textContent = t('portBy');

    const developedByEl = document.querySelector('.developed-by');
    const existingTranslatedBy = developedByEl?.querySelector('.translated-by');
    if (existingTranslatedBy) existingTranslatedBy.remove();
    if (developedByEl && t('ruTranslate')) {
        developedByEl.insertAdjacentHTML('beforeend', t('ruTranslate'));
    }

    const configLangLabel = document.getElementById('config-lang-label');
    if (configLangLabel) configLangLabel.textContent = t('configLanguage');

    const configCheatsLabel = document.getElementById('config-cheats-label');
    if (configCheatsLabel) configCheatsLabel.textContent = t('configCheats');

    const configFullscreenLabel = document.getElementById('config-fullscreen-label');
    if (configFullscreenLabel) configFullscreenLabel.textContent = t('configFullscreen');

    const configMaxFpsLabel = document.getElementById('config-max-fps-label');
    if (configMaxFpsLabel) configMaxFpsLabel.textContent = t('configMaxFps');

    const configMaxFpsUnlimited = document.getElementById('config-max-fps-unlimited');
    if (configMaxFpsUnlimited) configMaxFpsUnlimited.textContent = t('configUnlimited');
}

async function readResponseWithProgress(response, totalBytes, initialOffset = 0) {
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${response.url}`);
    }
    if (!response.body || typeof response.body.getReader !== "function") {
        const ab = await response.arrayBuffer();
        const u8 = new Uint8Array(ab);
        const loaded = initialOffset + u8.byteLength;
        window.__REVCDOS_STATUS__.dataLoadedBytes = loaded;
        if (typeof setStatus === "function") {
            setStatus(`Downloading...(${loaded}/${totalBytes})`);
        }
        return u8;
    }
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        const loaded = initialOffset + receivedLength;
        window.__REVCDOS_STATUS__.dataLoadedBytes = loaded;
        if (typeof setStatus === "function") {
            setStatus(`Downloading...(${loaded}/${totalBytes})`);
        }
    }
    const out = new Uint8Array(receivedLength);
    let pos = 0;
    for (const chunk of chunks) {
        out.set(chunk, pos);
        pos += chunk.length;
    }
    return out;
}

async function fetchPartsAndConcatenate(basePrefix = "") {
    let partsList = [
        "./parts/vc-sky-en-v6.data.part00",
        "./parts/vc-sky-en-v6.data.part01",
        "./parts/vc-sky-en-v6.data.part02",
        "./parts/vc-sky-en-v6.data.part03",
    ];
    let expectedTotal = EXPECTED_EN_DATA_SIZE;

    try {
        const packResp = await fetch(`${basePrefix}pack.json`, { cache: "no-store" });
        if (packResp.ok) {
            const pack = await packResp.json();
            const dataMeta = pack?.data || pack?.files?.["vcbr/vc-sky-en-v6.data"];
            if (dataMeta) {
                if (typeof dataMeta.size === "number" && dataMeta.size > 0) {
                    expectedTotal = dataMeta.size;
                } else if (typeof dataMeta.totalBytes === "number" && dataMeta.totalBytes > 0) {
                    expectedTotal = dataMeta.totalBytes;
                }
                if (Array.isArray(dataMeta.parts) && dataMeta.parts.length > 0) {
                    partsList = dataMeta.parts.map((p) => (typeof p === "string" ? p : p.path || p.file));
                }
            }
        }
    } catch (_) {}

    const combined = new Uint8Array(expectedTotal);
    let offset = 0;
    for (const part of partsList) {
        const cleanPart = part.replace(/^\.\//, "");
        const url = basePrefix ? `${basePrefix}${cleanPart}` : part;
        const resp = await fetch(url);
        const partBytes = await readResponseWithProgress(resp, expectedTotal, offset);
        if (offset + partBytes.byteLength > combined.byteLength) {
            throw new Error(`Chunk overflow assembling ${url}`);
        }
        combined.set(partBytes, offset);
        offset += partBytes.byteLength;
    }
    if (offset !== expectedTotal) {
        throw new Error(`Incomplete multipart assembly: got ${offset}, expected ${expectedTotal}`);
    }
    return combined;
}

async function loadData() {
    const forceParts = params.get("useparts") === "1";
    const skipCache = params.get("nocache") === "1";
    let cache = null;

    if (!skipCache && typeof caches !== "undefined") {
        try {
            cache = await caches.open(CACHE_NAME);
            if (!forceParts) {
                const cached = (await cache.match(data_content)) || (await cache.match(`./${data_content}`));
                if (cached && data_content !== "index.data") {
                    const ab = await cached.arrayBuffer();
                    if (currentLanguage !== "en" || ab.byteLength === EXPECTED_EN_DATA_SIZE) {
                        window.__REVCDOS_STATUS__.cacheHit = true;
                        window.__REVCDOS_STATUS__.dataLoadedBytes = ab.byteLength;
                        if (typeof setStatus === "function") {
                            setStatus(`Downloading...(${ab.byteLength}/${dataSize})`);
                        }
                        return new Uint8Array(ab);
                    }
                }
            }
        } catch (e) {
            console.warn("Failed to open CacheStorage:", e);
        }
    }

    let u8Buffer = null;

    // 1. Try direct fetch of vcbr/vc-sky-en-v6.data unless ?useparts=1
    if (!forceParts) {
        try {
            const response = await fetch(data_content);
            const candidate = await readResponseWithProgress(response, dataSize, 0);
            if (currentLanguage === "en" && candidate.byteLength !== EXPECTED_EN_DATA_SIZE) {
                throw new Error(`Invalid byte length ${candidate.byteLength} for ${data_content}`);
            }
            u8Buffer = candidate;
        } catch (directErr) {
            console.warn("Direct .data fetch unavailable, falling back to 4-part chunks:", directErr);
        }
    }

    // 2. Fallback (or ?useparts=1): stream and concatenate ./parts/vc-sky-en-v6.data.part00..03
    if (!u8Buffer) {
        try {
            u8Buffer = await fetchPartsAndConcatenate("");
        } catch (partsErr) {
            console.warn("Local parts fetch failed, checking ../tunnel.json failover:", partsErr);
        }
    }

    // 3. Failover to ../tunnel.json if hosted on a static origin without local binaries
    if (!u8Buffer) {
        const tunnelOrigin = await resolveTunnelOriginFromConfig();
        if (tunnelOrigin) {
            const remoteBase = `${tunnelOrigin}/revcdos/`;
            try {
                const response = await fetch(`${remoteBase}${data_content}`);
                u8Buffer = await readResponseWithProgress(response, dataSize, 0);
            } catch (_) {
                u8Buffer = await fetchPartsAndConcatenate(remoteBase);
            }
        }
    }

    if (!u8Buffer || (currentLanguage === "en" && u8Buffer.byteLength !== EXPECTED_EN_DATA_SIZE)) {
        const msg = `Failed to load ${data_content} (got ${u8Buffer ? u8Buffer.byteLength : 0} bytes, expected ${EXPECTED_EN_DATA_SIZE})`;
        window.__REVCDOS_STATUS__.lastError = msg;
        throw new Error(msg);
    }

    window.__REVCDOS_STATUS__.dataLoadedBytes = u8Buffer.byteLength;

    if (cache && !skipCache) {
        try {
            await cache.put(
                data_content,
                new Response(u8Buffer.buffer.slice(u8Buffer.byteOffset, u8Buffer.byteOffset + u8Buffer.byteLength), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Content-Length": String(u8Buffer.byteLength),
                    },
                })
            );
        } catch (e) {
            console.warn("Failed to cache data in CacheStorage:", e.message);
        }
    }

    return u8Buffer;
}

let startInProgress = false;
async function startGame(e) {
    if (e && typeof e.stopPropagation === "function") {
        e.stopPropagation();
    }
    if (startInProgress) return;
    startInProgress = true;

    const startContainer = document.querySelector('.start-container');
    if (startContainer) startContainer.style.display = 'none';
    const disclaimerEl = document.querySelector('.disclaimer');
    if (disclaimerEl) disclaimerEl.style.display = 'none';
    const developedByEl = document.querySelector('.developed-by');
    if (developedByEl) developedByEl.style.display = 'none';

    const intro = document.querySelector('.intro');
    const introContainer = document.querySelector('.intro-container');
    const loaderContainer = document.querySelector('.loader-container');
    const clickToPlayEl = document.querySelector('.click-to-play');
    if (clickToPlayEl) clickToPlayEl.style.display = 'none';
    if (loaderContainer) loaderContainer.style.display = "flex";
    if (introContainer) introContainer.hidden = false;
    if (intro) {
        try {
            const playPromise = intro.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => {});
            }
        } catch (_) {}
    }

    try {
        const dataBuffer = await loadData();
        if (spinnerElement) spinnerElement.hidden = true;
        setStatus(t("clickToContinue"));
        if (introContainer) {
            introContainer.hidden = false;
            introContainer.style.cursor = 'pointer';
        }

        let gameLaunched = false;
        let autoTimer = null;
        const continueToGame = () => {
            if (gameLaunched) return;
            gameLaunched = true;
            if (autoTimer) {
                clearTimeout(autoTimer);
                autoTimer = null;
            }
            window.removeEventListener('click', continueToGame);
            window.removeEventListener('pointerup', continueToGame);
            window.removeEventListener('keydown', continueToGame);
            if (intro) {
                try { intro.pause(); } catch (_) {}
            }
            if (introContainer) {
                introContainer.style.display = 'none';
            }
            loadGame(dataBuffer);
        };

        window.addEventListener('click', continueToGame, { once: true });
        window.addEventListener('pointerup', continueToGame, { once: true });
        window.addEventListener('keydown', continueToGame, { once: true });

        if (
            params.get('autostart') === '1' ||
            params.get('autostart') === 'true' ||
            params.get('skip_intro') === '1'
        ) {
            continueToGame();
        } else {
            autoTimer = setTimeout(continueToGame, 1500);
        }
    } catch (err) {
        startInProgress = false;
        window.__REVCDOS_STATUS__.lastError = String(err?.message || err);
        setStatus(`Error: ${err?.message || err}`);
        if (spinnerElement) spinnerElement.hidden = true;
    }
}

function setStatus(text) {
    if (!text) {
        if (progressElement) progressElement.hidden = true;
        if (spinnerElement) spinnerElement.hidden = true;
        return;
    }
    const match = text.match(/(.+)\((\d+\.?\d*)\/(\d+)\)/);
    if (match) {
        const [current, total] = match.slice(2, 4).map(Number);
        const percent = (current / total * 100).toFixed(0);
        if (statusElement) statusElement.textContent = t("downloading") + ` ${percent}%`;
        if (progressElement) {
            progressElement.value = current;
            progressElement.max = total;
            progressElement.hidden = false;
        }
        if (spinnerElement) {
            spinnerElement.hidden = false;
            const progressBarFill = spinnerElement.querySelector('.progress-bar-fill');
            if (progressBarFill) {
                progressBarFill.style.width = percent + '%';
            }
        }
    } else if (statusElement) {
        statusElement.textContent = text;
    }
}

async function loadGame(data) {
    const pkgBuffer = data.buffer.byteLength === data.byteLength
        ? data.buffer
        : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

    var Module = {
        mainCalled: () => {
            window.__REVCDOS_STATUS__.wasmReady = true;
            window.__REVCDOS_STATUS__.mainCalled = true;
            try {
                try {
                    Module.FS.unlink("/vc-assets/local/revc.ini");
                } catch (_) {}
                Module.FS.createDataFile("/vc-assets/local/revc.ini", 0, revc_ini, true, true);
            } catch (e) {
                console.error('mainCalled error:', e);
            }
        },
        syncRevcIni: () => {
            try {
                const path = Module.FS.lookupPath("/vc-assets/local/revc.ini");
                if (path && path.node && path.node.contents) {
                    localStorage.setItem('vcsky.revc.ini', textDecoder.decode(path.node.contents));
                }
            } catch (e) {
                console.error('syncRevcIni error:', e);
            }
        },
        preRun: [],
        postRun: [],
        print: (...args) => console.log(args.join(' ')),
        printErr: (...args) => {
            const msg = args.join(' ');
            if (msg.includes('alGetProcAddress() called without a valid context')) return;
            console.error(msg);
        },
        getPreloadedPackage: () => {
            return pkgBuffer;
        },
        canvas: (function () {
            const canvas = document.getElementById('canvas');
            canvas.addEventListener('webglcontextlost', (e) => {
                window.__REVCDOS_STATUS__.lastError = 'WebGL context lost';
                if (statusElement) statusElement.textContent = 'WebGL context lost. Please reload the page.';
                e.preventDefault();
            });
            return canvas;
        })(),
        setStatus,
        totalDependencies: 0,
        monitorRunDependencies: (num) => {
            Module.totalDependencies = Math.max(Module.totalDependencies, num);
            Module.setStatus(`Preparing... (${Module.totalDependencies - num}/${Module.totalDependencies})`);
        },
        hotelMission: () => {
            if (!haveOriginalGame) {
                showWasted();
                alert(t("cantContinuePlaying"));
                throw new Error(t("cantContinuePlaying"));
            }
        },
    };
    Module.log = Module.print;
    Module.instantiateWasm = async (info, receiveInstance) => {
        try {
            const wasmResp = await fetch(wasm_content ? wasm_content : "vcbr/vc-sky-en-v6.wasm");
            if (!wasmResp.ok) {
                throw new Error(`HTTP ${wasmResp.status} fetching ${wasm_content}`);
            }
            const wasm = await wasmResp.arrayBuffer();
            const module = await WebAssembly.instantiate(wasm, info);
            window.__REVCDOS_STATUS__.wasmReady = true;
            return receiveInstance(module.instance, module);
        } catch (err) {
            window.__REVCDOS_STATUS__.lastError = String(err?.message || err);
            throw err;
        }
    };
    window.onerror = (message) => {
        window.__REVCDOS_STATUS__.lastError = String(message);
        Module.setStatus(`Error: ${message}`);
        if (spinnerElement) spinnerElement.hidden = true;
    };

    const ignoredParams = new Set([
        'autostart',
        'useparts',
        'nocache',
        'skip_intro',
        'request_original_game',
        'configurable',
        'lang',
        'server',
        'backend_url',
        'custom_saves',
        'fullscreen',
        'cheats',
        'max_fps',
    ]);
    Module.arguments = [];
    for (const [k, v] of params.entries()) {
        if (ignoredParams.has(k)) continue;
        Module.arguments.push(k);
        if (v) Module.arguments.push(v);
    }

    // Non-blocking save sync on pagehide so returning to '../' never triggers a blocking prompt
    window.addEventListener('pagehide', () => {
        try {
            Module.syncRevcIni?.();
        } catch (_) {}
    });

    window.Module = Module;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'index.js';
    document.body.appendChild(script);

    document.body.classList.add('gameIsStarted');

    if (typeof GamepadEmulator === "function") {
        const emulator = new GamepadEmulator();
        emulator.AddEmulatedGamepad(null, true);
        const moveEl = document.getElementById('move');
        const lookEl = document.getElementById('look');
        if (moveEl) {
            emulator.AddDisplayJoystickEventListeners(0, [{
                directions: { up: true, down: true, left: true, right: true },
                dragDistance: 100,
                tapTarget: moveEl,
                lockTargetWhilePressed: true,
                xAxisIndex: 0,
                yAxisIndex: 1,
                swapAxes: false,
                invertX: false,
                invertY: false,
            }]);
        }
        if (lookEl) {
            emulator.AddDisplayJoystickEventListeners(0, [{
                directions: { up: true, down: true, left: true, right: true },
                dragDistance: 100,
                tapTarget: lookEl,
                lockTargetWhilePressed: true,
                xAxisIndex: 2,
                yAxisIndex: 3,
                swapAxes: false,
                invertX: false,
                invertY: false,
            }]);
        }

        const bindTouchBtn = (cfg) => {
            if (cfg.tapTarget) emulator.AddDisplayButtonEventListeners(0, [cfg]);
        };
        bindTouchBtn({ buttonIndex: 9, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.menu') });
        bindTouchBtn({ buttonIndex: 3, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.car.getIn') });
        bindTouchBtn({ buttonIndex: 0, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.run') });
        bindTouchBtn({ buttonIndex: 1, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.fist') });
        bindTouchBtn({ buttonIndex: 5, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.drift') });
        bindTouchBtn({ buttonIndex: 2, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.jump') });
        bindTouchBtn({ buttonIndex: 4, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.mobile') });
        bindTouchBtn({ buttonIndex: 11, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.job') });
        bindTouchBtn({ buttonIndex: 4, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.radio') });
        bindTouchBtn({ buttonIndex: 7, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.weapon') });
        bindTouchBtn({ buttonIndex: 8, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.camera') });
        bindTouchBtn({ buttonIndex: 10, lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.horn') });
        bindTouchBtn({ buttonIndex: 7, buttonIndexes: [1, 7], lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.fireRight') });
        bindTouchBtn({ buttonIndex: 6, buttonIndexes: [1, 6], lockTargetWhilePressed: false, tapTarget: document.querySelector('.touch-control.fireLeft') });
    }
}

const clickToPlay = document.querySelector('.click-to-play');
const clickLink = clickToPlay ? clickToPlay.querySelector('button') : document.getElementById('click-to-play-button');
if (clickToPlay) {
    clickToPlay.addEventListener('click', (e) => {
        if (!haveOriginalGame) {
            alert(t('demoOffDisclaimer'));
            return;
        }
        if (e.target === clickToPlay || e.target === clickLink) {
            startGame(e);
            if (!isMobile && autoFullScreen && params.get('autostart') !== '1') {
                if (window.top === window) {
                    try {
                        const req = document.body.requestFullscreen?.(document.documentElement);
                        if (req && typeof req.catch === "function") req.catch(() => {});
                    } catch (_) {}
                } else {
                    window.top.postMessage({ event: 'request-fullscreen' }, '*');
                }
                function lockMouseIfNeeded() {
                    if (!document.pointerLockElement && typeof Module !== 'undefined' && Module.canvas) {
                        try {
                            const p = Module.canvas.requestPointerLock({ unadjustedMovement: true });
                            if (p && typeof p.catch === "function") {
                                p.catch(() => {
                                    try { Module.canvas.requestPointerLock()?.catch?.(() => {}); } catch (_) {}
                                });
                            }
                        } catch (_) {}
                    }
                }
                document.addEventListener("mousedown", lockMouseIfNeeded, { capture: true });
                if (navigator.keyboard && navigator.keyboard.lock) {
                    try { navigator.keyboard.lock(["Escape", "KeyW"])?.catch?.(() => {}); } catch (_) {}
                }
            }
        } else if (window.top !== window) {
            window.top.postMessage({ event: 'request-fullscreen' }, '*');
        }
    });
}

const savesMountPoint = "/vc-assets/local/userfiles";
const savesFile = "vcsky.saves";
if (typeof wrapIDBFS === "function") {
    wrapIDBFS(console.log).addListener({
        onLoad: (_, mount) => {
            if (mount.mountpoint !== savesMountPoint) {
                return null;
            }
            const token = localStorage.getItem('vcsky.key');
            if (token && token.length === 5 && typeof CloudSDK !== "undefined") {
                const promise = CloudSDK.pullFromStorage(token, savesFile);
                promise.then((payload) => {
                    console.log('[IDBFS] onLoad', token, payload ? payload.length / 1024 : 0, 'kb');
                });
                return promise;
            }
            return null;
        },
        onSave: (getData, _, mount) => {
            if (mount.mountpoint !== savesMountPoint) {
                return;
            }
            const token = localStorage.getItem('vcsky.key');
            if (token && token.length === 5 && typeof CloudSDK !== "undefined") {
                getData().then((payload) => {
                    if (payload.length > 0) {
                        console.log('[IDBFS] onSave', token, payload.length / 1024, 'kb');
                        return CloudSDK.pushToStorage(token, savesFile, payload);
                    }
                });
            }
        },
    });
}

const keyInput = document.querySelector('.jsdos-key-input');
const keyStatus = document.querySelector('.jsdos-key-status');

function updateToken(token) {
    if (!cloudSavesStatus || !keyStatus) return;
    cloudSavesStatus.textContent = t('checking');
    if (token.length === 5 && typeof CloudSDK !== "undefined") {
        CloudSDK.resolveToken(token).then((profile) => {
            if (profile) {
                localStorage.setItem('vcsky.key', profile.token);
                if (profile.premium) {
                    keyStatus.textContent = t('enabled');
                    keyStatus.style.color = 'green';
                    keyStatus.style.fontWeight = 'bold';
                } else {
                    keyStatus.textContent = t('disabled');
                    keyStatus.style.color = 'red';
                    keyStatus.style.fontWeight = 'bold';
                }
            } else {
                keyStatus.textContent = t('invalidKey');
                keyStatus.style.color = 'white';
                keyStatus.style.fontWeight = 'normal';
            }
        });
    } else {
        cloudSavesStatus.textContent = t('enterKey');
    }
}

if (keyInput) {
    keyInput.setAttribute('placeholder', t("enterJsDosKey"));
    keyInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            updateToken(e.target.value);
        }, 100);
    });
    keyInput.addEventListener('keyup', (e) => {
        updateToken(e.target.value);
    });
    if (localStorage.getItem('vcsky.key')) {
        keyInput.value = localStorage.getItem('vcsky.key');
        updateToken(keyInput.value);
    } else if (keyStatus) {
        keyStatus.textContent = t('invalidKey');
        keyStatus.style.color = 'white';
        keyStatus.style.fontWeight = 'normal';
    }
}

const clickToPlayButton = document.getElementById('click-to-play-button');
const demoOffDisclaimer = document.getElementById('demo-off-disclaimer');
const cloudSavesLink = document.getElementById('cloud-saves-link');
const playDemoText = document.getElementById('play-demo-text');
const disclaimerText = document.getElementById('disclaimer-text');
const disclaimerSources = document.getElementById('disclaimer-sources');
const disclaimerCheckboxLabel = document.getElementById('disclaimer-checkbox-label');
const disclaimerCheckbox = document.getElementById('disclaimer-checkbox');
const originalGameFile = document.getElementById('original-game-file');
const developedBy = document.querySelector('.developed-by');
const portBy = document.getElementById('port-by');

updateAllTranslations();

function ownerShipConfirmed() {
    try {
        localStorage.setItem('vcsky.haveOriginalGame', 'true');
    } catch (_) {}
    haveOriginalGame = true;
    window.__REVCDOS_STATUS__.haveOriginalGame = true;
    if (disclaimerCheckbox) disclaimerCheckbox.checked = true;
    if (clickToPlayButton) {
        clickToPlayButton.textContent = t('clickToPlayFull');
        clickToPlayButton.classList.remove('disabled');
    }
    if (demoOffDisclaimer) {
        demoOffDisclaimer.textContent = "";
        demoOffDisclaimer.hidden = true;
    }
}

function ownerShipNotConfirmed() {
    try {
        localStorage.removeItem('vcsky.haveOriginalGame');
    } catch (_) {}
    haveOriginalGame = false;
    window.__REVCDOS_STATUS__.haveOriginalGame = false;
    if (disclaimerCheckbox) disclaimerCheckbox.checked = false;
    if (clickToPlayButton) {
        clickToPlayButton.textContent = t('clickToPlayDemo');
        clickToPlayButton.classList.add('disabled');
    }
    if (demoOffDisclaimer) {
        demoOffDisclaimer.textContent = "* " + t('demoOffDisclaimer');
        demoOffDisclaimer.hidden = false;
    }
}

if (disclaimerCheckbox) {
    disclaimerCheckbox.addEventListener('change', async (inputEvent) => {
        if (inputEvent.target.checked) {
            if (confirm(t('disclaimerPrompt'))) {
                originalGameFile.addEventListener('change', async (e) => {
                    try {
                        const file = e.target.files[0];
                        if (file) {
                            const sha256sums = (await (await fetch(replaceFetch("https://cdn.dos.zone/vcsky/sha256sums.txt"))).text()).toLowerCase();
                            const arrayBuffer = await file.arrayBuffer();
                            if (window.crypto && window.crypto.subtle) {
                                const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
                                const hashArray = Array.from(new Uint8Array(hashBuffer));
                                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                                if (sha256sums.indexOf(hashHex) !== -1) {
                                    ownerShipConfirmed();
                                } else {
                                    ownerShipNotConfirmed();
                                }
                            } else {
                                ownerShipNotConfirmed();
                            }
                        } else {
                            ownerShipNotConfirmed();
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        ownerShipNotConfirmed();
                    }
                }, { once: true });
                originalGameFile.click();
                return;
            }
        }
        ownerShipNotConfirmed();
    });
}

(localStorage.getItem('vcsky.haveOriginalGame') === 'true' || params.get('request_original_game') !== '1')
    ? ownerShipConfirmed()
    : ownerShipNotConfirmed();

function showWasted() {
    const wastedContainer = document.querySelector('.wasted-container');
    if (wastedContainer) wastedContainer.hidden = false;
}

const revc_iniDefault = `
[VideoMode]
Width=800
Height=600
Depth=32
Subsystem=0
Windowed=0
[Controller]
HeadBob1stPerson=0
HorizantalMouseSens=0.002500
InvertMouseVertically=1
DisableMouseSteering=1
Vibration=0
Method=${isTouch ? '1' : '0'}
InvertPad=0
JoystickName=
PadButtonsInited=0
[Audio]
SfxVolume=36
MusicVolume=37
MP3BoostVolume=0
Radio=0
SpeakerType=0
Provider=0
DynamicAcoustics=1
[Display]
Brightness=256
DrawDistance=1.800000
Subtitles=0
ShowHud=1
RadarMode=0
ShowLegends=0
PedDensity=1.200000
CarDensity=1.200000
CutsceneBorders=1
FreeCam=0
[Graphics]
AspectRatio=0
VSync=1
Trails=1
FrameLimiter=0
MultiSampling=0
IslandLoading=0
PS2AlphaTest=1
ColourFilter=2
MotionBlur=0
VehiclePipeline=0
NeoRimLight=0
NeoLightMaps=0
NeoRoadGloss=0
[General]
SkinFile=$$""
Language=0
DrawVersionText=0
NoMovies=0
[CustomPipesValues]
PostFXIntensity=1.000000
NeoVehicleShininess=1.000000
NeoVehicleSpecularity=1.000000
RimlightMult=1.000000
LightmapMult=1.000000
GlossMult=1.000000
[Rendering]
BackfaceCulling=1
NewRenderer=1
[Draw]
ProperScaling=1
FixRadar=1
FixSprites=1
[Bindings]
PED_FIREWEAPON=mouse:LEFT,2ndKbd:PAD5
PED_CYCLE_WEAPON_RIGHT=2ndKbd:PADENTER,mouse:WHLDOWN,kbd:E
PED_CYCLE_WEAPON_LEFT=kbd:PADDEL,mouse:WHLUP,2ndKbd:Q
GO_FORWARD=kbd:UP,2ndKbd:W
GO_BACK=kbd:DOWN,2ndKbd:S
GO_LEFT=2ndKbd:A,kbd:LEFT
GO_RIGHT=kbd:RIGHT,2ndKbd:D
PED_SNIPER_ZOOM_IN=kbd:PGUP,2ndKbd:Z,mouse:WHLUP
PED_SNIPER_ZOOM_OUT=kbd:PGDN,2ndKbd:X,mouse:WHLDOWN
VEHICLE_ENTER_EXIT=kbd:ENTER,2ndKbd:F
CAMERA_CHANGE_VIEW_ALL_SITUATIONS=kbd:HOME,2ndKbd:V
PED_JUMPING=kbd:RCTRL,2ndKbd:SPC
PED_SPRINT=2ndKbd:LSHIFT,kbd:RSHIFT
PED_LOOKBEHIND=2ndKbd:CAPSLK,mouse:MIDDLE,kbd:PADINS
PED_DUCK=kbd:C
PED_ANSWER_PHONE=kbd:TAB
VEHICLE_FIREWEAPON=kbd:PADINS,2ndKbd:LCTRL,mouse:LEFT
VEHICLE_ACCELERATE=2ndKbd:W
VEHICLE_BRAKE=2ndKbd:S
VEHICLE_CHANGE_RADIO_STATION=kbd:INS,2ndKbd:R
VEHICLE_HORN=2ndKbd:LSHIFT,kbd:RSHIFT
TOGGLE_SUBMISSIONS=kbd:PLUS,2ndKbd:CAPSLK
VEHICLE_HANDBRAKE=kbd:RCTRL,2ndKbd:SPC,mouse:RIGHT
PED_1RST_PERSON_LOOK_LEFT=kbd:PADLEFT
PED_1RST_PERSON_LOOK_RIGHT=kbd:PADHOME
VEHICLE_LOOKLEFT=kbd:PADEND,2ndKbd:Q
VEHICLE_LOOKRIGHT=kbd:PADDOWN,2ndKbd:E
VEHICLE_LOOKBEHIND=mouse:MIDDLE
VEHICLE_TURRETLEFT=kbd:PADLEFT
VEHICLE_TURRETRIGHT=kbd:PAD5
VEHICLE_TURRETUP=kbd:PADPGUP,2ndKbd:UP
VEHICLE_TURRETDOWN=kbd:PADRIGHT,2ndKbd:DOWN
PED_CYCLE_TARGET_LEFT=kbd:[,2ndKbd:PADEND
PED_CYCLE_TARGET_RIGHT=2ndKbd:],kbd:PADDOWN
PED_CENTER_CAMERA_BEHIND_PLAYER=kbd:#
PED_LOCK_TARGET=kbd:DEL,mouse:RIGHT,2ndKbd:PADRIGHT
NETWORK_TALK=kbd:T
PED_1RST_PERSON_LOOK_UP=kbd:PADPGUP
PED_1RST_PERSON_LOOK_DOWN=kbd:PADUP
_CONTROLLERACTION_36=
TOGGLE_DPAD=
SWITCH_DEBUG_CAM_ON=
TAKE_SCREEN_SHOT=
SHOW_MOUSE_POINTER_TOGGLE=
UNKNOWN_ACTION=

`;

const revc_ini = (() => {
    const cached = localStorage.getItem('vcsky.revc.ini');
    if (cached) {
        return cached;
    }
    return revc_iniDefault;
})();

if (configurableMode) {
    const configPanel = document.getElementById('config-panel');
    const configLang = document.getElementById('config-lang');
    const configCheats = document.getElementById('config-cheats');
    const configFullscreen = document.getElementById('config-fullscreen');
    const configMaxFps = document.getElementById('config-max-fps');

    if (configPanel && configCheats && configFullscreen && configMaxFps) {
        configPanel.style.display = 'block';
        if (configLang) configLang.value = currentLanguage;
        configCheats.checked = cheatsEnabled;
        configFullscreen.checked = autoFullScreen;
        configMaxFps.value = maxFPS;

        updateAllTranslations();

        if (configLang) {
            configLang.addEventListener('change', (e) => {
                currentLanguage = e.target.value;
                window.currentLanguage = currentLanguage;
                updateGameDataForLanguage(currentLanguage);
                updateAllTranslations();
            });
        }
        configCheats.addEventListener('change', (e) => {
            cheatsEnabled = e.target.checked;
        });
        configFullscreen.addEventListener('change', (e) => {
            autoFullScreen = e.target.checked;
        });
        configMaxFps.addEventListener('input', (e) => {
            maxFPS = parseInt(e.target.value) || 0;
        });
    }
}

if (params.get('autostart') === '1' || params.get('autostart') === 'true') {
    setTimeout(() => {
        if (haveOriginalGame) {
            startGame();
        }
    }, 50);
}
