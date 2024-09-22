feather.replace();

function formatDate(time) {
    const date = new Date(time);

    const parts = [
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ].map(part => String(part).padStart(2, "0"));

    return `${parts[0]}.${parts[1]}.${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`;
}

function formatTime(time) {
    return `${String(Math.floor(time / 60)).padStart(2, "0")}:${String(time % 60).padStart(2, "0")}`;
}

function truncateText(string, length) {
    return string.length > length ? `${string.substring(0, length)}...` : string;
}

let song = null;
window.electron.window.message.receive((message) => {
    song = message;

    window.electron.window.title(`Details: ${message.time.duration}sec. - ${message.info.title}`);

    document.getElementById("cover").src = message.info.album ? `https://gensokyoradio.net/images/albums/500/${message.info.cover}` : "../../img/undefined.png";
    document.getElementById("title").innerText = truncateText(message.info.title, 45);
    document.getElementById("details").innerText = `${message.time.duration}sec. (${message.info.artist})`;
    document.getElementById("duration").innerText = formatTime(message.time.duration);

    document.getElementById("started").innerText = formatDate(message.time.start);
    document.getElementById("ended").innerText = formatDate(message.time.end);
    document.getElementById("year").innerText = message.info.year;
    document.getElementById("author").innerText = message.info.artist;
    document.getElementById("album").innerText = message.info.album;
});

document.getElementById("copy").addEventListener("click", () => navigator.clipboard.writeText(song.info.title));
document.getElementById("search").addEventListener("click", () => window.electron.open(`https://gensokyoradio.net/music/album/${song.info.id}/`));