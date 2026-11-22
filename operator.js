// ======================================================
// FLOODTRIAGE - OPERATOR DASHBOARD
// Satellite Map + Emergency Reports + Risk Assessment
// ======================================================

// CHANGE THIS IP ONLY IF LAPTOP 2'S IPv4 ADDRESS CHANGES
const API = "https://floodtriage.onrender.com";


// ======================================================
// 1. MAP INITIALIZATION
// ======================================================

let incidentMap = L.map("incidentMap").setView(
    [23.3897, 76.7121],
    12
);

// Street map
let streetMap = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19
    }
);

// Satellite imagery
let satelliteMap = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19
    }
);

// NASA VIIRS flood observations
let nasaFloodLayer = L.tileLayer(
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Combined_Flood_1-Day/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
    {
        attribution: "Flood data: NASA LANCE VIIRS / NASA GIBS",
        opacity: 0.75,
        maxNativeZoom: 9,
        maxZoom: 19
    }
);

// Satellite map as default
satelliteMap.addTo(incidentMap);

// Emergency report markers
let markerLayer = L.layerGroup().addTo(incidentMap);

// Flood severity circles
let severityLayer = L.layerGroup().addTo(incidentMap);


// ======================================================
// 2. MAP CONTROLS
// ======================================================

let baseMaps = {
    "Satellite Imagery": satelliteMap,
    "Street Map": streetMap
};

let overlayMaps = {
    "NASA Flood Observations": nasaFloodLayer,
    "Flood Severity Zones": severityLayer
};

L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
}).addTo(incidentMap);

L.control.scale().addTo(incidentMap);


// NASA information panel
let floodInfo = L.control({
    position: "bottomleft"
});

floodInfo.onAdd = function () {

    let div = L.DomUtil.create("div", "leaflet-control-attribution");

    div.style.background = "white";
    div.style.padding = "7px";
    div.style.color = "#222";

    div.innerHTML =
        "<b>NASA VIIRS Flood Monitoring</b><br>" +
        "Satellite observations<br>" +
        "Not a live ground sensor";

    return div;
};

floodInfo.addTo(incidentMap);


// ======================================================
// 3. REPORT VARIABLES
// ======================================================

let allReports = [];
let currentFilter = "ALL";
let hasInitialMapFit = false;

const reportList = document.getElementById("reportList");


// ======================================================
// 4. SAFE TEXT AND DATE FUNCTIONS
// ======================================================

function safeText(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

}


function formatDate(value) {

    if (!value) return "Time unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Time unavailable";
    }

    return date.toLocaleString();

}


// ======================================================
// 5. LOAD REPORTS FROM BACKEND
// ======================================================

async function loadReports() {

    try {

        const response = await fetch(API + "/api/reports");

        if (!response.ok) {
            throw new Error("Backend error");
        }

        const reports = await response.json();

        allReports = reports;

        document.getElementById("connectionText").textContent =
            "Rescue centre connected";

        document.getElementById("connectionDot").style.background =
            "#22c55e";

        updateDashboard();
        updateMap();
        updateSeveritySystem();

        document.getElementById("lastUpdated").textContent =
            "Last updated: " + new Date().toLocaleTimeString();

    } catch (error) {

        document.getElementById("connectionText").textContent =
            "Gateway unavailable";

        document.getElementById("connectionDot").style.background =
            "#ef4444";

        console.error("Report loading error:", error);

    }

}


// ======================================================
// 6. OPERATOR DASHBOARD
// ======================================================

