// Münzen-Katalog - Vollständig robust und auf Deutsch
let coins = [];
let editingIndex = -1;
const CSV_URL = 'https://raw.githubusercontent.com/jagdhuette/coins-catalogue/main/data/catalog.csv';

// Globale Funktionen zuerst definieren (damit Buttons sofort funktionieren)
function showAll(type) {
    var filtered = coins.filter(function(c) { return c.Metal_Type === type; });
    displayCoins(filtered);
}

function searchCoins() {
    var input = document.getElementById('searchInput');
    var q = input.value.toLowerCase();
    var filtered = coins.filter(function(c) {
        return c.Coin_Name.toLowerCase().indexOf(q) > -1 ||
               c.Denomination.toLowerCase().indexOf(q) > -1 ||
               c.ID.indexOf(q) > -1;
    });
    displayCoins(filtered);
}

function showAddForm() {
    document.getElementById('addForm').style.display = 'block';
    document.getElementById('coinForm').reset();
    editingIndex = -1;
    var nextId = String(Math.max.apply(Math, coins.map(function(c) { return +c.ID || 0; })) + 1).padStart(3, '0');
    document.querySelector('[name="ID"]').value = nextId;
}

function editCoin(index) {
    showAddForm();
    var form = document.getElementById('coinForm');
    var coin = coins[index];
    for (var key in coin) {
        if (form.elements[key]) form.elements[key].value = coin[key];
    }
    editingIndex = index;
}

function saveCoin() {
    var form = document.getElementById('coinForm');
    var data = {};
    var isNew = editingIndex === -1;

    for (var i = 0; i < form.elements.length; i++) {
        var el = form.elements[i];
        if (el.name) data[el.name] = el.value.trim();
    }

    var today = new Date().toISOString().split('T')[0];
    data.Created_Date = isNew ? today : coins[editingIndex].Created_Date;
    data.Modified_Date = today;

    var id = data.ID.padStart(3, '0');

    // Bild-Logik: URL hat Vorrang
    data.Front_Image_Path = data.Front_URL || (form.Front_Image.files[0] ? 'images/' + id + '_front.jpg' : (isNew ? '' : coins[editingIndex].Front_Image_Path));
    data.Back_Image_Path = data.Back_URL || (form.Back_Image.files[0] ? 'images/' + id + '_back.jpg' : (isNew ? '' : coins[editingIndex].Back_Image_Path));

    if (isNew) {
        coins.push(data);
    } else {
        coins[editingIndex] = data;
    }

    localStorage.setItem('coinsData', JSON.stringify(coins));
    localStorage.setItem('lastSyncDate', new Date().toISOString());

    document.getElementById('addForm').style.display = 'none';
    displayCoins(coins);

    alert('Münze gespeichert! (Lokal – für Cloud manuell hochladen)');
}

function openModal(src) {
    var modal = document.getElementById('imageModal');
    modal.style.display = 'flex';
    document.getElementById('modalImage').src = src;
}

