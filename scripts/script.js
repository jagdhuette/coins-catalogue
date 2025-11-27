// scripts/script.js – Vollständig korrigierte Version (27.11.2025)
let coins = [];
let editingIndex = -1; 
let currentMetalFilter = 'all'; 

const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

function formatDate(d) {
    if (!d) return 'unbekannt';
    const [y, m, day] = d.split('-');
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

// FIX: Hilfsfunktion zum Erstellen von Bildern mit Broken-Image-Handling
function createCoinImage(path) {
    if (!path) return '';
    
    // Dummymünze HTML als Fallback. Verwende einfache Anführungszeichen ('), um Konflikte mit dem onerror-Attribut zu vermeiden.
    const dummyHtml = "<div class='dummy-coin'>Bild nicht verfügbar</div>"; 
    
    // Escapen der einfachen Anführungszeichen ('), damit sie den 'this.outerHTML' String im DOM nicht vorzeitig beenden.
    const escapedDummyHtml = dummyHtml.replace(/'/g, "\\'");
    
    // Fügt onerror-Handler hinzu, um bei Ladefehler die Dummymünze anzuzeigen.
    return `<img 
        src="${path}" 
        class="coin-thumb" 
        onclick="bigImg('${path}')"
        onerror="this.outerHTML='${escapedDummyHtml}'"
    >`;
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
        card.innerHTML = `
            <h3>#${c.ID} – ${c.Coin_Name} (${c.Denomination})</h3>
            <p><strong>${c.Metal_Type}</strong> • ${c.Country} • ${c.Face_Value || ''}</p>
            <p>Feingewicht: ${c.Fine_Weight_oz} oz | Gesamt: ${c.Total_Weight_g} g</p>
            <p>Ø ${c.Diameter_mm} × ${c.Thickness_mm} mm | Rand: ${c.Edge}</p>
            <div class="images">
                ${createCoinImage(c.Front_Image_Path)}
                ${createCoinImage(c.Back_Image_Path)}
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

// ----------------------------------------------------
// UPDATED: Münze bearbeiten (Mit 2-spaltigen Feldern)
// ----------------------------------------------------
function editCoin(i) {
    editingIndex = i;
    const c = coins[i];
    document.getElementById('editContainer').style.display = 'block';
    
    // Definiere die leeren Werte für Felder, die eventuell fehlen
    const empty = { Magnetism: '', Years_Issued: '', Description: '', Notes: '', Front_Image_Path: '', Back_Image_Path: '', Face_Value: '' };

    document.getElementById('editContainer').innerHTML = `
        <div class="form-card">
            <h2 id="formTitle">Münze bearbeiten – #${c.ID}</h2>
            <form id="editForm">
                <input type="hidden" name="ID" value="${c.ID}">
                
                <div class="form-grid">
                    <label>Name<br><input name="Coin_Name" value="${c.Coin_Name}" required></label>
                    <label>Metall<br><select name="Metal_Type">
                        <option ${c.Metal_Type==='Gold' ? 'selected' : ''}>Gold</option>
                        <option ${c.Metal_Type==='Silber' ? 'selected' : ''}>Silber</option>
                    </select></label>
                    <label>Stückelung<br><input name="Denomination" value="${c.Denomination}" required></label>
                    <label>Land<br><input name="Country" value="${c.Country}" required></label>
                    <label>Nennwert<br><input name="Face_Value" value="${c.Face_Value || empty.Face_Value}"></label>
                    <label>Gesamtgewicht g<br><input type="number" step="any" name="Total_Weight_g" value="${c.Total_Weight_g}" required></label>
                    <label>Feingewicht oz<br><input type="number" step="any" name="Fine_Weight_oz" value="${c.Fine_Weight_oz}" required></label>
                    <label>Feingehalt<br><input type="number" step="any" name="Fineness" value="${c.Fineness}" required></label>
                    <label>Durchmesser mm<br><input type="number" step="any" name="Diameter_mm" value="${c.Diameter_mm}" required></label>
                    <label>Dicke mm<br><input type="number" step="any" name="Thickness_mm" value="${c.Thickness_mm}" required></label>
                    <label>Rand<br><input name="Edge" value="${c.Edge || ''}"></label>
                    <label>Magnetismus<br><input name="Magnetism" value="${c.Magnetism || empty.Magnetism}"></label>
                    <label>Ausgabejahre<br><input name="Years_Issued" value="${c.Years_Issued || empty.Years_Issued}"></label>
                    
                    <label style="grid-column: 1 / -1;">Beschreibung<br><textarea name="Description">${c.Description || empty.Description}</textarea></label>
                    <label style="grid-column: 1 / -1;">Notizen<br><textarea name="Notes">${c.Notes || empty.Notes}</textarea></label>
                    <label style="grid-column: 1 / -1;">Vorderseite URL<br><input name="Front_URL" value="${c.Front_Image_Path || empty.Front_Image_Path}" placeholder="URL zum Bild der Vorderseite"></label>
                    <label style="grid-column: 1 / -1;">Rückseite URL<br><input name="Back_URL" value="${c.Back_Image_Path || empty.Back_Image_Path}" placeholder="URL zum Bild der Rückseite"></label>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="saveCoin()">Änderungen speichern</button>
                    <button type="button" onclick="cancelEdit()">Abbrechen</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('editContainer').scrollIntoView({behavior:'smooth'});
}

// ----------------------------------------------------
// UPDATED: Münze hinzufügen (Mit 2-spaltigen Feldern)
// ----------------------------------------------------
function showAddForm() {
    console.log('Zeige Formular zum Hinzufügen');
    editingIndex = -1; 
    
    const emptyCoin = {
        ID: '', Coin_Name: '', Metal_Type: 'Gold', Denomination: '', Country: '', Mint: '', 
        Face_Value: '', Total_Weight_g: '', Fine_Weight_oz: '', Fineness: '', 
        Diameter_mm: '', Thickness_mm: '', Edge: '', Magnetism: '', 
        Years_Issued: '', Description: '', Notes: '', Front_Image_Path: '', Back_Image_Path: ''
    };
    
    document.getElementById('editContainer').style.display = 'block';
    
    document.getElementById('editContainer').innerHTML = `
        <div class="form-card">
            <h2 id="formTitle">Neue Münze hinzufügen</h2>
            <form id="editForm">
                <input type="hidden" name="ID" value="">
                
                <div class="form-grid">
                    <label>Name<br><input name="Coin_Name" value="${emptyCoin.Coin_Name}" required></label>
                    <label>Metall<br><select name="Metal_Type">
                        <option>Gold</option>
                        <option>Silber</option>
                    </select></label>
                    <label>Stückelung<br><input name="Denomination" value="${emptyCoin.Denomination}" required></label>
                    <label>Land<br><input name="Country" value="${emptyCoin.Country}" required></label>
                    <label>Nennwert<br><input name="Face_Value" value="${emptyCoin.Face_Value}"></label>
                    <label>Gesamtgewicht g<br><input type="number" step="any" name="Total_Weight_g" value="${emptyCoin.Total_Weight_g}" required></label>
                    <label>Feingewicht oz<br><input type="number" step="any" name="Fine_Weight_oz" value="${emptyCoin.Fine_Weight_oz}" required></label>
                    <label>Feingehalt<br><input type="number" step="any" name="Fineness" value="${emptyCoin.Fineness}" required></label>
                    <label>Durchmesser mm<br><input type="number" step="any" name="Diameter_mm" value="${emptyCoin.Diameter_mm}" required></label>
                    <label>Dicke mm<br><input type="number" step="any" name="Thickness_mm" value="${emptyCoin.Thickness_mm}" required></label>
                    <label>Rand<br><input name="Edge" value="${emptyCoin.Edge}"></label>
                    <label>Magnetismus<br><input name="Magnetism" value="${emptyCoin.Magnetism}"></label>
                    <label>Ausgabejahre<br><input name="Years_Issued" value="${emptyCoin.Years_Issued}"></label>
                    
                    <label style="grid-column: 1 / -1;">Beschreibung<br><textarea name="Description">${emptyCoin.Description}</textarea></label>
                    <label style="grid-column: 1 / -1;">Notizen<br><textarea name="Notes">${emptyCoin.Notes}</textarea></label>
                    <label style="grid-column: 1 / -1;">Vorderseite URL<br><input name="Front_URL" value="${emptyCoin.Front_Image_Path}" placeholder="URL zum Bild der Vorderseite"></label>
                    <label style="grid-column: 1 / -1;">Rückseite URL<br><input name="Back_URL" value="${emptyCoin.Back_Image_Path}" placeholder="URL zum Bild der Rückseite"></label>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="saveCoin()">Münze hinzufügen</button>
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
    
    let message = '';
    
    if (editingIndex !== -1) {
        coins[editingIndex] = d;
        message = `Münze #${d.ID} erfolgreich bearbeitet!`;
    } else {
        const maxId = coins.reduce((max, coin) => Math.max(max, parseInt(coin.ID) || 0), 0);
        const newId = (maxId + 1).toString().padStart(3, '0');
        
        d.ID = newId;
        d.Created_Date = d.Modified_Date; 
        coins.push(d);
        message = `Neue Münze #${newId} erfolgreich hinzugefügt!`;
    }

    localStorage.setItem('coinsData', JSON.stringify(coins));
    cancelEdit();
    applyFilters(); 
    alert(message);
}

function cancelEdit() {
    document.getElementById('editContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    editingIndex = -1; 
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

function applyFilters() {
    const weight = document.getElementById('weightFilter').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    const metal = currentMetalFilter; 
    
    let filteredList = coins.filter(c => {
        const metalMatch = (metal === 'all' || c.Metal_Type === metal);
        const weightMatch = (!weight || c.Fine_Weight_oz == weight);
        const searchMatch = !search || 
            c.Coin_Name.toLowerCase().includes(search) ||
            c.Country.toLowerCase().includes(search) ||
            c.Denomination.toLowerCase().includes(search);
        
        return metalMatch && weightMatch && searchMatch;
    });
    
    showCoins(filteredList);
}

function showAll(type) {
    console.log(`Filtere nach: ${type}`);
    currentMetalFilter = type; 
    applyFilters();
}

function filterByWeight() {
    console.log('Filtere nach Gewicht');
    applyFilters();
}

function searchCoins() {
    console.log('Suche Münzen');
    applyFilters();
}

function resetFilters() {
    console.log('Filter zurückgesetzt');
    document.getElementById('weightFilter').value = '';
    document.getElementById('searchInput').value = '';
    currentMetalFilter = 'all'; 
    applyFilters();
}

loadCSV();
