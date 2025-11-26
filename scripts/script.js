let coins = [];
let editingIndex = -1;
const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

function formatDate(dateStr) {
    if (!dateStr) return 'unbekannt';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function loadCSV() {
    try {
        const resp = await fetch(CSV_URL + '?t=' + Date.now());
        if (!resp.ok) throw new Error();
        const text = await resp.text();

        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',');
        coins = lines.slice(1).map(line => {
            const vals = line.split(',');
            const obj = {};
            headers.forEach((h, i) => obj[h.trim()] = (vals[i] || '').trim());
            return obj;
        });

        localStorage.setItem('coinsData', JSON.stringify(coins));
        localStorage.setItem('lastSyncDate', new Date().toISOString());
        displayCoins(coins);
    } catch (e) {
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('coinsData');
    if (data) {
        coins = JSON.parse(data);
        displayCoins(coins);
        alert('Offline-Modus – Daten aus Cache geladen');
    } else {
        alert('Keine Daten – bitte online gehen');
    }
}

function displayCoins(list) {
    const container = document.getElementById('coinList');
    container.innerHTML = '';

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
                \( {coin.Front_Image_Path ? `<img src=" \){coin.Front_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Front_Image_Path}')">` : '<p>kein Front-Bild</p>'}
                \( {coin.Back_Image_Path ? `<img src=" \){coin.Back_Image_Path}" class="coin-thumb" onclick="openModal('${coin.Back_Image_Path}')">` : '<p>kein Back-Bild</p>'}
            </div>
            <small>Erstellt: \( {formatDate(coin.Created_Date)} | Geändert: \){formatDate(coin.Modified_Date)}</small><br>
            <button onclick="editCoin(${idx})">Bearbeiten</button>
        `;

        container.appendChild(card);
    });
}

function openModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    img.src = src;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function showAddForm() {
    document.getElementById('formTitle').textContent = 'Münze hinzufügen';
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('coinForm').reset();
    editingIndex = -1;
    const nextId = String(Math.max(...coins.map(c => +c.ID || 0), 0) + 1).padStart(3, '0');
    document.querySelector('[name="ID"]').value = nextId;
    document.getElementById('addForm').scrollIntoView({ behavior: 'smooth' });
}

function editCoin(index) {
    document.getElementById('formTitle').textContent = 'Münze bearbeiten';
    showAddForm();
    const form = document.getElementById('coinForm');
    const c = coins[index];
    Object.keys(c).forEach(k => {
        if (form.elements[k]) form.elements[k].value = c[k] || '';
    });
    editingIndex = index;
}

function cancelForm() {
    document.getElementById('addForm').style.display = 'none';
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

    const id = data.ID.padStart(3, '0');
    data.Front_Image_Path = data.Front_URL || (form.Front_Image.files[0] ? `images/${id}_front.jpg` : (isNew ? '' : coins[editingIndex].Front_Image_Path));
    data.Back_Image_Path = data.Back_URL || (form.Back_Image.files[0] ? `images/${id}_back.jpg` : (isNew ? '' : coins[editingIndex].Back_Image_Path));

    if (isNew) coins.push(data);
    else coins[editingIndex] = data;

    localStorage.setItem('coinsData', JSON.stringify(coins));
    localStorage.setItem('lastSyncDate', new Date().toISOString());

    cancelForm();
    displayCoins(coins);
    alert('Münze gespeichert!');
}

function downloadCSV() {
    const headers = ["ID","Coin_Name","Metal_Type","Denomination","Country","Mint","Face_Value","Total_Weight_g","Fine_Weight_oz","Fineness","Diameter_mm","Thickness_mm","Edge","Magnetism","Years_Issued","Description","Notes","Created_Date","Modified_Date","Front_Image_Path","Back_Image_Path"];
    const rows = coins.map(c) => headers.map(h => `"${(c[h] || '').replace(/"/g, '""')}"`).join(',');
    const csv = headers.join(',') + '\n' + coins.map(rows).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muenzen-katalog.csv';
    a.click();
    URL.revokeObjectURL(url);
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

// Start
loadCSV();
