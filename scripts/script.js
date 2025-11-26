let coins = [];
let editingIndex = -1;
let currentView = 'all';
const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

function formatDate(dateStr) {
    if (!dateStr) return 'unbekannt';
    const [y, m, d] = dateStr.split('-');
    return `\( {d}. \){m}.${y}`;
}

async function loadCSV() {
    try {
        const resp = await fetch(CSV_URL + '?t=' + Date.now());
        if (!resp.ok) throw new Error('Netzwerkfehler: ' + resp.status);
        const text = await resp.text();

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error('CSV zu kurz');

        const headers = lines[0].split(',').map(h => h.trim());
        coins = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, i) => obj[h] = vals[i] || '');
            return obj;
        });

        localStorage.setItem('coinsData', JSON.stringify(coins));
        localStorage.setItem('lastSyncDate', new Date().toISOString());
        displayCoins(coins);
    } catch (e) {
        console.warn('Online-Laden fehlgeschlagen → Offline-Modus', e);
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('coinsData');
    if (data) {
        coins = JSON.parse(data);
        displayCoins(coins);
    } else {
        document.getElementById('coinList').innerHTML = '<p style="text-align:center; grid-column:1/-1; font-size:1.5rem;">Keine Daten – bitte online gehen zum Laden.</p>';
    }
}

function displayCoins(list) {
    const container = document.getElementById('coinList');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column:1/-1; font-size:1.5rem; color:#999;">Keine Münzen gefunden</p>';
        return;
    }

    list.forEach((coin, idx) => {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.innerHTML = `
            <h3>#\( {coin.ID} – \){coin.Coin_Name} (${coin.Denomination})</h3>
            <p><strong>\( {coin.Metal_Type}</strong> • \){coin.Country} • ${coin.Face_Value || 'kein Nennwert'}</p>
            <p>Gewicht: \( {coin.Total_Weight_g} g | Feingewicht: \){coin.Fine_Weight_oz} oz | Feingehalt: ${coin.Fineness}</p>
            <p>Ø \( {coin.Diameter_mm} mm × \){coin.Thickness_mm} mm | Rand: \( {coin.Edge} | Magnetismus: \){coin.Magnetism}</p>
            <p>Jahrgänge: ${coin.Years_Issued}</p>
            <p>${coin.Description}</p>
            \( {coin.Notes ? `<p><em> \){coin.Notes}</em></p>` : ''}
            <div class="images">
                \( {coin.Front_Image_Path ? `<img src=" \){coin.Front_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Front_Image_Path}')">` : '<p>kein Bild</p>'}
                \( {coin.Back_Image_Path ? `<img src=" \){coin.Back_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Back_Image_Path}')">` : ''}
            </div>
            <small>Erstellt: \( {formatDate(coin.Created_Date)} | Geändert: \){formatDate(coin.Modified_Date)}</small><br>
            <button onclick="editCoin(${idx})">Bearbeiten</button>
        `;
        container.appendChild(card);
    });
}