function updateDashboard() {

    const high = allReports.filter(
        r => r.priority === "HIGH"
    ).length;

    const review = allReports.filter(
        r => r.priority === "REVIEW"
    ).length;

    const low = allReports.filter(
        r => r.priority === "LOW"
    ).length;

    document.getElementById("lowCount").textContent = low;

    document.getElementById("totalCount").textContent =
        allReports.length;

    document.getElementById("highCount").textContent = high;

    document.getElementById("reviewCount").textContent = review;


    const filtered = currentFilter === "ALL"
        ? allReports
        : allReports.filter(
            r => r.priority === currentFilter
        );


    if (filtered.length === 0) {

        reportList.innerHTML =
            '<div class="empty">No reports in this category.</div>';

        return;

    }


    reportList.innerHTML = filtered.map(report => `

        <article class="report">

            <div class="report-top">

                <div class="report-name">
                    ${safeText(report.name || "Anonymous")}
                </div>

                <span class="priority ${safeText(report.priority)}">
                    ${safeText(report.priority)}
                </span>

            </div>


            <div class="report-message">
                ${safeText(report.message)}
            </div>


            <div class="report-meta">

                Risk code: ${safeText(report.risk_code || "R01")}<br>

                Report ID: ${safeText(report.id)}<br>

                Status: ${safeText(report.status)}<br>

                Location: ${
                    report.latitude != null &&
                    report.longitude != null
                    ? safeText(report.latitude) + ", " +
                      safeText(report.longitude)
                    : "Location not provided"
                }<br>

                Received: ${safeText(formatDate(report.created_at))}

            </div>


            <button class="remove-report"
                    data-id="${safeText(report.id)}">

                Remove report

            </button>

        </article>

    `).join("");

}


// ======================================================
// 7. REPORT FILTERS
// ======================================================

document.querySelectorAll(".filter").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        updateDashboard();

    });

});


// ======================================================
// 8. REMOVE REPORT
// ======================================================

reportList.addEventListener("click", async (event) => {

    const button = event.target.closest(".remove-report");

    if (!button) return;

    const reportId = button.dataset.id;

    if (!confirm("Permanently remove this report?")) return;

    try {

        const response = await fetch(
            API + "/api/reports/" + encodeURIComponent(reportId),
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Deletion failed");
        }

        await loadReports();

    } catch (error) {

        alert(error.message);

    }

});


// Manual refresh button
document.getElementById("refreshButton").onclick = loadReports;


// ======================================================
// 9. EMERGENCY REPORT MAP
// ======================================================

function updateMap() {

    markerLayer.clearLayers();

    const locatedReports = allReports.filter(report => {

        const lat = Number(report.latitude);
        const lng = Number(report.longitude);

        return report.latitude != null &&
               report.longitude != null &&
               Number.isFinite(lat) &&
               Number.isFinite(lng) &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;

    });


    locatedReports.forEach(report => {

        const marker = L.marker([
            Number(report.latitude),
            Number(report.longitude)
        ]);

        marker.bindPopup(`

            <b>${safeText(report.name || "Anonymous")}</b><br>

            Priority: ${safeText(report.priority)}<br>

            ${safeText(report.message)}

        `);

        marker.addTo(markerLayer);

    });


    // Automatically zoom to reports only on the first
    // successful location load, not every 3 seconds.

    if (locatedReports.length > 0 && !hasInitialMapFit) {

        const bounds = L.latLngBounds(
            locatedReports.map(report => [
                Number(report.latitude),
                Number(report.longitude)
            ])
        );

        incidentMap.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15
        });

        hasInitialMapFit = true;

    }

}


// ======================================================
// 10. FLOOD SEVERITY KEYWORDS
// ENGLISH + HINDI
// ======================================================

const WATER_SIGNALS = [

    "flood",
    "flooded",
    "waterlogging",
    "water logging",
    "water level rising",
    "water entered",
    "submerged",
    "water rising",
    "heavy water",
    "जलभराव",
    "पानी भर गया",
    "बाढ़",
    "पानी बढ़ रहा",
    "सड़क पर पानी",
    "घर में पानी",
    "पानी घुस गया",
    "बाढ़ का पानी"

];


const CRITICAL_SIGNALS = [

    "trapped",
    "drowning",
    "drowned",
    "stranded",
    "missing",
    "unconscious",
    "injured",
    "cannot escape",
    "can't escape",
    "need rescue",
    "immediate rescue",
    "breathing problem",
    "child trapped",
    "elderly trapped",
    "बचाओ",
    "फंसे",
    "फंसा",
    "डूब रहा",
    "डूब रही",
    "लापता",
    "बेहोश",
    "घायल",
    "सांस लेने में दिक्कत",
    "मदद चाहिए",
    "बाहर नहीं निकल पा रहे",
    "बच्चा फंसा",
    "बुजुर्ग फंसे"

];


// ======================================================
// 11. KEYWORD DETECTION
// ======================================================

function countSignals(message, words) {

    const text = String(message || "").toLowerCase();

    return words.some(word =>
        text.includes(word.toLowerCase())
    ) ? 1 : 0;

}


