// Translations
const translations = {
    en: {
        title: "Vice City by DOS Zone Team",
        enterKey: "Save Manager",
        cloudSaves: "Cloud saves:",
        enabled: "enabled",
        disabled: "disabled",
        fetching: "fetching...",
         clickToPlay: "Click to play",
        gameLang: "LANGUAGE:",
        cheats: "CHEATS (F3):",
        downloading: "DOWNLOADING...",
        StructuredCredits: "PROJECT CREDITS",
        originalEngine: "ORIGINAL ENGINE",
        revcTeam: "Reverse Engineered by the reVC Team",
        webPort: "WEB PORT",
        portedBy: "Ported by",
        developers: "DEVELOPERS",
        clickToContinue: "Click to continue...",
        loading: "Loading...",
        initEngine: "Initializing engine...",
        startingGame: "Starting game...",
        loadingSaves: "Loading saves...",
        loadingData: "Loading game data...",
        confirmOwnership: "Select any file from original game to confirm ownership",
        confirmOwnershipAlert: "Please select any file from original GTA Vice City game to confirm ownership",
        corruptedFileAlert: "Selected file does not match original game files, maybe corrupted or unsupported version",
        demoOffDisclaimer: "Since the project attracted massive attention from gaming media, there is a high risk of receiving a claim from Take-Two. Wait for further updates in our social networks.",
        controls: "CONTROLS",
        controlsTitle: "CONTROLS",
        tabOnFoot: "ON FOOT",
        tabVehicle: "VEHICLE",
        tabGeneral: "GENERAL",
        ctrlMove: "Move",
        ctrlSprint: "Sprint",
        ctrlJump: "Jump",
        ctrlCrouch: "Crouch",
        ctrlAttack: "Attack / Fire",
        ctrlAim: "Aim / Target",
        ctrlEnterVehicle: "Enter Vehicle",
        ctrlNextWeapon: "Next Weapon",
        ctrlPrevWeapon: "Prev Weapon",
        ctrlLookBehind: "Look Behind",
        ctrlZoomIn: "Sniper Zoom In",
        ctrlZoomOut: "Sniper Zoom Out",
        ctrlAccelerate: "Accelerate",
        ctrlBrake: "Brake / Reverse",
        ctrlSteer: "Steer",
        ctrlHandbrake: "Handbrake",
        ctrlExitVehicle: "Exit Vehicle",
        ctrlHorn: "Horn / Siren",
        ctrlRadio: "Change Radio",
        ctrlSubMission: "Sub-mission",
        ctrlLookLeft: "Look Left",
        ctrlLookRight: "Look Right",
        ctrlLookBack: "Look Back",
        ctrlTurret: "Turret / Dodo",
        ctrlCamera: "Change Camera",
        ctrlPause: "Pause Menu",
        ctrlRadar: "Radar Mode",
        mobileWarning: "WARNING: Mobile devices are not officially supported! The game may crash due to memory limits (especially on iOS). Play at your own risk.",
        manageSaves: "SAVE MANAGER",
        saveManagerTitle: "SAVE MANAGER",
        saveManagerDesc: "Export all your saves and settings into a single archive, or import a previously saved archive.",
        exportSaves: "EXPORT",
        importSaves: "IMPORT",
        exportSuccess: "Saves exported successfully!",
        importSuccess: "Saves imported successfully!",
        noSavesFound: "No saves found to export!",
        errorReadingFile: "Error reading archive!"
    },
    ru: {
        title: "Vice City от команды DOS Zone",
        enterKey: "Менеджер сохранений",
        cloudSaves: "Облачные сохранения:",
        enabled: "включены",
        disabled: "выключены",
        fetching: "загрузка...",
        clickToPlay: "Нажмите чтобы играть",
        gameLang: "ЯЗЫК:",
        cheats: "ЧИТЫ (F3):",
        downloading: "ЗАГРУЗКА...",
        StructuredCredits: "СОЗДАТЕЛИ ПРОЕКТА",
        originalEngine: "ОРИГИНАЛЬНЫЙ ДВИЖОК",
        revcTeam: "Реверс-инжиниринг: команда reVC",
        webPort: "ВЕБ-ПОРТ",
        portedBy: "Портировано",
        developers: "РАЗРАБОТЧИКИ",
        clickToContinue: "Нажмите для продолжения...",
        loading: "Загрузка...",
        initEngine: "Инициализация движка...",
        startingGame: "Запуск игры...",
        loadingSaves: "Загрузка сохранений...",
        loadingData: "Загрузка данных игры...",
        confirmOwnership: "Выберите любой файл из оригинальной игры для подтверждения владения",
        confirmOwnershipAlert: "Пожалуйста, выберите любой файл из оригинальной игры GTA Vice City для подтверждения владения",
        corruptedFileAlert: "Выбранный файл не соответствует оригинальным файлам игры, возможно поврежден или неподдерживаемая версия",
        demoOffDisclaimer: "Так как проект привлек огромное внимание игровых СМИ, существует высокий риск получения претензии от Take-Two. Следите за дальнейшими обновлениями в наших социальных сетях.",
        controls: "УПРАВЛЕНИЕ",
        controlsTitle: "УПРАВЛЕНИЕ",
        tabOnFoot: "ПЕШКОМ",
        tabVehicle: "ТРАНСПОРТ",
        tabGeneral: "ОБЩИЕ",
        ctrlMove: "Движение",
        ctrlSprint: "Бег",
        ctrlJump: "Прыжок",
        ctrlCrouch: "Присесть",
        ctrlAttack: "Атака / Огонь",
        ctrlAim: "Прицел",
        ctrlEnterVehicle: "Сесть в машину",
        ctrlNextWeapon: "След. оружие",
        ctrlPrevWeapon: "Пред. оружие",
        ctrlLookBehind: "Оглянуться",
        ctrlZoomIn: "Приблизить (снайп.)",
        ctrlZoomOut: "Отдалить (снайп.)",
        ctrlAccelerate: "Газ",
        ctrlBrake: "Тормоз / Назад",
        ctrlSteer: "Руль",
        ctrlHandbrake: "Ручник",
        ctrlExitVehicle: "Выйти из машины",
        ctrlHorn: "Сигнал / Сирена",
        ctrlRadio: "Сменить радио",
        ctrlSubMission: "Миссия (такси и т.д.)",
        ctrlLookLeft: "Смотреть влево",
        ctrlLookRight: "Смотреть вправо",
        ctrlLookBack: "Смотреть назад",
        ctrlTurret: "Башня / Додо",
        ctrlCamera: "Сменить камеру",
        ctrlPause: "Пауза",
        ctrlRadar: "Режим радара",
        mobileWarning: "ВНИМАНИЕ: Мобильные устройства официально не поддерживаются! Игра может вылетать из-за нехватки памяти (особенно на iOS). Играйте на свой страх и риск.",
        manageSaves: "МЕНЕДЖЕР СОХРАНЕНИЙ",
        saveManagerTitle: "МЕНЕДЖЕР СОХРАНЕНИЙ",
        saveManagerDesc: "Экспортируйте все ваши сохранения и настройки в один архив или импортируйте ранее сохраненный архив.",
        exportSaves: "ЭКСПОРТ",
        importSaves: "ИМПОРТ",
        exportSuccess: "Сохранения успешно экспортированы!",
        importSuccess: "Сохранения успешно импортированы!",
        noSavesFound: "Сохранения для экспорта не найдены!",
        errorReadingFile: "Ошибка чтения архива!"
    }
};

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

