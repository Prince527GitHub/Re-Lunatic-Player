document.getElementById("all").addEventListener("click", async(event) => {
    event.target.disabled = true;

    if (await window.electron.database.has("history")) window.electron.database.delete("history");

    alert("Deleted all entries");

    event.target.disabled = false;
});

document.getElementById("today").addEventListener("click", async(event) => {
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

    alert("Deleted today's entries");

    event.target.disabled = false;
});

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