// ======================================================
// 12. RISK CATEGORY AND COLOURS
// ======================================================

function getSeverityCategory(score) {

    if (score >= 75) return "CRITICAL";

    if (score >= 50) return "HIGH";

    if (score >= 25) return "MODERATE";

    return "LOW";

}


function getSeverityColor(score) {

    if (score >= 75) return "#dc2626";

    if (score >= 50) return "#f97316";

    if (score >= 25) return "#eab308";

    return "#16a34a";

}


// ======================================================
// 13. FLOOD RISK ASSESSMENT PANEL
// ======================================================

let severityPanel = L.control({
    position: "topleft"
});

severityPanel.onAdd = function () {

    let div = L.DomUtil.create("div", "severity-panel");

    div.style.background = "white";
    div.style.padding = "12px";
    div.style.borderRadius = "8px";
    div.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
    div.style.width = "235px";
    div.style.fontSize = "12px";
    div.style.lineHeight = "1.6";
    div.style.color = "#222";

    div.innerHTML = `

        <div style="font-size:15px;font-weight:bold;margin-bottom:8px;">

            FLOODTRIAGE RISK ASSESSMENT

        </div>

        <div id="severitySummary">

            Waiting for emergency reports...

        </div>

        <hr>

        <b>FLOOD SEVERITY</b><br>

        <span style="color:#dc2626;">●</span> Critical (75–100)<br>

        <span style="color:#f97316;">●</span> High (50–74)<br>

        <span style="color:#eab308;">●</span> Moderate (25–49)<br>

        <span style="color:#16a34a;">●</span> Low (0–24)<br>

        <hr>

        <b>Two separate indicators</b><br>

        Flood Severity: Report-based area risk<br>

        Rescue Priority: Report-based urgency

        <hr>

        <small style="color:#666;">

            Prototype estimates from submitted reports.
            Not measured water depth or an official warning.

        </small>

    `;

    L.DomEvent.disableClickPropagation(div);

    return div;

};

severityPanel.addTo(incidentMap);


// ======================================================
// 14. FLOOD SEVERITY + RESCUE PRIORITY ENGINE
// ======================================================