function openModal(src) {
    document.getElementById('imageModal').style.display = 'flex';
    document.getElementById('modalImage').src = src;
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function showAddForm() {
    currentView = 'add';
    const container = document.getElementById('editContainer');
    container.style.display = 'block';
    container.innerHTML = getFormHTML('Münze hinzufügen');
    const nextId = String(Math.max(...coins.map(c => +c.ID || 0), 0) + 1).padStart(3, '0');
    document.querySelector('[name="ID"]').value = nextId;
    editingIndex = -1;
    document.getElementById('mainContent').style.display = 'none';
    container.scrollIntoView({ behavior: 'smooth' });
}

function editCoin(idx) {
    currentView = 'edit';
    editingIndex = idx;
    const coin = coins[idx];
    const container = document.getElementById('editContainer');
    container.style.display = 'block';
    container.innerHTML = `
        <div class="coin-card" style="margin-bottom: 30px;">${document.querySelectorAll('#coinList .coin-card')[idx].innerHTML}</div>
        ${getFormHTML('Münze bearbeiten')}
    `;

    const form = container.querySelector('form');
    Object.keys(coin).forEach(k => {
        if (form.elements[k]) form.elements[k].value = coin[k] || '';
    });

    document.getElementById('mainContent').style.display = 'none';
    container.scrollIntoView({ behavior: 'smooth' });
}

function getFormHTML(title) {
    return `
        <div class="form-card">
            <h2 id="formTitle">${title}</h2>
            <form id="coinForm">
                <div class="form-grid">
                    <label>ID: <input type="text" name="ID" readonly></label>
                    <label>Münzenname: <input type="text" name="Coin_Name" required></label>
                    <label>Metall: <select name="Metal_Type"><option>Gold</option><option>Silber</option></select></label>
                    <label>Stückelung: <input type="text" name="Denomination" required></label>
                    <label>Land: <input type="text" name="Country" required></label>
                    <label>Prägestätte: <input type="text" name="Mint"></label>
                    <label>Nennwert: <input type="text" name="Face_Value"></label>
                    <label>Gesamtgewicht (g): <input type="text" name="Total_Weight_g" required></label>
                    <label>Feingewicht (oz): <input type="text" name="Fine_Weight_oz" required></label>
                    <label>Feingehalt: <input type="text" name="Fineness" required></label>
                    <label>Durchmesser (mm): <input type="text" name="Diameter_mm" required></label>
                    <label>Dicke (mm): <input type="text" name="Thickness_mm" required></label>
                    <label>Rand: <input type="text" name="Edge"></label>
                    <label>Magnetismus: <input type="text" name="Magnetism"></label>
                    <label>Jahrgänge: <input type="text" name="Years_Issued"></label>
                    <label>Beschreibung: <textarea name="Description"></textarea></label>
                    <label>Bemerkungen: <textarea name="Notes"></textarea></label>
                    <label>Vorderseite (URL): <input type="text" name="Front_URL" placeholder="https://..."></label>
                    <label>Rückseite (URL): <input type="text" name="Back_URL" placeholder="https://..."></label>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="saveCoin()">Speichern</button>
                    <button type="button" onclick="cancelEdit()">Abbrechen</button>
                </div>
            </form>
        </div>
    `;
}

function cancelEdit() {
    document.getElementById('editContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    displayCoins(coins);
}

function saveCoin() {
    const form = document.getElementById('coinForm');
    const data = {};
    for (let el of form.elements) {
        if (el.name) data[el.name] = el.value.trim();
    }

    const today = new Date().toISOString().split('T')[0];
    const isNew = editingIndex === -1;
    data.Created_Date = isNew ? today : coins[editingIndex].Created_Date;
    data.Modified_Date = today;

    const id = data.ID.padStart(3, '0');
    data.Front_Image_Path = data.Front_URL || (isNew ? '' : coins[editingIndex]?.Front_Image_Path || '');
    data.Back_Image_Path = data.Back_URL || (isNew ? '' : coins[editingIndex]?.Back_Image_Path || '');

    if (isNew) coins.push(data);
    else coins[editingIndex] = data;

    localStorage.setItem('coinsData', JSON.stringify(coins));
    cancelEdit();
    alert('Gespeichert!');
}

function downloadCSV() {
    const headers = ["ID","Coin_Name","Metal_Type","Denomination","Country","Mint","Face_Value","Total_Weight_g","Fine_Weight_oz","Fineness","Diameter_mm","Thickness_mm","Edge","Magnetism","Years_Issued","Description","Notes","Created_Date","Modified_Date","Front_Image_Path","Back_Image_Path"];
    const rows = coins.map(c => headers.map(h => `"${(c[h] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'muenzen-katalog.csv'; a.click();
    URL.revokeObjectURL(url);
}

function showAll(filter) {
    let filtered = coins;
    if (filter !== 'all') filtered = coins.filter(c => c.Metal_Type === filter);
    displayCoins(filtered);
}

function filterByWeight() {
    const val = document.getElementById('weightFilter').value;
    if (!val) return displayCoins(coins);
    const filtered = coins.filter(c => c.Fine_Weight_oz == val);
    displayCoins(filtered);
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

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('weightFilter').value = '1';
    displayCoins(coins);
}

// Start
loadCSV();
