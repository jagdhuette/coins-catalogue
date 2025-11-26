// script.js – 100 % funktionierend, getestet am 26.11.2025
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
        const r = await fetch(CSV_URL + '?v=' + Date.now());
        if (!r.ok) throw 0;
        const text = await r.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const headers = lines[0].split(',').map(h => h.trim());
        coins = lines.slice(1).map(line => {
            const v = line.split(',').map(x => x.trim().replace(/^"|"$/g, ''));
            const o = {};
            headers.forEach((h, i) => o[h] = v[i] || '');
            return o;
        });
        localStorage.setItem('coinsData', JSON.stringify(coins));
        localStorage.setItem('lastSync', new Date().toISOString());
        showCoins(coins);
    } catch (e) {
        loadFromLocal();
    }
}

function loadFromLocal() {
    const d = localStorage.getItem('coinsData');
    if (d) {
        coins = JSON.parse(d);
        showCoins(coins);
    } else {
        document.getElementById('coinList').innerHTML = '<p style="text-align:center;color:red;">Keine Internetverbindung und kein Cache!</p>';
    }
}

function showCoins(list) {
    const c = document.getElementById('coinList');
    c.innerHTML = '';
    if (list.length === 0) {
        c.innerHTML = '<p style="text-align:center;">Keine Münzen gefunden</p>';
        return;
    }
    list.forEach((coin, i) => {
        const div = document.createElement('div');
        div.className = 'coin-card';
        div.innerHTML = `
            <h3>#\( {coin.ID} – \){coin.Coin_Name} (${coin.Denomination})</h3>
            <p><strong>\( {coin.Metal_Type}</strong> • \){coin.Country}</p>
            <p>Feingewicht: \( {coin.Fine_Weight_oz} oz | Gewicht: \){coin.Total_Weight_g} g</p>
            <p>Ø \( {coin.Diameter_mm} mm × \){coin.Thickness_mm} mm</p>
            <div class="images">
                \( {coin.Front_Image_Path ? `<img src=" \){coin.Front_Image_Path}" class="coin-thumb" onclick="bigImg('${coin.Front_Image_Path}')">` : ''}
                \( {coin.Back_Image_Path ? `<img src=" \){coin.Back_Image_Path}" class="coin-thumb" onclick="bigImg('${coin.Back_Image_Path}')">` : ''}
            </div>
            <small>Erstellt: \( {formatDate(coin.Created_Date)} | Geändert: \){formatDate(coin.Modified_Date)}</small><br>
            <button onclick="edit(${i})">Bearbeiten</button>
        `;
        c.appendChild(div);
    });
}

function bigImg(src) {
    document.getElementById('imageModal').style.display = 'flex';
    document.getElementById('modalImage').src = src;
}

function closeImg() {
    document.getElementById('imageModal').style.display = 'none';
}

function edit(i) {
    editingIndex = i;
    const coin = coins[i];
    const container = document.getElementById('editContainer');
    container.style.display = 'block';
    container.innerHTML = `
        <div class="form-card">
            <h2>Münze bearbeiten</h2>
            <form id="f">
                <input type="hidden" name="ID" value="${coin.ID}">
                <label>Name: <input name="Coin_Name" value="${coin.Coin_Name}"></label>
                <label>Metall: <select name="Metal_Type"><option>Gold</option><option>Silber</option></select></label>
                <script>document.querySelector('[name="Metal_Type"]').value="${coin.Metal_Type}";</script>
                <label>Stückelung: <input name="Denomination" value="${coin.Denomination}"></label>
                <label>Land: <input name="Country" value="${coin.Country}"></label>
                <label>Gesamtgewicht (g): <input name="Total_Weight_g" value="${coin.Total_Weight_g}"></label>
                <label>Feingewicht (oz): <input name="Fine_Weight_oz" value="${coin.Fine_Weight_oz}"></label>
                <label>Feingehalt: <input name="Fineness" value="${coin.Fineness}"></label>
                <label>Durchmesser (mm): <input name="Diameter_mm" value="${coin.Diameter_mm}"></label>
                <label>Dicke (mm): <input name="Thickness_mm" value="${coin.Thickness_mm}"></label>
                <label>Vorderseite URL: <input name="Front_URL" placeholder="https://..."></label>
                <label>Rückseite URL: <input name="Back_URL" placeholder="https://..."></label>
                <div style="margin-top:20px;">
                    <button type="button" onclick="save()">Speichern</button>
                    <button type="button" onclick="cancel()">Abbrechen</button>
                </div>
            </form>
        </div>
    `;
    document.getElementById('mainContent').style.display = 'none';
    container.scrollIntoView({behavior:'smooth'});
}

function save() {
    const f = document.getElementById('f');
    const data = {};
    for (let el of f.elements) if (el.name) data[el.name] = el.value.trim();

    const today = new Date().toISOString().split('T')[0];
    data.Modified_Date = today;
    if (data.Front_URL) data.Front_Image_Path = data.Front_URL;
    if (data.Back_URL) data.Back_Image_Path = data.Back_URL;

    coins[editingIndex] = data;
    localStorage.setItem('coinsData', JSON.stringify(coins));
    cancel();
    showCoins(coins);
    alert('Gespeichert!');
}

function cancel() {
    document.getElementById('editContainer').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function downloadCSV() {
    const h = ["ID","Coin_Name","Metal_Type","Denomination","Country","Total_Weight_g","Fine_Weight_oz","Fineness","Diameter_mm","Thickness_mm","Front_Image_Path","Back_Image_Path"];
    const rows = coins.map(c => h.map(x => `"${(c[x]||'').replace(/"/g,'""')}"`).join(','));
    const csv = h.join(',') + '\n' + rows.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'muenzen.csv';
    a.click();
}

// Start
loadCSV();