function updateSeveritySystem() {

    severityLayer.clearLayers();


    // Group GPS reports into approximate 1 km cells.

    const cells = {};

    const CELL_LAT = 0.01;

    const CELL_LNG = 0.011;


    const locatedReports = allReports.filter(report => {

        const lat = Number(report.latitude);
        const lng = Number(report.longitude);

        return report.latitude != null &&
               report.longitude != null &&
               Number.isFinite(lat) &&
               Number.isFinite(lng) &&
               lat >= -90 && lat <= 90 &&
               lng >= -180 && lng <= 180;

    });


    // Group reports by geographical cell.

    locatedReports.forEach(report => {

        const lat = Number(report.latitude);
        const lng = Number(report.longitude);

        const gridLat = Math.floor(lat / CELL_LAT);
        const gridLng = Math.floor(lng / CELL_LNG);

        const key = gridLat + "_" + gridLng;


        if (!cells[key]) {

            cells[key] = {
                reports: [],
                lat: (gridLat + 0.5) * CELL_LAT,
                lng: (gridLng + 0.5) * CELL_LNG
            };

        }

        cells[key].reports.push(report);

    });


    let highestFloodScore = 0;
    let highestRescueScore = 0;

    const cellKeys = Object.keys(cells);


    // ==================================================
    // CALCULATE EACH AREA
    // ==================================================

    cellKeys.forEach(key => {

        const cell = cells[key];

        const reports = cell.reports;


        const high = reports.filter(
            r => r.priority === "HIGH"
        ).length;

        const review = reports.filter(
            r => r.priority === "REVIEW"
        ).length;

        const low = reports.filter(
            r => r.priority === "LOW"
        ).length;


        let waterSignals = 0;
        let criticalSignals = 0;


        reports.forEach(report => {

            waterSignals += countSignals(
                report.message,
                WATER_SIGNALS
            );

            criticalSignals += countSignals(
                report.message,
                CRITICAL_SIGNALS
            );

        });


        // ----------------------------------------------
        // REPORT TREND
        // ----------------------------------------------

        const now = Date.now();

        let recent = 0;
        let previous = 0;


        reports.forEach(report => {

            const time = new Date(report.created_at).getTime();

            if (!Number.isFinite(time)) return;

            const ageMinutes = (now - time) / 60000;

            if (ageMinutes >= 0 && ageMinutes <= 60) {

                recent++;

            } else if (
                ageMinutes > 60 &&
                ageMinutes <= 120
            ) {

                previous++;

            }

        });


        // ----------------------------------------------
        // FLOOD SEVERITY INDEX
        // ----------------------------------------------

        const volumeScore = Math.min(
            25,
            reports.length * 5
        );

        const highScore = Math.min(
            30,
            high * 10
        );

        const waterScore = Math.min(
            20,
            waterSignals * 5
        );


        let trendScore = 0;

        if (recent >= 2 && recent > previous) {

            trendScore = Math.min(
                25,
                10 + (recent - previous) * 5
            );

        } else if (recent >= 2) {

            trendScore = 10;

        } else if (recent === 1) {

            trendScore = 5;

        }


        const floodScore = Math.min(
            100,
            volumeScore +
            highScore +
            waterScore +
            trendScore
        );


        // ----------------------------------------------
        // RESCUE PRIORITY INDEX
        // ----------------------------------------------

        const rescueScore = Math.min(
            100,

            Math.min(54, high * 18) +

            Math.min(24, review * 8) +

            Math.min(9, low * 3) +

            Math.min(21, criticalSignals * 7)

        );


        highestFloodScore = Math.max(
            highestFloodScore,
            floodScore
        );

        highestRescueScore = Math.max(
            highestRescueScore,
            rescueScore
        );


        // ----------------------------------------------
        // DRAW COLOURED SEVERITY ZONE
        // ----------------------------------------------

        const color = getSeverityColor(floodScore);

        const category = getSeverityCategory(floodScore);


        const circle = L.circle(
            [cell.lat, cell.lng],
            {
                radius: 500,
                color: color,
                fillColor: color,
                fillOpacity: 0.20,
                weight: 2
            }
        );


        circle.bindPopup(`

            <div style="min-width:210px;">

                <h3 style="margin:0 0 8px;">

                    AREA RISK ASSESSMENT

                </h3>

                <b>Flood Severity Index:</b>

                <span style="color:${color};font-weight:bold;">

                    ${floodScore}/100

                </span>

                <br>

                <b>Category:</b> ${category}

                <hr>

                <b>Rescue Priority Index:</b>

                ${rescueScore}/100

                <hr>

                <b>Reports in area:</b> ${reports.length}<br>

                HIGH reports: ${high}<br>

                REVIEW reports: ${review}<br>

                LOW reports: ${low}<br>

                Water signals: ${waterSignals}<br>

                Critical danger signals: ${criticalSignals}<br>

                Recent reports (60 min): ${recent}

                <hr>

                <small>

                    Approximate report cluster.
                    Not a measured flood boundary or water depth.

                </small>

            </div>

        `);


        circle.addTo(severityLayer);

    });


    // ==================================================
    // 15. UPDATE RISK SUMMARY PANEL
    // ==================================================

    const summary = document.getElementById("severitySummary");

    if (!summary) return;


    if (cellKeys.length === 0) {

        summary.innerHTML = `

            <b>No GPS-tagged reports yet.</b><br>

            Risk cannot be determined until reports
            with location data are received.

        `;

        return;

    }


    summary.innerHTML = `

        <b>Assessment areas:</b> ${cellKeys.length}<br>

        <b>GPS reports:</b> ${locatedReports.length}<br>

        <hr>

        <b>Highest Flood Severity:</b><br>

        <span style="font-size:20px;font-weight:bold;color:${getSeverityColor(highestFloodScore)};">

            ${highestFloodScore}/100

        </span>

        <br>

        ${getSeverityCategory(highestFloodScore)}

        <hr>

        <b>Highest Rescue Priority:</b><br>

        <span style="font-size:20px;font-weight:bold;color:#dc2626;">

            ${highestRescueScore}/100

        </span>

        <hr>

        <small>

            Automatically recalculated from incoming reports.

        </small>

    `;

}


// ======================================================
// 16. START FLOODTRIAGE
// ======================================================

// Initial data load
loadReports();

// Automatically refresh every 3 seconds
setInterval(loadReports, 3000);
