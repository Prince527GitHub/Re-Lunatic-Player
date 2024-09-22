feather.replace();

// Time
function formatDate(date) {
    date = new Date(date);

    const hours = (date.getHours() % 12 || 12).toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
}

function formatTime(time) {
    return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}

// Basic
async function getSongs() {
    const array = await window.electron.database.get("history") || [];

    return array.reverse();
}

function renderSongs(songs) {
    const html = songs.map((song, index) => {
        song = JSON.parse(song);

        return /* html */ `
            <div onclick="showDetails('${song.time.start}', '${song.time.end}')">
                <h1>${song.info.title}</h1>
                <p>${song.info.artist}</p>
                <p>${formatTime(song.time.duration)} - ${formatDate(song.time.end)}</p>
            </div>
        `;
    }).join("");

    document.getElementById("songs").innerHTML = html;
}

async function showSongs() {
    const songs = await getSongs();

    renderSongs(songs);
}

showSongs();

// Search
async function searchSongs(query) {
    const songs = await getSongs();

    const filtered = songs.filter(song => {
        song = JSON.parse(song);

        return song.info.title.toLowerCase().includes(query.toLowerCase());
    });

    renderSongs(filtered);
}

document.getElementById("search").addEventListener("keypress", (event) => {
    if (event.key === "Enter") searchSongs(event.target.value);
});

// Refresh
const button = document.getElementById("refresh");

button.addEventListener("click", () => {
    button.classList.add("rotate");
    button.disabled = true;

    setTimeout(() => {
        button.classList.remove("rotate");
        button.disabled = false;
    }, 2000);

    showSongs();
});

window.electron.window.message.receive(() => button.click());

// Details
async function showDetails(start, end) {
    start = Number(start);
    end = Number(end);

    const data = await window.electron.database.get("history");

    const selected = data.find(song => {
        song = JSON.parse(song);

        return song.time.start === start && song.time.end === end;
    });

    const parsed = JSON.parse(selected);

    window.electron.window.open({
        file: `web/details/index.html`,
        title: `Details: ${parsed.time.duration}sec. - ${parsed.info.title}`,
        width: 346,
        height: 328,
        data: parsed
    });
}