const params = new URLSearchParams(window.location.search);
let currentLang = params.get('lang') ?? ((navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en');
let currentLanguage = currentLang;
let gameLang = currentLang;
let maxFPS = Number(params.get('max_fps') || 0);

let resolvePreloadedPackage = null;
const preloadedPackagePromise = new Promise((resolve) => {
    resolvePreloadedPackage = resolve;
});

function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const isMobileDevice = isMobile || isTouch;

function setLanguage(lang) {
    currentLang = lang;
    currentLanguage = lang;
    gameLang = lang;
    localStorage.setItem('vcsky.lang', lang);

    const btnEn = document.getElementById('btn-en');
    const btnRu = document.getElementById('btn-ru');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');

    const gameLangSelect = document.getElementById('game-lang');
    if (gameLangSelect) gameLangSelect.value = lang;

    updateTranslations();
}

const demoOff = true;
const requestOriginalGame = params.get('request_original_game') === '1';
if (requestOriginalGame) {
    localStorage.removeItem('vcsky.haveOriginalGame');
} else {
    localStorage.setItem('vcsky.haveOriginalGame', 'true');
}
let haveOriginalGame = localStorage.getItem('vcsky.haveOriginalGame') === 'true';
window.__REVCDOS_STATUS__.haveOriginalGame = haveOriginalGame;

const cheatsEnabled = params.get('cheats') !== '0';

function ownerShipConfirmed() {
    haveOriginalGame = true;
    localStorage.setItem('vcsky.haveOriginalGame', 'true');
    window.__REVCDOS_STATUS__.haveOriginalGame = true;

    const clickToPlayButton = document.getElementById('click-to-play-button');
    if (clickToPlayButton) {
        clickToPlayButton.textContent = t('clickToPlay');
        clickToPlayButton.classList.remove('disabled');
    }
    const disclaimer = document.getElementById('demo-off-disclaimer');
    if (disclaimer) {
        disclaimer.textContent = '';
        disclaimer.style.display = 'none';
    }
}

function updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key === 'cloudSavesDisabled') {
            return;
        }
        el.textContent = t(key);
    });

    const followEl = document.getElementById('follow');
    if (followEl) {
        followEl.textContent = t('title');
    }
    if (typeof updateKeyStatus === 'function') {
        updateKeyStatus();
    }

    const disclaimer = document.getElementById('demo-off-disclaimer');
    const clickToPlayButton = document.getElementById('click-to-play-button');
    if (haveOriginalGame) {
        ownerShipConfirmed();
    } else if (clickToPlayButton && disclaimer) {
        if (demoOff) {
            clickToPlayButton.textContent = t('confirmOwnership');
            disclaimer.textContent = t('demoOffDisclaimer');
            disclaimer.style.display = 'block';
        } else {
            clickToPlayButton.classList.add('disabled');
            disclaimer.textContent = t('confirmOwnership');
            disclaimer.style.display = 'block';
        }
    }
}

function openControlsModal(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('controls-modal');
    if (modal) modal.classList.add('visible');
}

function closeControlsModal(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('controls-modal');
    if (modal) modal.classList.remove('visible');
}

function switchControlsTab(tab) {
    document.querySelectorAll('.controls-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.controls-section').forEach(sec => {
        sec.classList.remove('active');
    });
    if (typeof event !== 'undefined' && event && event.target) {
        event.target.classList.add('active');
    }
    const sec = document.getElementById('controls-' + tab);
    if (sec) sec.classList.add('active');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const controlsModal = document.getElementById('controls-modal');
        if (controlsModal && controlsModal.classList.contains('visible')) {
            closeControlsModal();
        }
        const saveModal = document.getElementById('save-modal');
        if (saveModal && saveModal.classList.contains('visible')) {
            closeSaveModal();
        }
    }
});