function downloadCSV() {
    var headers = ["ID","Coin_Name","Metal_Type","Denomination","Country","Mint","Face_Value","Total_Weight_g","Fine_Weight_oz","Fineness","Diameter_mm","Thickness_mm","Edge","Magnetism","Years_Issued","Description","Notes","Created_Date","Modified_Date","Front_Image_Path","Back_Image_Path"];
    var rows = coins.map(function(c) {
        return headers.map(function(h) { return '"' + (c[h] || '').replace(/"/g, '""') + '"'; }).join(',');
    });
    var csv = headers.join(',') + '\n' + rows.join('\n');

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'katalog.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function displayCoins(list) {
    var container = document.getElementById('coinList');
    container.innerHTML = '';

    list.forEach(function(coin, idx) {
        var card = document.createElement('div');
        card.className = 'coin-card';

        var h3 = document.createElement('h3');
        h3.textContent = '#' + coin.ID + ' – ' + coin.Coin_Name + ' (' + coin.Denomination + ')';
        card.appendChild(h3);

        var p1 = document.createElement('p');
        p1.innerHTML = '<strong>' + coin.Metal_Type + '</strong> • ' + coin.Country + ' • ' + (coin.Face_Value || 'kein Nennwert');
        card.appendChild(p1);

        var p2 = document.createElement('p');
        p2.textContent = 'Gewicht: ' + coin.Total_Weight_g + ' g | Feingewicht: ' + coin.Fine_Weight_oz + ' oz | Feingehalt: ' + coin.Fineness;
        card.appendChild(p2);

        var p3 = document.createElement('p');
        p3.textContent = 'Ø ' + coin.Diameter_mm + ' mm × ' + coin.Thickness_mm + ' mm | Rand: ' + coin.Edge + ' | Magnetismus: ' + coin.Magnetism;
        card.appendChild(p3);

        var p4 = document.createElement('p');
        p4.textContent = 'Jahrgänge: ' + coin.Years_Issued;
        card.appendChild(p4);

        var p5 = document.createElement('p');
        p5.textContent = coin.Description;
        card.appendChild(p5);

        if (coin.Notes) {
            var p6 = document.createElement('p');
            p6.innerHTML = '<em>' + coin.Notes + '</em>';
            card.appendChild(p6);
        }

        var imagesDiv = document.createElement('div');
        imagesDiv.className = 'images';

        if (coin.Front_Image_Path) {
            var frontImg = document.createElement('img');
            frontImg.src = coin.Front_Image_Path;
            frontImg.className = 'coin-thumb';
            frontImg.onclick = function() { openModal(coin.Front_Image_Path); };
            imagesDiv.appendChild(frontImg);
        } else {
            var noFront = document.createElement('p');
            noFront.textContent = 'kein Front-Bild';
            imagesDiv.appendChild(noFront);
        }

        if (coin.Back_Image_Path) {
            var backImg = document.createElement('img');
            backImg.src = coin.Back_Image_Path;
            backImg.className = 'coin-thumb';
            backImg.onclick = function() { openModal(coin.Back_Image_Path); };
            imagesDiv.appendChild(backImg);
        } else {
            var noBack = document.createElement('p');
            noBack.textContent = 'kein Back-Bild';
            imagesDiv.appendChild(noBack);
        }
        card.appendChild(imagesDiv);

        var small = document.createElement('small');
        small.textContent = 'Erstellt: ' + coin.Created_Date + ' | Geändert: ' + coin.Modified_Date;
        card.appendChild(small);

        var br = document.createElement('br');
        card.appendChild(br);

        var editBtn = document.createElement('button');
        editBtn.textContent = 'Bearbeiten';
        editBtn.onclick = function() { editCoin(idx); };
        card.appendChild(editBtn);

        container.appendChild(card);
    });
}

// Daten laden (am Ende, nach allen Funktionen)
async function loadCSV() {
    try {
        var response = await fetch(CSV_URL + '?' + Date.now());
        if (!response.ok) {
            throw new Error("Fetch fehlgeschlagen: " + response.status);
        }
        var text = await response.text();
        
        // Parse CSV
        var lines = text.split('\n').filter(function(l) { return l.trim(); });
        var headers = lines[0].split(',');
        coins = lines.slice(1).map(function(line) {
            var vals = line.split(',');
            var obj = {};
            headers.forEach(function(h, i) { obj[h.trim()] = vals[i] ? vals[i].trim() : ''; });
            return obj;
        });
        
        // Speichere in LocalStorage
        localStorage.setItem('coinsData', JSON.stringify(coins));
        localStorage.setItem('lastSyncDate', new Date().toISOString());
        displayCoins(coins);
    } catch (error) {
        // Offline-Fallback: Lade aus LocalStorage
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    var storedData = localStorage.getItem('coinsData');
    if (storedData) {
        coins = JSON.parse(storedData);
        displayCoins(coins);
        var lastSync = localStorage.getItem('lastSyncDate') || 'unbekannt';
        alert("Offline-Modus: Daten aus Cache geladen (letzter Sync: " + lastSync + ")");
    } else {
        alert("Keine Daten verfügbar – verbinde dich mit Internet für Initial-Laden.");
    }
}

// Start
loadCSV();
