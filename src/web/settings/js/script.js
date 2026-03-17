// Delete All Entries
document.getElementById("all").addEventListener("click", async(event) => {
    const original = event.target.innerText;

    event.target.disabled = true;

    if (await window.electron.database.has("history")) window.electron.database.delete("history");

    event.target.innerText = "Deleted!";

    setTimeout(() => {
        event.target.innerText = original;
        event.target.disabled = false;
    }, 2000);
});

// Delete Today's Entries
document.getElementById("today").addEventListener("click", async(event) => {
    const original = event.target.innerText;

    event.target.disabled = true;

    if (await window.electron.database.has("history")) {
        const songs = await window.electron.database.get("history");

        for (const song of songs) {
            const parsed = JSON.parse(song);

            const date = new Date(parsed.time.start);
            const songDate = {
                day: date.getDate(),
                month: date.getMonth(),
                year: date.getFullYear()
            }

            const today = new Date();
            const todayDate = {
                day: today.getDate(),
                month: today.getMonth(),
                year: today.getFullYear()
            }

            if ((songDate.day === todayDate.day) && (songDate.month === todayDate.month) && (songDate.year === todayDate.year)) window.electron.database.pull("history", song);
        }
    }

    event.target.innerText = "Deleted!";

    setTimeout(() => {
        event.target.innerText = original;
        event.target.disabled = false;
    }, 2000);
});

// Limit History Entries
const amount = document.getElementById("amount");
const label = document.getElementById("amount-value");

const amountLabels = {
    "0": "None",
    "1": "50",
    "2": "100",
    "3": "150",
    "4": "200",
    "5": "Unlimited"
};

amount.addEventListener("input", updateLabel);
amount.addEventListener("change", () => {
    window.electron.database.delete("history");

    window.electron.database.set("maximum", amount.value);
});

async function showLabel() {
    const setting = await window.electron.database.get("maximum") || "1";

    amount.value = setting;

    updateLabel();
}

showLabel();

function updateLabel() {
    label.innerText = amountLabels[amount.value] || "Error";
}

// Image Quality
const image = document.getElementById("image");

async function showImage() {
    const setting = await window.electron.database.get("image") || "200";

    image.value = setting;
}

showImage();

image.addEventListener("change", () => {
    window.electron.database.set("image", image.value);

    window.electron.window.message.send({
        main: true,
        message: {
            type: "image",
            value: image.value
        }
    });
});

// Audio Quality
const audio = document.getElementById("audio");

async function showAudio() {
    const setting = await window.electron.database.get("audio") || "1";

    audio.value = setting;
}

showAudio();

audio.addEventListener("change", () => {
    window.electron.database.set("audio", audio.value);

    window.electron.window.message.send({
        main: true,
        message: {
            type: "audio",
            value: audio.value
        }
    });
});

// Version
async function showVersion() {
    const local = await window.electron.version();

    document.getElementById("version").innerText = local;
}

showVersion();

// Discord Rich Presence
const rpcToggle = document.getElementById("rpc-toggle");
const rpcLogin = document.getElementById("rpc-login");
const rpcDot = document.getElementById("rpc-dot");
const rpcStatus = document.getElementById("rpc-status-text");

async function updateRPC() {
    const connected = await window.electron.activity.status();

    rpcDot.className = `rpc-dot ${connected ? "connected" : "disconnected"}`;
    rpcStatus.innerText = connected ? "Connected" : "Disconnected";
    rpcLogin.style.display = connected ? "none" : "";
}

updateRPC();

rpcToggle.addEventListener("click", async () => {
    rpcToggle.disabled = true;

    const setting = await window.electron.database.get("rpc") ?? true;

    window.electron.database.set("rpc", !setting);

    if (setting) await window.electron.activity.clear();

    rpcToggle.innerText = setting ? "Enable" : "Disable";

    rpcToggle.disabled = false;
});

async function showRPC() {
    const setting = await window.electron.database.get("rpc") ?? true;

    rpcToggle.innerText = setting ? "Disable" : "Enable";
}

showRPC();

rpcLogin.addEventListener("click", async () => {
    rpcLogin.disabled = true;
    rpcLogin.innerText = "Connecting...";

    const success = await window.electron.activity.reconnect();

    if (success) {
        await updateRPC();

        rpcLogin.innerText = "Connect";
        rpcLogin.disabled = false;
    } else {
        rpcLogin.innerText = "Failed";

        setTimeout(() => {
            rpcLogin.innerText = "Connect";
            rpcLogin.disabled = false;
        }, 2000);
    }
});