// Save Manager Functions
function openSaveModal(e) {
    if (e) e.stopPropagation();
    const statusEl = document.getElementById('save-manager-status');
    if (statusEl) statusEl.textContent = '';
    const modal = document.getElementById('save-modal');
    if (modal) modal.classList.add('visible');
}

function closeSaveModal(e) {
    if (e) e.stopPropagation();
    const modal = document.getElementById('save-modal');
    if (modal) modal.classList.remove('visible');
}

const SAVE_DB_NAME = "emscripten_filesystem";
const SAVE_STORE_NAME = "FILES";

function openSaveDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(SAVE_DB_NAME);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToUint8Array(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

async function exportSaves() {
    const statusEl = document.getElementById('save-manager-status');
    try {
        const db = await openSaveDB();
        if (!db.objectStoreNames.contains(SAVE_STORE_NAME)) {
            statusEl.style.color = '#ff0055';
            statusEl.textContent = t('noSavesFound');
            db.close();
            return;
        }
        const tx = db.transaction([SAVE_STORE_NAME], "readonly");
        const store = tx.objectStore(SAVE_STORE_NAME);

        const keysReq = store.getAllKeys();
        const valsReq = store.getAll();

        keysReq.onsuccess = () => {
            valsReq.onsuccess = () => {
                const keys = keysReq.result;
                const vals = valsReq.result;

                const exportData = {};
                let count = 0;
                for (let i = 0; i < keys.length; i++) {
                    const k = keys[i];
                    if (typeof k === 'string' && k.startsWith('/vc-assets/local/userfiles/')) {
                        const fileData = vals[i];
                        if (fileData instanceof Uint8Array || fileData instanceof ArrayBuffer) {
                            exportData[k] = arrayBufferToBase64(fileData);
                            count++;
                        } else if (fileData && fileData.contents) {
                            exportData[k] = arrayBufferToBase64(fileData.contents);
                            count++;
                        }
                    }
                }

                db.close();

                if (count === 0) {
                    statusEl.style.color = '#ff0055';
                    statusEl.textContent = t('noSavesFound');
                    return;
                }

                const jsonStr = JSON.stringify(exportData);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                const date = new Date().toISOString().slice(0, 10);
                a.download = `vc_saves_${date}.save`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                statusEl.style.color = '#00ff66';
                statusEl.textContent = t('exportSuccess');
            };
        };
    } catch (err) {
        console.error(err);
        statusEl.style.color = '#ff0055';
        statusEl.textContent = t('noSavesFound');
    }
}

async function importSaves(event) {
    const file = event.target.files[0];
    if (!file) return;
    const statusEl = document.getElementById('save-manager-status');

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const db = await openSaveDB();

            const tx = db.transaction([SAVE_STORE_NAME], "readwrite");
            const store = tx.objectStore(SAVE_STORE_NAME);

            for (const key of Object.keys(data)) {
                if (key.startsWith('/vc-assets/local/userfiles/')) {
                    const bytes = base64ToUint8Array(data[key]);
                    store.put(bytes, key);
                }
            }

            tx.oncomplete = () => {
                db.close();
                statusEl.style.color = '#00ff66';
                statusEl.textContent = t('importSuccess');
                event.target.value = '';
            };

            tx.onerror = () => {
                db.close();
                statusEl.style.color = '#ff0055';
                statusEl.textContent = t('errorReadingFile');
            };
        } catch (err) {
            console.error(err);
            statusEl.style.color = '#ff0055';
            statusEl.textContent = t('errorReadingFile');
        }
    };
    reader.readAsText(file);
}

const replaceBR = "vcbr/";
const EXPECTED_EN_DATA_SIZE = 135355111;
const EXPECTED_EN_WASM_SIZE = 7625877;
const dataSize = EXPECTED_EN_DATA_SIZE;
const PACK_CACHE_NAME = "revcdos-pack-v1";
const PACK_CACHE_KEY = "vcbr/vc-sky-en-v6.data";

let streamingBasePrefix = "";

function replaceFetch(url) {
    let normalized = String(url || "");
    if (normalized.startsWith("https://") || normalized.startsWith("http://")) {
        try {
            const parsed = new URL(normalized);
            normalized = parsed.pathname.replace(/^\/+/, "");
        } catch (_) {
            normalized = normalized.replace(/^https?:\/\/[^/]+\/+/, "");
        }
    }
    if (normalized.startsWith("/")) {
        normalized = normalized.replace(/^\/+/, "");
    }
    const vcskyIdx = normalized.toLowerCase().indexOf("vcsky/");
    if (vcskyIdx !== -1) {
        const relAfterVcsky = normalized.slice(vcskyIdx + "vcsky/".length).toLowerCase();
        return (streamingBasePrefix ? streamingBasePrefix + "vcsky/" : "vcsky/") + relAfterVcsky;
    }
    return normalized.toLowerCase();
}
window.replaceFetch = replaceFetch;

// Key handling with localStorage
const KEY_STORAGE_KEY = 'vcsky.key';
const keyInput = document.getElementById('key-input');
const keyStatus = document.getElementById('key-status');
const cloudSavesStatus = document.getElementById('cloud-saves-status');
let currentKey = localStorage.getItem(KEY_STORAGE_KEY) ?? '';
let resolvedKey = null;
let keyValidationTimeout = null;

