// scripts/script.js – Vollständig korrigierte Version mit kombinierter Filterlogik (27.11.2025)
let coins = [];
let editingIndex = -1;
// NEU: Globale Variable, um den ausgewählten Metallfilter zu speichern
let currentMetalFilter = 'all'; 

const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

function formatDate(d) {
    if (!d) return 'unbekannt';
    const [y, m, day] = d.split('-');
    // KORREKTUR: Template Literal Syntax behoben
    return `${day}.${m}.${y}`;
}

async function loadCSV() {
    try {
        const r = await fetch(CSV_URL + '?t=' + Date.now());
        if (!r.ok) throw new Error();
        const text = await r.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(',').map(h => h.trim());
        coins = lines.slice(1).map(line => {
            const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj = {};
            headers.forEach((h, i) => obj[h] = vals[i] || '');
            return obj;
        });
        localStorage.setItem('coinsData', JSON.stringify(coins));
        showCoins(coins);
    } catch (e) {
        const saved = localStorage.getItem('coinsData');
        if (saved) {
            coins = JSON.parse(saved);
            showCoins(coins);
        } else {
            document.getElementById('coinList').innerHTML = '<p style="text-align:center;color:#c00;">Keine Verbindung und kein Cache</p>';
        }
    }
}

function showCoins(list) {
    const box = document.getElementById('coinList');
    box.innerHTML = '';
    if (list.length === 0) {
        box.innerHTML = '<p style="text-align:center;">Keine Münzen gefunden</p>';
        return;
    }
    list.forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'coin-card';
        // KORREKTUR: Template Literal Syntax behoben
        card.innerHTML = `
            <h3>#${c.ID} – ${c.Coin_Name} (${c.Denomination})</h3>
            <p><strong>${c.Metal_Type}</strong> • ${c.Country} • ${c.Face_Value || ''}</p>
            <p>Feingewicht: ${c.Fine_Weight_oz} oz | Gesamt: ${c.Total_Weight_g} g</p>
            <p>Ø ${c.Diameter_mm} × ${c.Thickness_mm} mm | Rand: ${c.Edge}</p>
            <div class="images">
                ${c.Front_Image_Path ? `<img src="${c.Front_Image_Path}" class="coin-thumb" onclick="bigImg('${c.Front_Image_Path}')">` : ''}
                ${c.Back_Image_Path ? `<img src="${c.Back_Image_Path}" class="coin-thumb" onclick="bigImg('${c.Back_Image_Path}')">` : ''}
            </div>
            <small>Erstellt: ${formatDate(c.Created_Date)} | Geändert: ${formatDate(c.Modified_Date)}</small><br><br>
            <button onclick="editCoin(${i})">Bearbeiten</button>
        `;
        box.appendChild(card);
    });
}

