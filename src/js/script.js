feather.replace();

const cover = document.getElementById("cover");

const title = document.getElementById("title");
const description = document.getElementById("description");

const current = document.getElementById("current");
const total = document.getElementById("total");

const audio = new Audio();

// UI
async function getCurrent() {
    const current = await (await fetch("https://gensokyoradio.net/api/station/playing/")).json();

    return current;
}

let time = {
    current: 0,
    total: 0
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function truncateText(string, length) {
    return string.length > length ? `${string.substring(0, length)}...` : string;
}

let currentSong = undefined;
let isPaused = false;

async function setSong() {
    const song = await getCurrent();

    currentSong = song;

    const quality = await window.electron.database.get("image") || "200";

    cover.src = song.MISC.ALBUMART ? `https://gensokyoradio.net/images/albums/${quality}/${song.MISC.ALBUMART}` : "./img/undefined.png";
    title.innerText = truncateText(song.SONGINFO.TITLE, 45);
    description.innerText = `${song.SONGTIMES.DURATION}sec. (${song.SONGINFO.ARTIST})`;

    time.current = song.SONGTIMES.SONGSTART * 1000;
    time.total = song.SONGTIMES.SONGEND * 1000;

    current.innerText = formatTime(Date.now() - time.current);
    total.innerText = formatTime(time.total - time.current);

    window.electron.window.title(`Re:LP: ${song.SONGINFO.TITLE} - ${song.SONGTIMES.DURATION}sec.`);

    if (isPaused) window.electron.activity.clear();
    else window.electron.activity.set(song);

    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.SONGINFO.TITLE,
        artist: song.SONGINFO.ARTIST,
        album: song.SONGINFO.ALBUM,
        artwork: [{ src: cover.src, sizes: `${quality}x${quality}`, type: "image/jpg" }]
    });

    const sample = {
        info: {
            id: song.SONGDATA.ALBUMID,
            title: song.SONGINFO.TITLE,
            artist: song.SONGINFO.ARTIST,
            album: song.SONGINFO.ALBUM,
            cover: song.MISC.ALBUMART,
            year: song.SONGINFO.YEAR
        },
        time: {
            duration: song.SONGTIMES.DURATION,
            start: song.SONGTIMES.SONGSTART * 1000,
            end: song.SONGTIMES.SONGEND * 1000
        }
    }

    const maximum = await window.electron.database.get("maximum") || "1";
    if (maximum === "0") return;

    if (await window.electron.database.find("history", JSON.stringify(sample))) return;
    window.electron.database.push("history", JSON.stringify(sample));

    if (maximum >= 1 && maximum <= 4) {
        const amount = {
            "1": 50,
            "2": 100,
            "3": 150,
            "4": 200,
        };

        const history = await window.electron.database.get("history");
        const number = amount[maximum];

        if (history.length > number) window.electron.database.slice("history", -number);
    }

    window.electron.window.message.send({
        title: "Song History",
        message: "refresh"
    });
}

setSong();

setInterval(async () => {
    const elapsed = Date.now() - time.current;

    current.innerText = formatTime(elapsed);

    window.electron.window.progress(Math.min(elapsed / (time.total - time.current), 1));

    if (Date.now() >= time.total) await setSong();
}, 1000);

// Volume
async function getVolume() {
    return await window.electron.database.get("volume") || .5;
}

const volume = document.getElementById("volume");

volume.value = 0;

volume.addEventListener("input", () => audio.volume = volume.value);
volume.addEventListener("change", () => window.electron.database.set("volume", volume.value));

document.getElementById("button-volume").addEventListener("click", () => {
    if (volume.style.display === "none") volume.style.display = "block";
    else volume.style.display = "none";
});

// Stop
const stopButton = document.getElementById("button-stop");

stopButton.addEventListener("click", async() => {
    if (isPaused) {
        stopButton.innerHTML = `<i data-feather="x-square"></i>`;

        audio.volume = await getVolume();

        isPaused = false;

        currentSong ? window.electron.activity.set(currentSong) : null;
    } else {
        stopButton.innerHTML = `<i data-feather="check-square"></i>`;

        audio.volume = 0;

        isPaused = true;

        window.electron.activity.clear();
    }

    feather.replace();
});

// Audio
async function runAudio() {
    const level = await getVolume();

    const quality = await window.electron.database.get("audio") || "1";

    audio.src = `https://stream.gensokyoradio.net/${quality}/`;

    audio.play();

    audio.volume = level;

    volume.value = level;
}

runAudio();

// Windows
document.getElementById("button-settings").addEventListener("click", () => {
    window.electron.window.open({
        file: "web/settings/index.html",
        title: "Settings",
        width: 600,
        height: 520,
    });
});

document.getElementById("button-history").addEventListener("click", () => {
    window.electron.window.open({
        file: "web/history/index.html",
        title: "Song History",
        width: 436,
        height: 353,
    });
});

// Events
window.electron.window.message.receive((message) => {
    if (message.type === "image") cover.src = currentSong.MISC.ALBUMART ? `https://gensokyoradio.net/images/albums/${message.value}/${currentSong.MISC.ALBUMART}` : "./img/undefined.png";
    else if (message.type === "audio") {
        audio.src = "";

        audio.load();

        audio.src = `https://stream.gensokyoradio.net/${message.value}/`;

        audio.play();
    }
});

audio.addEventListener("pause", () => {
    audio.play();

    stopButton.click();
});