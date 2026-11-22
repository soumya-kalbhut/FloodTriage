const API = "http://10.37.13.201:5000";

// User details
let latitude = null;
let longitude = null;

// Check backend connection
async function checkConnection() {
    const text = document.getElementById("connectionText");
    const dot = document.getElementById("connectionDot");

    try {
        const response = await fetch(API + "/");

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        if (text) text.textContent = "Rescue centre connected";
        if (dot) dot.style.background = "#22c55e";

    } catch (error) {
        if (text) text.textContent = "Gateway unavailable";
        if (dot) dot.style.background = "#ef4444";

        console.error("Connection error:", error);
    }
}

// Get GPS location
document.getElementById("locationButton").addEventListener("click", () => {
    const status = document.getElementById("locationStatus");

    if (!navigator.geolocation) {
        status.textContent = "GPS is not supported by this browser.";
        return;
    }

    status.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            status.textContent =
                "Location captured successfully.";

            console.log("GPS:", latitude, longitude);
        },
        (error) => {
            status.textContent =
                "Unable to get location. Please try again.";

            console.error("GPS error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
});

// Submit emergency report
document.getElementById("submitButton").addEventListener("click", async () => {
    const message = document.getElementById("message").value.trim();
    const status = document.getElementById("submissionStatus");
    const button = document.getElementById("submitButton");

    if (!message) {
        status.textContent = "Please describe your emergency.";
        return;
    }

    button.disabled = true;
    status.textContent = "Sending emergency report...";

    try {
        const response = await fetch(API + "/api/reports", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "Anonymous",
                message: message,
                latitude: latitude,
                longitude: longitude,
                location: ""
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Submission failed");
        }

        status.textContent =
            "Report received successfully! ID: " + result.id;

        document.getElementById("message").value = "";

    } catch (error) {
        status.textContent =
            "Report could not be delivered. Please try again.";

        console.error("Submission error:", error);

    } finally {
        button.disabled = false;
    }
});

// Start connection monitoring
checkConnection();
setInterval(checkConnection, 5000);