function bigImg(src) {
    document.getElementById('modalImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

function editCoin(i) {
    editingIndex = i;
    const c = coins[i];
    document.getElementById('editContainer').style.display = 'block';
    document.getElementById('editContainer').innerHTML = `
        <div class="form-card">
            <h2>Münze bearbeiten – #${c.ID}</h2>
            <form id="editForm">
                <input type="hidden" name="ID" value="${c.ID}">
                <label>Name<br><input name="Coin_Name" value="${c.Coin_Name}" required></label>
                <label>Metall<br><select name="Metal_Type">
                    <option ${c.Metal_Type==='Gold' ? 'selected' : ''}>Gold</option>
                    <option ${c.Metal_Type==='Silber' ? 'selected' : ''}>Silber</option>
                </select></label>
                <label>Stückelung<br><input name="Denomination" value="${c.Denomination}" required></label>
                <label>Land<br><input name="Country" value="${c.Country}" required></label>
                <label>Gesamtgewicht g<br><input name="Total_Weight_g" value="${c.Total_Weight_g}" required></label>
                <label>Feingewicht oz<br><input name="Fine_Weight_oz" value="${c.Fine_Weight_oz}" required></label>
                <label>Feingehalt<br><input name="Fineness" value="${c.Fineness}" required></label>
                <label>Durchmesser mm<br><input name="Diameter_mm" value="${c.Diameter_mm}" required></label>
                <label>Dicke mm<br><input name="Thickness_mm" value="${c.Thickness_mm}" required></label>
                <label>Rand<br><input name="Edge" value="${c.Edge || ''}"></label>
                <label>Vorderseite URL<br><input name="Front_URL" placeholder="https://..."></label>
                <label>Rückseite URL<br><input name="Back_URL" placeholder="https://..."></label>
                <div style="margin:30px 0;text-align:center;">
                    <button type="button" onclick="saveCoin()">Speichern</button>
                    <button type="button" onclick="cancelEdit()">Abbrechen</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('editContainer').scrollIntoView({behavior:'smooth'});
}

function saveCoin() {
    const f = document.getElementById('editForm');
    const d = {};
    for (let e of f.elements) if (e.name) d[e.name] = e.value.trim();
    d.Modified_Date = new Date().toISOString().split('T')[0];
    if (d.Front_URL) d.Front_Image_Path = d.Front_URL;
    if (d.Back_URL) d.Back_Image_Path = d.Back_URL;
    coins[editingIndex] = d;
    localStorage.setItem('coinsData', JSON.stringify(coins));
    cancelEdit();
    showCoins(coins);
    alert('Gespeichert!');
}

function cancelEdit() {
    document.getElementById('editContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function downloadCSV() {
    const headers = Object.keys(coins[0] || {});
    const rows = coins.map(c => headers.map(k => `"${(c[k] || '').replace(/"/g, '""')}"`).join(','));
    const antifer = new Blob([headers.join(',') + '\n' + rows.join('\n')], {type: 'text/csv'});
    const url = URL.createObjectURL(antifer);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muenzen-katalog.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ----------------------------------------------------
// NEUE ZENTRALE FILTERFUNKTION
// ----------------------------------------------------

function applyFilters() {
    const weight = document.getElementById('weightFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const metal = currentMetalFilter; // Status aus der globalen Variable holen
    
    let filteredList = coins.filter(c => {
        // 1. Filter nach Metall (UND)
        const metalMatch = (metal === 'all' || c.Metal_Type === metal);
        
        // 2. Filter nach Gewicht (UND)
        const weightMatch = (!weight || c.Fine_Weight_oz == weight);
        
        // 3. Filter nach Suche (UND)
        const searchMatch = !search || 
            c.Coin_Name.toLowerCase().includes(search) ||
            c.Country.toLowerCase().includes(search) ||
            c.Denomination.toLowerCase().includes(search);
        
        // Alle Kriterien müssen wahr sein (AND-Verknüpfung)
        return metalMatch && weightMatch && searchMatch;
    });
    
    showCoins(filteredList);
}

// ----------------------------------------------------
// FILTER HANDLER UPDATES
// ----------------------------------------------------

// UPDATED: Setzt den Metall-Filter und wendet ALLE Filter an
function showAll(type) {
    console.log(`Filtere nach: ${type}`);
    currentMetalFilter = type; 
    applyFilters();
}

// UPDATED: Wird bei Änderung des Select-Feldes aufgerufen und wendet ALLE Filter an
function filterByWeight() {
    console.log('Filtere nach Gewicht');
    applyFilters();
}

// UPDATED: Wird bei Eingabe in das Suchfeld aufgerufen und wendet ALLE Filter an
function searchCoins() {
    console.log('Suche Münzen');
    applyFilters();
}

// Implementierung für das Hinzufügen-Formular
function showAddForm() {
    console.log('Zeige Formular zum Hinzufügen');
    document.getElementById('editContainer').style.display = 'block';
    document.getElementById('editContainer').innerHTML = `
        <div class="form-card">
            <h2>Münze hinzufügen</h2>
            <p style="text-align:center;padding:20px;">Die Funktion zum Hinzufügen ist noch nicht implementiert.</p>
            <div style="text-align:center;">
                <button type="button" onclick="cancelEdit()">Zurück zur Liste</button>
            </div>
        </div>
    `;
    document.getElementById('mainContent').style.display = 'none';
}

// UPDATED: Setzt alle Filter zurück und wendet die Filterung an
function resetFilters() {
    console.log('Filter zurückgesetzt');
    document.getElementById('weightFilter').value = '';
    document.getElementById('searchInput').value = '';
    currentMetalFilter = 'all'; // Setzt Metallfilter zurück
    applyFilters();
}

// Start
loadCSV();