function updateKeyStatus() {
    if (!keyStatus || !cloudSavesStatus) return;
    keyStatus.classList.remove('valid', 'invalid');
    if (resolvedKey !== null && currentKey.length === 5) {
        if (resolvedKey) {
            keyStatus.classList.add('valid');
            cloudSavesStatus.textContent = t('cloudSaves') + ' ' + t('enabled');
            cloudSavesStatus.style.color = '#28a745';
        } else {
            keyStatus.classList.add('invalid');
            cloudSavesStatus.textContent = t('cloudSaves') + ' ' + t('disabled');
            cloudSavesStatus.style.color = '#aaa';
        }
    } else if (currentKey.length > 0 && currentKey.length < 5) {
        keyStatus.classList.add('invalid');
        cloudSavesStatus.textContent = t('cloudSaves') + ' ' + t('disabled');
        cloudSavesStatus.style.color = '#aaa';
    } else {
        cloudSavesStatus.textContent = t('cloudSaves') + ' ' + t('disabled');
        cloudSavesStatus.style.color = '#aaa';
    }
}

async function validateKey(key) {
    if (key.length !== 5) {
        resolvedKey = null;
        updateKeyStatus();
        return;
    }

    if (cloudSavesStatus) {
        cloudSavesStatus.textContent = t('cloudSaves') + ' ' + t('fetching');
        cloudSavesStatus.style.color = '#aaa';
    }
    const result = await CloudSDK.resolveToken(key);
    if (currentKey === key) {
        resolvedKey = result?.ey ?? false;
        updateKeyStatus();
    }
}

if (keyInput) {
    keyInput.value = currentKey;
    if (currentKey.length === 5) {
        validateKey(currentKey);
    } else {
        updateKeyStatus();
    }

    keyInput.addEventListener('input', (e) => {
        currentKey = e.target.value;
        resolvedKey = null;
        localStorage.setItem(KEY_STORAGE_KEY, currentKey);

        if (keyValidationTimeout) {
            clearTimeout(keyValidationTimeout);
        }

        if (currentKey.length === 5) {
            keyValidationTimeout = setTimeout(() => {
                validateKey(currentKey);
            }, 300);
        } else {
            updateKeyStatus();
        }
    });

    keyInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

const followLink = document.getElementById('follow');
if (followLink) {
    followLink.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

let autoContinueTimer = null;

function startGame(e) {
    if (e) e.stopPropagation();

    const clickToPlay = document.querySelector('.click-to-play');
    const clickToPlayButton = document.getElementById('click-to-play-button');
    const keyContainer = document.querySelector('.key-container');
    const configPanel = document.getElementById('config-panel');
    const btnControls = document.querySelectorAll('.btn-controls');

    if (keyContainer) {
        keyContainer.style.display = 'none';
    }
    if (configPanel) {
        configPanel.style.display = 'none';
    }
    btnControls.forEach(b => { b.style.display = 'none'; });

    let gameStarted = false;
    const startGameNow = () => {
        if (gameStarted) return;
        gameStarted = true;
        if (autoContinueTimer) {
            clearTimeout(autoContinueTimer);
            autoContinueTimer = null;
        }
        window.removeEventListener('click', startGameNow);
        const video = document.querySelector('.intro');
        if (video) {
            try { video.pause(); } catch (_) {}
            video.style.display = 'none';
        }
        if (clickToPlayButton) clickToPlayButton.style.display = 'none';
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) progressContainer.style.display = 'flex';
        loadData();
    };

    if (clickToPlayButton) {
        clickToPlayButton.textContent = t('clickToContinue');
    }
    const creditsEl = document.querySelector('.credits');
    if (creditsEl) creditsEl.style.display = 'none';
    const coverEl = document.querySelector('.cover');
    if (coverEl) coverEl.style.display = 'none';

    const video = document.querySelector('.intro');
    if (video) {
        try {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        } catch (_) {}
    }

    if (clickToPlay) {
        clickToPlay.style.justifyContent = 'end';
    }
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
        buttonContainer.style.background = 'none';
        buttonContainer.style.border = 'none';
        buttonContainer.style.boxShadow = 'none';
    }
    const mobileWarning = document.querySelector('.mobile-warning');
    if (mobileWarning) {
        mobileWarning.style.display = 'none';
    }

    setTimeout(() => {
        window.addEventListener('click', startGameNow);
    }, 100);

    // Bounded auto-continuation so clicking "Click to play" (or ?autostart=1) enters gameplay deterministically
    autoContinueTimer = setTimeout(() => {
        startGameNow();
    }, 1200);
}

const clickToPlayBtn = document.getElementById('click-to-play-button');
if (clickToPlayBtn) {
    clickToPlayBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (haveOriginalGame) {
            startGame(e);
        } else if (demoOff) {
            let sha256sums = localStorage.getItem('vcsky.sha256sums');
            if (!sha256sums) {
                const response = await fetch(replaceFetch('vcsky/sha256sums.txt'));
                sha256sums = await response.text();
                localStorage.setItem('vcsky.sha256sums', sha256sums);
            }
            const fileInput = document.getElementById('original-game-file');
            fileInput.onchange = (evt) => {
                const file = evt.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async function (event) {
                        const arrayBuffer = event.target.result;
                        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
                        const hashArray = Array.from(new Uint8Array(hashBuffer));
                        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
                        if (sha256sums.indexOf(hashHex) !== -1) {
                            ownerShipConfirmed();
                            startGame(e);
                        } else {
                            alert(t('corruptedFileAlert'));
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    alert(t('confirmOwnershipAlert'));
                }
            };
            fileInput.click();
        }
    });
}

var statusElement = document.getElementById('status');
var progressElement = document.getElementById('progress');
var spinnerElement = document.getElementById('spinner');
var outputElement = document.getElementById('output');

