# 🌊 FloodTriage
### From Emergency Reporting to Informed Response

FloodTriage is a flood emergency reporting and rescue coordination system designed to connect people affected by floods with emergency response teams.

The platform provides a simple interface for submitting emergency reports and a centralized operator dashboard to monitor incidents, classify risks and visualize reported locations.

## 🚨 Key Features

- Emergency reporting through a simple user interface.
- GPS-based location sharing.
- Bilingual (English and Hindi) rule-based risk classification.
- HIGH, REVIEW and LOW risk categories.
- Centralized operator dashboard.
- Interactive geographical map.
- Report-based Flood Severity and Rescue Priority indicators.
- Emergency report management.

## 📁 Project Structure

All project files are currently placed directly in the main GitHub repository. They are logically divided into three components:

```text
FloodTriage/
│
├── app.py
├── reports.db
├── requirement.txt
│
├── index.html
├── style.css
├── user.js
│
├── index1.html
├── operator.js
└── style1.css
```

### 1. Backend Files

These files handle the server-side operations and report management.

| File | Purpose |
|---|---|
| `app.py` | Main Python Flask backend. Handles API requests, receives emergency reports and manages database operations. |
| `reports.db` | SQLite database used to store submitted emergency reports. |
| `requirement.txt` | Contains the Python dependencies required to run the backend. |

### 2. User Interface Files

These files form the victim-side emergency reporting interface.

| File | Purpose |
|---|---|
| `index.html` | Main webpage through which users access the emergency reporting interface. |
| `style.css` | Controls the appearance, layout and styling of the user interface. |
| `user.js` | Handles user-side functionality, including API communication, location sharing and report submission. |

### 3. Operator Dashboard Files

These files form the emergency monitoring and operator interface.

| File | Purpose |
|---|---|
| `index1.html` | Main webpage for the emergency operator dashboard. |
| `operator.js` | Handles incoming reports, risk filters, map markers, severity indicators and report management. |
| `style1.css` | Controls the layout and visual appearance of the operator dashboard. |

## ⚙️ Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Python, Flask
- **Database:** SQLite
- **Mapping:** Leaflet.js, OpenStreetMap
- **Satellite Imagery Layer:** NASA GIBS

## 🔄 How FloodTriage Works

1. A person submits an emergency report through the user interface.
2. The report, along with available geographical information, is sent to the Flask backend.
3. The backend stores the report and applies predefined rule-based classification.
4. The operator dashboard retrieves and displays incoming reports.
5. Operators can examine risk categories, geographical locations and report-based severity indicators.

## 🚀 Running the Project Locally

### Prerequisites

- Python 3
- Visual Studio Code
- A modern web browser

### Step 1: Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd FloodTriage
```

### Step 2: Install Dependencies

```bash
pip install -r requirement.txt
```

### Step 3: Start the Backend

```bash
python app.py
```

The backend is configured to run on port 5000.

### Step 4: Open the User Interface

Open `index.html` using Visual Studio Code Live Server.

### Step 5: Open the Operator Dashboard

Open `index1.html` using Live Server.

Ensure that the API address configured in `user.js` and `operator.js` points to the computer running the backend.

## ⚠️ Important Notes

- Risk classification is based on predefined keywords and rules, not artificial intelligence.
- Flood Severity and Rescue Priority are prototype indicators calculated from submitted reports.
- These indicators do not represent directly measured floodwater depth or verified flood boundaries.
- External map and satellite imagery services require internet connectivity.
- Satellite communication and fully offline operation are future deployment considerations.
- The prototype is intended to support emergency information management and does not replace official emergency services.

## 🔮 Future Scope

- Satellite-based communication integration.
- Offline-first emergency reporting.
- Voice-based reporting in regional languages.
- Integration with verified flood-monitoring datasets.
- Rescue team assignment and coordination.
- Secure operator authentication.
- Improved real-time emergency monitoring.

## 👥 Team

**Project:** FloodTriage  
**Team Size:** 3 Members  
**Domain:** Disaster Management and Emergency Response Technology

## Our Vision

To make emergency information more structured, accessible and actionable during flood disasters.

**FloodTriage — From Emergency Reporting to Informed Response.**
