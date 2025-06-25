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

function cleanTime(time) {
    const rounded = new Date(time);

    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    return rounded.getTime();
}

let currentSong = { current: 0, total: 0 };
let isPaused = false;

// Connection
async function init() {
    const socket = new WebSocket("wss://gensokyoradio.net/wss");

    socket.addEventListener("open", (event) => {
        console.log("Connected to Gensokyo Radio!");

        socket.send(JSON.stringify({ message: "grInitialConnection" }));

        console.log("Sent inital request");
    });

    let id;
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        console.log("Message from GR: ", data);

        switch (data.message) {
            case "welcome":
                console.log("Saved ID: ", data.id);
                id = data.id;
                break;
            case "ping":
                console.log("Ping -> Pong");
                socket.send(JSON.stringify({ message: "pong", id }));
                break;
        }

        if (data?.album) setSong(data);
    });

    socket.addEventListener("close", init);
}

init();

async function setSong(song) {
    const quality = await window.electron.database.get("image") || "200";

    song.albumart = song.albumart?.split("/")?.pop();

    cover.src = song.albumart ? `https://gensokyoradio.net/images/albums/${quality}/${song.albumart}` : "./img/undefined.png";
    title.innerText = truncateText(song.title, 45);
    description.innerText = `${song.duration}sec. (${truncateText(song.artist, 7)})`; 

    song.current = Date.now() - song.played * 1000;
    song.total = song.current + song.duration * 1000;

    total.innerText = formatTime(song.total - song.current);

    currentSong = song;

    window.electron.window.title(`Re:LP: ${song.title} - ${song.duration}sec.`);

    if (isPaused) window.electron.activity.clear();
    else window.electron.activity.set(song);

    navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: [{ src: cover.src, sizes: `${quality}x${quality}`, type: "image/jpg" }]
    });

    // Duplicate tracks are being stored in the history
    // (its related to time)
    const sample = {
        info: {
            id: song.albumid,
            title: song.title,
            artist: song.artist,
            album: song.album,
            cover: song.albumart,
            year: song.year
        },
        time: {
            duration: cleanTime(song.duration),
            start: cleanTime(song.current),
            end: cleanTime(song.total)
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

setInterval(async () => {
    const elapsed = Date.now() - currentSong.current;

    current.innerText = formatTime(elapsed);

    window.electron.window.progress(Math.min(elapsed / (currentSong.total - currentSong.current), 1));
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
    if (message.type === "image") cover.src = currentSong.albumart ? `https://gensokyoradio.net/images/albums/${message.value}/${currentSong.albumart}` : "./img/undefined.png";
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