function setProgress(pct, labelKeyOrText) {
    const progressFill = document.getElementById('progress-bar-fill');
    const progressText = document.getElementById('progress-text');
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    if (progressFill) {
        progressFill.style.width = `${clamped}%`;
    }
    if (progressText) {
        const translated = translations[currentLang]?.[labelKeyOrText] || labelKeyOrText;
        progressText.textContent = `${translated} ${clamped}%`;
    }
}

async function fetchStreamWithProgress(url, totalExpectedBytes, initialBytesOffset = 0) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    if (!response.body || typeof response.body.getReader !== 'function') {
        const buf = await response.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (totalExpectedBytes > 0) {
            setProgress(((initialBytesOffset + bytes.byteLength) / totalExpectedBytes) * 100, 'loadingData');
        }
        return bytes;
    }

    const reader = response.body.getReader();
    const chunks = [];
    let receivedLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        if (totalExpectedBytes > 0) {
            const pct = Math.min(99, Math.round(((initialBytesOffset + receivedLength) / totalExpectedBytes) * 100));
            setProgress(pct, 'loadingData');
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

async function fetchPartsFromManifest(basePrefix = "") {
    let partPaths = [
        "parts/vc-sky-en-v6.data.part00",
        "parts/vc-sky-en-v6.data.part01",
        "parts/vc-sky-en-v6.data.part02",
        "parts/vc-sky-en-v6.data.part03",
    ];
    let expectedTotal = EXPECTED_EN_DATA_SIZE;

    try {
        const manifestResp = await fetch(`${basePrefix}pack.json`, { cache: "no-store" });
        if (manifestResp.ok) {
            const manifest = await manifestResp.json();
            if (manifest?.data?.totalBytes) {
                expectedTotal = manifest.data.totalBytes;
            }
            if (Array.isArray(manifest?.data?.parts) && manifest.data.parts.length > 0) {
                partPaths = manifest.data.parts
                    .slice()
                    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                    .map(p => p.path);
            }
        }
    } catch (_) {
        // Proceed with deterministic 4-part list
    }

    const combined = new Uint8Array(expectedTotal);
    let offset = 0;

    for (const partPath of partPaths) {
        const partBytes = await fetchStreamWithProgress(`${basePrefix}${partPath}`, expectedTotal, offset);
        if (offset + partBytes.byteLength > combined.byteLength) {
            throw new Error(`Part overflow assembling ${partPath}: ${offset + partBytes.byteLength} > ${combined.byteLength}`);
        }
        combined.set(partBytes, offset);
        offset += partBytes.byteLength;
    }

    if (offset !== expectedTotal) {
        throw new Error(`Incomplete part assembly: got ${offset} bytes, expected ${expectedTotal}`);
    }
    return combined;
}

async function resolveTunnelBaseUrl() {
    try {
        const resp = await fetch("../tunnel.json", { cache: "no-store" });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && typeof data.url === "string" && data.url.trim().length > 0) {
            return data.url.trim().replace(/\/+$/, "") + "/revcdos/";
        }
    } catch (_) {}
    return null;
}

async function loadData() {
    const progressText = document.getElementById('progress-text');
    const progressFill = document.getElementById('progress-bar-fill');
    if (progressText) progressText.textContent = t('loadingData');
    if (progressFill) progressFill.style.width = '0%';

    const forceParts = params.get('useparts') === '1';
    const disableCache = params.get('nocache') === '1';

    let dataBuffer = null;

    // 1. Check CacheStorage ('revcdos-pack-v1')
    if (!disableCache && !forceParts && typeof caches !== 'undefined') {
        try {
            const cache = await caches.open(PACK_CACHE_NAME);
            const cachedResp = await cache.match(PACK_CACHE_KEY);
            if (cachedResp) {
                const buf = await cachedResp.arrayBuffer();
                if (buf.byteLength === EXPECTED_EN_DATA_SIZE) {
                    dataBuffer = new Uint8Array(buf);
                    window.__REVCDOS_STATUS__.cacheHit = true;
                    window.__REVCDOS_STATUS__.dataLoadedBytes = dataBuffer.byteLength;
                    setProgress(100, 'loadingData');
                } else {
                    await cache.delete(PACK_CACHE_KEY);
                }
            }
        } catch (cacheErr) {
            console.warn('[reVCDOS] CacheStorage read skipped:', cacheErr);
        }
    }

    // 2. Direct fetch from vcbr/vc-sky-en-v6.data (unless ?useparts=1)
    if (!dataBuffer && !forceParts) {
        try {
            const dataUrl = `${replaceBR}vc-sky-${gameLang}-v6.data`;
            const fetched = await fetchStreamWithProgress(dataUrl, dataSize, 0);
            if (gameLang === 'en' && fetched.byteLength !== EXPECTED_EN_DATA_SIZE) {
                throw new Error(`Unexpected vc-sky-en-v6.data size: ${fetched.byteLength} (expected ${EXPECTED_EN_DATA_SIZE})`);
            }
            dataBuffer = fetched;
        } catch (directErr) {
            console.warn('[reVCDOS] Direct vcbr/ fetch failed, falling back to 4-part assembly:', directErr);
        }
    }

    // 3. Fallback (or ?useparts=1): 4-part chunk assembly from ./parts/vc-sky-en-v6.data.part00..03
    if (!dataBuffer) {
        try {
            dataBuffer = await fetchPartsFromManifest("");
        } catch (partsErr) {
            console.warn('[reVCDOS] Local 4-part assembly failed, probing ../tunnel.json failover:', partsErr);
        }
    }

    // 4. Failover via ../tunnel.json
    if (!dataBuffer) {
        const tunnelBase = await resolveTunnelBaseUrl();
        if (tunnelBase) {
            streamingBasePrefix = tunnelBase;
            try {
                const fetched = await fetchStreamWithProgress(`${tunnelBase}vcbr/vc-sky-${gameLang}-v6.data`, dataSize, 0);
                if (gameLang === 'en' && fetched.byteLength !== EXPECTED_EN_DATA_SIZE) {
                    throw new Error(`Unexpected tunnel data size: ${fetched.byteLength}`);
                }
                dataBuffer = fetched;
            } catch (tunnelErr) {
                window.__REVCDOS_STATUS__.lastError = String(tunnelErr?.message || tunnelErr);
                throw tunnelErr;
            }
        } else {
            const err = new Error("Failed to load vc-sky-en-v6.data from vcbr/, parts/, or tunnel.json");
            window.__REVCDOS_STATUS__.lastError = err.message;
            throw err;
        }
    }

    // Also probe whether local vcsky/sha256sums.txt is reachable; if not, point streamingBasePrefix at tunnelBase
    if (!streamingBasePrefix) {
        try {
            const probe = await fetch("vcsky/sha256sums.txt", { method: "HEAD" });
            if (!probe.ok) {
                const tunnelBase = await resolveTunnelBaseUrl();
                if (tunnelBase) streamingBasePrefix = tunnelBase;
            }
        } catch (_) {
            const tunnelBase = await resolveTunnelBaseUrl();
            if (tunnelBase) streamingBasePrefix = tunnelBase;
        }
    }

    window.__REVCDOS_STATUS__.dataLoadedBytes = dataBuffer.byteLength;
    setProgress(100, 'loadingData');

    // Store in CacheStorage ('revcdos-pack-v1') for instant warm starts
    if (!disableCache && typeof caches !== 'undefined' && dataBuffer.byteLength === EXPECTED_EN_DATA_SIZE) {
        try {
            const cache = await caches.open(PACK_CACHE_NAME);
            const respToCache = new Response(dataBuffer.slice(0), {
                status: 200,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': String(dataBuffer.byteLength)
                }
            });
            await cache.put(PACK_CACHE_KEY, respToCache);
        } catch (cacheWriteErr) {
            console.warn('[reVCDOS] CacheStorage write skipped:', cacheWriteErr);
        }
    }

    loadGame(dataBuffer);
}

