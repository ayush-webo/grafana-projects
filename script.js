// Fetch Cryptocurrency Data
async function fetchCryptoData() {
    try {
        let response = await fetch("http://localhost:9090/api/v1/query?query=coin_market_price_usd{}");
        let data = await response.json();
        let cryptos = data.data.result.slice(0, 20); // Get top 20 cryptos

        let tableBody = document.querySelector("#cryptoTable tbody");
        tableBody.innerHTML = ""; // Clear previous data

        for (let crypto of cryptos) {
            let name = crypto.metric.name || "N/A";
            let symbol = crypto.metric.symbol || "N/A";
            let price = parseFloat(crypto.value[1]).toFixed(2);

            // Fetch Market Cap
            let marketCapResponse = await fetch(`http://localhost:9090/api/v1/query?query=coin_market_market_cap_usd{name="${name}"}`);
            let marketCapData = await marketCapResponse.json();
            let marketCap = marketCapData.data.result[0] ? parseFloat(marketCapData.data.result[0].value[1]).toFixed(2) : "N/A";

            // Fetch 24h Volume
            let volumeResponse = await fetch(`http://localhost:9090/api/v1/query?query=coin_market_volume_24h_usd{name="${name}"}`);
            let volumeData = await volumeResponse.json();
            let volume = volumeData.data.result[0] ? parseFloat(volumeData.data.result[0].value[1]).toFixed(2) : "N/A";

            // Append data to table
            let row = `
                <tr>
                    <td>${name}</td>
                    <td>${symbol}</td>
                    <td>$${price}</td>
                    <td>$${marketCap}</td>
                    <td>$${volume}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }

        document.getElementById("loading").style.display = "none"; // Hide loading text

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("loading").innerText = "Error fetching data!";
    }
}

// Fetch data every 15 seconds
fetchCryptoData();
setInterval(fetchCryptoData, 15000);


// Search & Filter Cryptocurrency List
let cryptoNames = [];

async function fetchCryptoNames() {
    try {
        let response = await fetch("http://localhost:9090/api/v1/series?match[]=coin_market_price_usd{}");
        let data = await response.json();
        
        cryptoNames = [...new Set(data.data.map(item => item.name))];
    } catch (error) {
        console.error("Error fetching crypto names:", error);
    }
}

async function initialize() {
    await fetchCryptoNames();
}

function filterCryptos() {
    let searchInput = document.getElementById("cryptoSearch").value.toLowerCase();
    let cryptoList = document.getElementById("cryptoList");

    cryptoList.innerHTML = "";

    if (searchInput === "") {
        cryptoList.style.display = "none";
        return;
    }

    let filteredCryptos = cryptoNames.filter(crypto => crypto.toLowerCase().includes(searchInput));

    filteredCryptos.forEach(crypto => {
        let div = document.createElement("div");
        div.className = "crypto-option";
        div.innerText = crypto;
        div.onclick = function() { selectCrypto(crypto); };
        cryptoList.appendChild(div);
    });

    cryptoList.style.display = "block";
}

function selectCrypto(selectedCrypto) {
    document.getElementById("cryptoSearch").value = selectedCrypto;
    document.getElementById("cryptoList").style.display = "none";

    let grafanaFrame = document.getElementById("grafanaFrame");
    
    // Embed the selected panel only
    grafanaFrame.src = `http://localhost:3000/d-solo/aeh7b09m5xtdsf/coinmarketcap-single?orgId=1&refresh=15m&var-name=${selectedCrypto}&panelId=8`;
}

document.addEventListener("click", function(event) {
    if (!event.target.matches("#cryptoSearch")) {
        document.getElementById("cryptoList").style.display = "none";
    }
});

initialize();
