let coins = [];
let currentEditIndex = -1;

// --- Datumskonvertierung ---
const toDE = (iso) => !iso ? "" : iso.split('-').reverse().join('.');
const toISO = (de) => !de ? "" : de.split('.').reverse().join('-');

// --- CSV Import ---
document.getElementById("csvUpload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById("csvStatus").textContent = "Lade CSV...";

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => {
            coins = results.data.map(row => ({
                ...row,
                created: toISO(row.created) || new Date().toISOString().slice(0,10),
                modified: toISO(row.modified) || new Date().toISOString().slice(0,10),
                purchaseDate: row.purchaseDate || "",
                sellDate: row.sellDate || ""
            }));
            renderCoins();
            document.getElementById("csvStatus").textContent = `✓ ${coins.length} Münzen geladen`;
        },
        error: err => {
            document.getElementById("csvStatus").textContent = "Fehler beim Laden der CSV";
            console.error(err);
        }
    });
});

// --- Rendern ---
function renderCoins() {
    const container = document.getElementById("coinsContainer");
    const filter = document.getElementById("weightFilter").value;
    container.innerHTML = "";

    coins
        .filter(c => filter === "all" || c.fineWeight === filter)
        .forEach((coin, i) => {
            const div = document.createElement("div");
            div.className = "coin-entry";
            div.id = `coin-${i}`;
            div.innerHTML = `
                <h3>\( {coin.name || "Unbenannt"} ( \){coin.year || "?"}) – ${coin.fineWeight || ""}</h3>
                <p><strong>Land:</strong> \( {coin.country || ""} | <strong>Nennwert:</strong> \){coin.faceValue || ""} | <strong>Material:</strong> ${coin.material || ""}</p>
                <p><strong>Kauf:</strong> \( {coin.purchasePrice || "-"} € ( \){toDE(coin.purchaseDate) || "-"}) 
                   | <strong>Verkauf:</strong> \( {coin.sellPrice || "-"} € ( \){toDE(coin.sellDate) || "-"})</p>
                <p><small>Erstellt: \( {toDE(coin.created)} | Geändert: \){toDE(coin.modified)}</small></p>
                <button class="btn btn-edit" onclick="editEntry(${i})">Bearbeiten</button>
                <button class="btn btn-delete" onclick="deleteEntry(${i})">Löschen</button>
                <div id="formTarget-${i}"></div>
            `;
            container.appendChild(div);
        });
}

document.getElementById("weightFilter").addEventListener("change", renderCoins);

// --- Neu ---
function newEntry() {
    cancelEdit();
    currentEditIndex = -1;
    const template = document.getElementById("formTemplate");
    template.querySelector("#formTitle").textContent = "Neue Münze hinzufügen";
    clearForm(template);
    template.classList.add("active");
    template.scrollIntoView({ behavior: "smooth" });
}

// --- Bearbeiten (Formular direkt unter der Münze) ---
function editEntry(index) {
    cancelEdit();
    currentEditIndex = index;
    const coin = coins[index];

    const target = document.getElementById(`formTarget-${index}`);
    const clone = document.getElementById("formTemplate").cloneNode(true);
    clone.id = "inlineForm";
    clone.classList.add("active");

    // Werte füllen
    clone.querySelector("#name").value = coin.name || "";
    clone.querySelector("#year").value = coin.year || "";
    clone.querySelector("#country").value = coin.country || "";
    clone.querySelector("#faceValue").value = coin.faceValue || "";
    clone.querySelector("#fineWeight").value = coin.fineWeight || "1 Oz";
    clone.querySelector("#weight").value = coin.weight || "";
    clone.querySelector("#material").value = coin.material || "";
    clone.querySelector("#minted").value = coin.minted || "";
    clone.querySelector("#purchasePrice").value = coin.purchasePrice || "";
    clone.querySelector("#purchaseDate").value = coin.purchaseDate || "";
    clone.querySelector("#sellPrice").value = coin.sellPrice || "";
    clone.querySelector("#sellDate").value = coin.sellDate || "";

    clone.querySelector("#formTitle").textContent = "Münze bearbeiten";

    // Speichern-Button überschreibt globale Funktion
    clone.querySelector("button[onclick='saveEntry()']").onclick = () => saveEntry();

    target.appendChild(clone);
    document.getElementById(`coin-${index}`).classList.add("highlight");
    document.getElementById(`coin-${index}`).scrollIntoView({ behavior: "smooth", block: "center" });
}

// --- Speichern ---
function saveEntry() {
    const form = document.getElementById("inlineForm") || document.getElementById("formTemplate");
    const now = new Date().toISOString().slice(0,10);

    const newCoin = {
        name: form.querySelector("#name").value.trim(),
        year: form.querySelector("#year").value.trim(),
        country: form.querySelector("#country").value.trim(),
        faceValue: form.querySelector("#faceValue").value.trim(),
        fineWeight: form.querySelector("#fineWeight").value,
        weight: form.querySelector("#weight").value.trim(),
        material: form.querySelector("#material").value.trim(),
        minted: form.querySelector("#minted").value.trim(),
        purchasePrice: form.querySelector("#purchasePrice").value.trim(),
        purchaseDate: form.querySelector("#purchaseDate").value,
        sellPrice: form.querySelector("#sellPrice").value.trim(),
        sellDate: form.querySelector("#sellDate").value,
        created: currentEditIndex === -1 ? now : coins[currentEditIndex].created,
        modified: now
    };

    if (currentEditIndex === -1) {
        coins.push(newCoin);
    } else {
        coins[currentEditIndex] = newCoin;
    }

    cancelEdit();
    renderCoins();
}

// --- Abbrechen ---
function cancelEdit() {
    document.querySelectorAll(".coin-entry").forEach(el => el.classList.remove("highlight"));
    document.getElementById("formTemplate").classList.remove("active");
    document.querySelectorAll("#inlineForm").forEach(el => el.remove());
    clearForm(document.getElementById("formTemplate"));
}

// --- Löschen ---
function deleteEntry(i) {
    if (confirm("Münze wirklich löschen?")) {
        coins.splice(i, 1);
        cancelEdit();
        renderCoins();
    }
}

// --- Formular leeren ---
function clearForm(container) {
    container.querySelectorAll("input, select").forEach(el => {
        if (el.type === "date") el.value = "";
        else if (el.tagName === "SELECT") el.value = "1 Oz";
        else el.value = "";
    });
}

// Initiales Rendern
renderCoins();