const REVC_INI_DEFAULT = `
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
Method=${isMobileDevice ? '1' : '0'}
InvertPad=0
JoystickName=0
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
DrawDistance=1.200000
Subtitles=0
ShowHud=1
RadarMode=0
ShowLegends=0
PedDensity=0.600000
CarDensity=0.600000
CutsceneBorders=1
FreeCam=0
[Graphics]
AspectRatio=0
VSync=1
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
NewRenderer=0
[Draw]
ProperScaling=1
FixRadar=1
FixSprites=1
[Bindings]
PED_FIREWEAPON=kbd:PADINS,kbd:LCTRL,mouse:LEFT
PED_CYCLE_WEAPON_RIGHT=kbd:PADDEL,mouse:WHLDOWN,kbd:E
PED_CYCLE_WEAPON_LEFT=kbd:PADEND,mouse:WHLUP,kbd:Q
GO_FORWARD=kbd:UP,kbd:W
GO_BACK=kbd:DOWN,kbd:S
GO_LEFT=kbd:LEFT,kbd:A
GO_RIGHT=kbd:RIGHT,kbd:D
PED_SNIPER_ZOOM_IN=kbd:PGUP,kbd:Z,mouse:WHLUP
PED_SNIPER_ZOOM_OUT=kbd:PGDN,kbd:X,mouse:WHLDOWN
VEHICLE_ENTER_EXIT=kbd:ENTER,kbd:F
CAMERA_CHANGE_VIEW_ALL_SITUATIONS=kbd:HOME,kbd:V
PED_JUMPING=kbd:RCTRL,kbd:SPC
PED_SPRINT=kbd:RSHIFT,kbd:LSHIFT
PED_LOOKBEHIND=kbd:PADEND,kbd:CAPSLK,mouse:MIDDLE
PED_DUCK=kbd:C
PED_ANSWER_PHONE=kbd:TAB
VEHICLE_FIREWEAPON=kbd:PADINS,kbd:LCTRL,mouse:LEFT
VEHICLE_ACCELERATE=kbd:W,kbd:UP
VEHICLE_BRAKE=kbd:S,kbd:DOWN
VEHICLE_CHANGE_RADIO_STATION=kbd:INS,kbd:R,mouse:WHLUP
VEHICLE_HORN=kbd:LSHIFT,kbd:CAPSLK
TOGGLE_SUBMISSIONS=kbd:PLUS,kbd:CAPSLK
VEHICLE_HANDBRAKE=kbd:SPC,kbd:RCTRL
PED_1RST_PERSON_LOOK_LEFT=kbd:PADLEFT
PED_1RST_PERSON_LOOK_RIGHT=kbd:PADRIGHT
VEHICLE_LOOKLEFT=kbd:PADEND,kbd:Q
VEHICLE_LOOKRIGHT=kbd:PADDEL,kbd:E
VEHICLE_LOOKBEHIND=mouse:MIDDLE
VEHICLE_TURRETLEFT=kbd:PADLEFT
VEHICLE_TURRETRIGHT=kbd:PAD5
VEHICLE_TURRETUP=kbd:PADPGUP,kbd:UP
VEHICLE_TURRETDOWN=kbd:PADRIGHT,kbd:DOWN
PED_CYCLE_TARGET_LEFT=kbd:[,kbd:Z
PED_CYCLE_TARGET_RIGHT=kbd:],kbd:X
PED_CENTER_CAMERA_BEHIND_PLAYER=kbd:#
PED_LOCK_TARGET=kbd:DEL,mouse:RIGHT
NETWORK_TALK=kbd:T
PED_1RST_PERSON_LOOK_UP=kbd:PADUP
PED_1RST_PERSON_LOOK_DOWN=kbd:PAD5
_CONTROLLERACTION_36=
TOGGLE_DPAD=
SWITCH_DEBUG_CAM_ON=
TAKE_SCREEN_SHOT=
SHOW_MOUSE_POINTER_TOGGLE=
UNKNOWN_ACTION=

`;

