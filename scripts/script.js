let coins = [];
let editingIndex = -1;
const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

function formatDate(d) {
    if (!d) return 'unbekannt';
    const [y, m, day] = d.split('-');
    return day + '.' + m + '.' + y;
}

async function loadCSV() {
    try {
        const r = await fetch(CSV_URL + '?t=' + Date.now());
        if (!r.ok) throw 'net';
        const t = await r.text();
        const lines = t.split('\n').map(l => l.trim()).filter(l => l);
        const h = lines[0].split(',').map(x => x.trim());
        coins = lines.slice(1).map(l => {
            const v = l.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
            const o = {};
            h.forEach((k, i) => o[k] = v[i] || '');
            return o;
        });
        localStorage.setItem('coinsData', JSON.stringify(coins));
        showCoins(coins);
    } catch (e) {
        const saved = localStorage.getItem('coinsData');
        if (saved) {
            coins = JSON.parse(saved);
            showCoins(coins);
        } else {
            document.getElementById('coinList').innerHTML = '<p style="text-align:center;color:#c00;">Keine Internetverbindung und kein Cache</p>';
        }
    }
}

function showCoins(list) {
    const box = document.getElementById('coinList');
    box.innerHTML = '';
    list.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'coin-card';
        div.innerHTML = `
            <h3>#\( {c.ID} – \){c.Coin_Name} (${c.Denomination})</h3>
            <p><strong>\( {c.Metal_Type}</strong> • \){c.Country} • ${c.Face_Value || ''}</p>
            <p>Feingewicht: \( {c.Fine_Weight_oz} oz | Gesamt: \){c.Total_Weight_g} g</p>
            <p>Ø \( {c.Diameter_mm} × \){c.Thickness_mm} mm | Rand: ${c.Edge}</p>
            <div class="images">
                \( {c.Front_Image_Path ? `<img src=" \){c.Front_Image_Path}" class="coin-thumb" onclick="big('${c.Front_Image_Path}')">` : ''}
                \( {c.Back_Image_Path ? `<img src=" \){c.Back_Image_Path}" class="coin-thumb" onclick="big('${c.Back_Image_Path}')">` : ''}
            </div>
            <small>Erstellt: \( {formatDate(c.Created_Date)} | Geändert: \){formatDate(c.Modified_Date)}</small><br><br>
            <button onclick="editCoin(${i})">Bearbeiten</button>
        `;
        box.appendChild(div);
    });
}

function big(src) {
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
                <label>Münzenname<br><input name="Coin_Name" value="${c.Coin_Name}" required></label>
                <label>Metall<br><select name="Metal_Type">
                    <option ${c.Metal_Type==='Gold'?'selected':''}>Gold</option>
                    <option ${c.Metal_Type==='Silber'?'selected':''}>Silber</option>
                </select></label>
                <label>Stückelung<br><input name="Denomination" value="${c.Denomination}" required></label>
                <label>Land<br><input name="Country" value="${c.Country}" required></label>
                <label>Gesamtgewicht g<br><input name="Total_Weight_g" value="${c.Total_Weight_g}" required></label>
                <label>Feingewicht oz<br><input name="Fine_Weight_oz" value="${c.Fine_Weight_oz}" required></label>
                <label>Feingehalt<br><input name="Fineness" value="${c.Fineness}" required></label>
                <label>Durchmesser mm<br><input name="Diameter_mm" value="${c.Diameter_mm}" required></label>
                <label>Dicke mm<br><input name="Thickness_mm" value="${c.Thickness_mm}" required></label>
                <label>Rand<br><input name="Edge" value="${c.Edge}"></label>
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
    const h = Object.keys(coins[0] || {});
    const rows = coins.map(c => h.map(k => `"${(c[k]||'').replace(/"/g,'""')}"`).join(','));
    const csv = h.join(',') + '\n' + rows.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    });
    a.download = 'muenzen-katalog.csv';
    a.click();
}

// Start
loadCSV();
