console.log("Script geladen! - Anfang von script.js");

let coins = [];
let editingIndex = -1;
const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv'; // Korrigierte URL

async function loadCSV() {
    console.log("loadCSV aufgerufen - Starte Fetch von Cloud...");
    try {
        const response = await fetch(CSV_URL + '?' + Date.now());
        if (!response.ok) {
            throw new Error("Fetch fehlgeschlagen: " + response.status);
        }
        const text = await response.text();
        console.log("CSV von Cloud geladen (erste 100 Zeichen): ", text.substring(0, 100));
        
        // Parse CSV
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',');
        coins = lines.slice(1).map(line => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim() || '');
            return obj;
        });
        console.log("Coins geparst: ", coins.length, "Einträge");
        
        // Speichere in LocalStorage
        localStorage.setItem('coinsData', JSON.stringify(coins));
        localStorage.setItem('lastSyncDate', new Date().toISOString());
        displayCoins(coins);
        console.log("Daten in LocalStorage gespeichert.");
    } catch (error) {
        console.error("Fehler beim Fetch von Cloud: ", error.message);
        // Offline-Fallback: Lade aus LocalStorage
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const storedData = localStorage.getItem('coinsData');
    if (storedData) {
        coins = JSON.parse(storedData);
        displayCoins(coins);
        const lastSync = localStorage.getItem('lastSyncDate') || 'unbekannt';
        alert("Offline-Modus: Daten aus Cache geladen (letzter Sync: " + lastSync + ")");
        console.log("Daten aus LocalStorage geladen: ", coins.length, "Einträge");
    } else {
        alert("Keine Daten verfügbar – verbinde dich mit Internet für Initial-Laden.");
    }
}

function getImagePath(id, side) {
    return `images/\( {id.padStart(3,'0')}_ \){side}.jpg`;
}

function displayCoins(list) {
    const container = document.getElementById('coinList');
    container.innerHTML = '';
    list.forEach((coin, idx) => {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.innerHTML = `
            <h3>#\( {coin.ID} – \){coin.Coin_Name} <small>(${coin.Denomination})</small></h3>
            <p><strong>\( {coin.Metal_Type}</strong> • \){coin.Country} • ${coin.Face_Value || 'kein Nennwert'}</p>
            <p>Gewicht: \( {coin.Total_Weight_g} g | Feingewicht: \){coin.Fine_Weight_oz} oz | Feingehalt: ${coin.Fineness}</p>
            <p>Ø \( {coin.Diameter_mm} mm × \){coin.Thickness_mm} mm | Rand: \( {coin.Edge} | Magnetismus: \){coin.Magnetism}</p>
            <p>Jahrgänge: ${coin.Years_Issued}</p>
            <p>${coin.Description}</p>
            \( {coin.Notes ? `<p><em> \){coin.Notes}</em></p>` : ''}
            <div class="images">
                \( {coin.Front_Image_Path ? `<img src=" \){coin.Front_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Front_Image_Path}')">` : '<p>kein Front-Bild</p>'}
                \( {coin.Back_Image_Path ? `<img src=" \){coin.Back_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Back_Image_Path}')">` : '<p>kein Back-Bild</p>'}
            </div>
            <small>Erstellt: \( {coin.Created_Date} | Geändert: \){coin.Modified_Date}</small><br>
            <button onclick="editCoin(${idx})">Editieren</button>
        `;
        container.appendChild(card);
    });
}

function openModal(src) {
    document.getElementById('imageModal').style.display = 'flex';
    document.getElementById('modalImage').src = src;
}

function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('coinForm').reset();
    editingIndex = -1;
    const nextId = String(Math.max(...coins.map(c => +c.ID || 0), 0) + 1).padStart(3, '0');
    document.querySelector('[name="ID"]').value = nextId;
}

function editCoin(index) {
    showAddForm();
    const form = document.getElementById('coinForm');
    const coin = coins[index];
    for (let key in coin) {
        if (form.elements[key]) form.elements[key].value = coin[key];
    }
    editingIndex = index;
}

function saveCoin() {
    const form = document.getElementById('coinForm');
    const data = {};
    let isNew = editingIndex === -1;

    for (let el of form.elements) {
        if (el.name) data[el.name] = el.value.trim();
    }

    const today = new Date().toISOString().split('T')[0];
    data.Created_Date = isNew ? today : coins[editingIndex].Created_Date;
    data.Modified_Date = today;

    // Automatische Bildpfade aus ID
    const id = data.ID.padStart(3, '0');
    if (form.Front_Image.files[0]) {
        data.Front_Image_Path = `images/${id}_front.jpg`;
        // Hinweis: Bild manuell in images/ umbenennen und ins Repo committen!
    }
    if (form.Back_Image.files[0]) {
        data.Back_Image_Path = `images/${id}_back.jpg`;
        // Hinweis: Bild manuell in images/ umbenennen und ins Repo committen!
    }

    if (isNew) {
        coins.push(data);
    } else {
        coins[editingIndex] = data;
    }

    // Speichere in LocalStorage
    localStorage.setItem('coinsData', JSON.stringify(coins));
    localStorage.setItem('lastSyncDate', new Date().toISOString());

    downloadCSV(); // Für lokale Backup
    document.getElementById('addForm').style.display = 'none';
    displayCoins(coins);

    // Hinweis: Für Cloud-Sync die neue CSV manuell ins GitHub-Repo hochladen!
}

function downloadCSV() {
    const headers = ["ID","Coin_Name","Metal_Type","Denomination","Country","Mint","Face_Value","Total_Weight_g","Fine_Weight_oz","Fineness","Diameter_mm","Thickness_mm","Edge","Magnetism","Years_Issued","Description","Notes","Created_Date","Modified_Date","Front_Image_Path","Back_Image_Path"];
    const rows = coins.map(c => headers.map(h => `"${(c[h] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog.csv';
    a.click();
}

function showAll(type) { 
    displayCoins(coins.filter(c => c.Metal_Type === type)); 
}

function searchCoins() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const filtered = coins.filter(c => 
        c.Coin_Name.toLowerCase().includes(q) || 
        c.Denomination.toLowerCase().includes(q) ||
        c.ID.includes(q)
    );
    displayCoins(filtered);
}

loadCSV();
console.log("Script-Ende - loadCSV aufgerufen");