async function loadGame(data) {
    const progressText = document.getElementById('progress-text');
    if (progressText) progressText.textContent = t('loadingSaves');
    const savesMountPoint = "/vc-assets/local/userfiles";
    try { Module.FS.mkdir('/vc-assets'); } catch (_) {}
    try { Module.FS.mkdir('/vc-assets/local'); } catch (_) {}
    try { Module.FS.mkdir(savesMountPoint); } catch (_) {}
    try { Module.FS.mount(Module.IDBFS, {}, savesMountPoint); } catch (_) {}
    await new Promise(resolve => {
        Module.FS.syncfs(true, function (err) {
            if (err) {
                console.error('Error syncing IDBFS:', err);
            }
            resolve();
        });
    });

    if (resolvedKey && currentKey) {
        try {
            const cloudData = await CloudSDK.pullFromStorage(currentKey);
            if (cloudData) {
                const zip = new Int8Array(cloudData);
                const zipPath = savesMountPoint + "/cloud_saves.zip";
                Module.FS.writeFile(zipPath, zip);
                await Module.extractZip(zipPath, savesMountPoint);
                Module.FS.unlink(zipPath);
            }
        } catch (err) {
            console.error('Error pulling cloud saves:', err);
        }
    }

    const revcIniPath = savesMountPoint + "/revc.ini";
    try {
        const stat = Module.FS.stat(revcIniPath);
        if (!stat || stat.size < 100) {
            Module.FS.writeFile(revcIniPath, REVC_INI_DEFAULT);
        }
    } catch (e) {
        Module.FS.writeFile(revcIniPath, REVC_INI_DEFAULT);
    }
    await new Promise(resolve => {
        Module.FS.syncfs(false, function () {
            resolve();
        });
    });

    let revcIniSyncing = false;
    Module.syncRevcIni = async () => {
        if (revcIniSyncing) {
            return;
        }
        revcIniSyncing = true;
        try {
            await new Promise((resolve) => {
                Module.FS.syncfs(false, function (err) {
                    if (err) {
                        console.error('Error syncing revc.ini to IDBFS:', err);
                    }
                    resolve();
                });
            });

            if (resolvedKey && currentKey) {
                try {
                    const zipPath = savesMountPoint + "/cloud_saves.zip";
                    await Module.archiveZip(savesMountPoint, zipPath);
                    const zipData = Module.FS.readFile(zipPath);
                    Module.FS.unlink(zipPath);
                    await CloudSDK.pushToStorage(resolvedKey, zipData);
                } catch (err) {
                    console.error('Error pushing cloud saves:', err);
                }
            }
        } catch (e) {
            console.error('Exception during syncing revc.ini to IDBFS:', e);
        } finally {
            revcIniSyncing = false;
        }
    };

    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.style.display = 'none';
    const clickToPlay = document.querySelector('.click-to-play');
    if (clickToPlay) clickToPlay.style.display = 'none';

    if (progressText) progressText.textContent = t('initEngine');
    const pkgArrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    if (typeof resolvePreloadedPackage === 'function') {
        resolvePreloadedPackage(pkgArrayBuffer);
    }
    Module.removeRunDependency('vc-sky-' + gameLang + '-v6.data');
    if (progressText) progressText.textContent = t('startingGame');
}

// Wrap canvas.getContext so WebGL2/WebGL contexts always preserve their drawing buffer for inspection & telemetry
const mainCanvas = document.getElementById('canvas');
if (mainCanvas && !mainCanvas.__revcdosContextWrapped) {
    const origGetContext = mainCanvas.getContext.bind(mainCanvas);
    mainCanvas.getContext = function (type, attributes) {
        if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
            attributes = Object.assign({}, attributes || {}, {
                preserveDrawingBuffer: true
            });
        }
        return origGetContext(type, attributes);
    };
    if (typeof mainCanvas.requestPointerLock === 'function') {
        const origRequestPointerLock = mainCanvas.requestPointerLock.bind(mainCanvas);
        mainCanvas.requestPointerLock = function (...args) {
            try {
                const res = origRequestPointerLock(...args);
                if (res && typeof res.catch === 'function') {
                    res.catch(() => {});
                }
                return res;
            } catch (_) {}
        };
    }
    mainCanvas.__revcdosContextWrapped = true;
}

// Non-blocking save sync on pagehide (replaces blocking window.onbeforeunload prompt)
window.addEventListener('pagehide', () => {
    try {
        Module.syncRevcIni?.();
    } catch (_) {}
});

// Resume Web Audio contexts on any user interaction
function unlockWebAudio() {
    try {
        const ctx = window.Module?.SDL2?.audioContext || window.Module?.audioContext;
        if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
            ctx.resume().catch(() => {});
        }
    } catch (_) {}
}
window.addEventListener('pointerdown', unlockWebAudio, { passive: true });
window.addEventListener('keydown', unlockWebAudio, { passive: true });
window.addEventListener('click', unlockWebAudio, { passive: true });

var Module = {
    autostart: function () {
        console.log('autostart called');
    },
    loggedOut: async function () {
        const wastedContainer = document.querySelector('.wasted-container');
        if (wastedContainer) {
            wastedContainer.removeAttribute('hidden');
        }
        console.log('Logged out');
    },
    preRun: [
        () => {
            Module.addRunDependency('vc-sky-' + gameLang + '-v6.data');
        },
    ],
    postRun: [],
    getPreloadedPackage: function () {
        return preloadedPackagePromise;
    },
    mainCalled: function () {
        console.log('mainCalled');
        window.__REVCDOS_STATUS__.mainCalled = true;
        try {
            const clickToPlay = document.querySelector('.click-to-play');
            if (clickToPlay) clickToPlay.style.display = 'none';
            const cover = document.querySelector('.cover');
            if (cover) cover.style.display = 'none';
            const intro = document.querySelector('.intro');
            if (intro) {
                try { intro.pause(); } catch (_) {}
                intro.style.display = 'none';
            }
            if (spinnerElement) spinnerElement.style.display = 'none';
            if (statusElement) statusElement.style.display = 'none';
            if (progressElement) progressElement.style.display = 'none';
        } catch (_) {}
    },
    syncRevcIni: () => { },
    print: (function () {
        if (outputElement) outputElement.value = '';
        return function (text) {
            if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
            console.log(text);
            if (outputElement) {
                outputElement.value += text + "\n";
                outputElement.scrollTop = outputElement.scrollHeight;
            }
        };
    })(),
    printErr: function (text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        if (typeof text === 'string' && text.includes('alGetProcAddress() called without a valid context')) {
            return;
        }
        console.error(text);
    },
    canvas: (function () {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", function (e) {
            window.__REVCDOS_STATUS__.lastError = "WebGL context lost";
            console.error('WebGL context lost. You will need to reload the page.');
            e.preventDefault();
        }, false);
        return canvas;
    })(),
    setStatus: function (text) {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.last.text) return;
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var now = Date.now();
        if (m && now - Module.setStatus.last.time < 30) return;
        Module.setStatus.last.time = now;
        Module.setStatus.last.text = text;
        if (m) {
            text = m[1];
            progressElement.value = parseInt(m[2]) * 100;
            progressElement.max = parseInt(m[4]) * 100;
            progressElement.hidden = false;
            spinnerElement.hidden = false;
        } else {
            progressElement.value = null;
            progressElement.max = null;
            progressElement.hidden = true;
            if (!text) spinnerElement.style.display = 'none';
        }
        statusElement.innerHTML = text;
    },
    totalDependencies: 0,
    monitorRunDependencies: function (left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    },
    instantiateWasm: function (imports, receiveInstance) {
        const wasmUrl = `${replaceBR}vc-sky-${gameLang}-v6.wasm`;
        fetch(wasmUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} loading ${wasmUrl}`);
                }
                return response.arrayBuffer();
            })
            .then(bytes => WebAssembly.instantiate(bytes, imports))
            .then(output => {
                window.__REVCDOS_STATUS__.wasmReady = true;
                receiveInstance(output.instance);
            })
            .catch(err => {
                window.__REVCDOS_STATUS__.lastError = String(err?.message || err);
                console.error('[reVCDOS] WASM instantiation error:', err);
            });
        return {};
    },
};

Module.arguments = [];
params.forEach((value, key) => {
    if (key === 'lang' || key === 'autostart' || key === 'useparts' || key === 'nocache' || key === 'request_original_game') return;
    Module.arguments.push(key);
    if (value) {
        Module.arguments.push(value);
    }
});

// Initialize language on page load
const savedLang = localStorage.getItem('vcsky.lang');
if (savedLang && (savedLang === 'en' || savedLang === 'ru')) {
    currentLang = savedLang;
    gameLang = savedLang;
}
setLanguage(currentLang);
if (haveOriginalGame) {
    ownerShipConfirmed();
}

// Configure Settings Panel Controls
const gameLangSelect = document.getElementById('game-lang');
const cheatsToggle = document.getElementById('cheats-toggle');

if (gameLangSelect) {
    gameLangSelect.value = gameLang;
    gameLangSelect.addEventListener('change', (e) => {
        setLanguage(e.target.value);
    });
    gameLangSelect.addEventListener('click', (e) => e.stopPropagation());
}

if (cheatsToggle) {
    cheatsToggle.checked = cheatsEnabled;
    if (cheatsEnabled && !Module.arguments.includes('cheats')) {
        Module.arguments.push('cheats');
        Module.arguments.push('1');
    }
    cheatsToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            if (!Module.arguments.includes('cheats')) {
                Module.arguments.push('cheats');
                Module.arguments.push('1');
            }
        } else {
            const index = Module.arguments.indexOf('cheats');
            if (index !== -1) {
                Module.arguments.splice(index, 2);
            }
        }
    });
    cheatsToggle.parentElement.addEventListener('click', (e) => e.stopPropagation());
}

Module.setStatus('Downloading...');
window.onerror = function (event, source, lineno, colno, error) {
    window.__REVCDOS_STATUS__.lastError = error?.stack || String(event);
    console.error('[reVCDOS window.onerror]', event, error?.errno, error?.stack);
    Module.setStatus('Exception thrown, see JavaScript console');
    spinnerElement.style.display = 'none';
    Module.setStatus = function (text) {
        if (text) Module.printErr('[post-exception status] ' + text);
    };
};

if (params.get('autostart') === '1') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            startGame();
        }, 100);
    });
}
