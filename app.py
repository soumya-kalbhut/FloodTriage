
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import re
import uuid
from datetime import datetime

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/": {"origins": "*"}
})

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, "reports.db")


def connect():
    return sqlite3.connect(DB)


def setup():
    con = connect()

    con.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            name TEXT,
            message TEXT,
            location TEXT,
            latitude REAL,
            longitude REAL,
            priority TEXT,
            status TEXT,
            created_at TEXT
        )
    """)

    # Add risk_code to an existing database if necessary
    columns = [
        row[1] for row in
        con.execute("PRAGMA table_info(reports)").fetchall()
    ]

    if "risk_code" not in columns:
        con.execute(
            "ALTER TABLE reports ADD COLUMN risk_code TEXT DEFAULT 'R01'"
        )

    con.commit()
    con.close()


HIGH_PHRASES = [
    # English
    "trapped", "stuck on roof", "stranded on roof",
    "drowning", "swept away", "people missing",
    "child missing", "person missing", "cannot escape",
    "can't escape", "need immediate rescue",
    "injured", "unconscious", "breathing problem",
    "elderly trapped", "pregnant woman trapped",
    "घर में फंसे", "लोग फंसे", "छत पर फंसे",
    "डूब रहा", "डूब रही", "डूब रहे",
    "बह गया", "लापता", "बचाओ",
    "तुरंत बचाओ", "तुरंत मदद", "बाहर नहीं निकल पा रहे",
    "घायल", "बेहोश", "सांस लेने में दिक्कत",
    "बच्चा लापता", "बुजुर्ग फंसे"
]

LOW_PHRASES = [
    # English
    "waterlogging", "water logging",
    "road flooded", "street flooded",
    "water entered the street",
    "water outside my house",
    "water level rising", "crop damaged",
    "road blocked", "house damaged",
    "सड़क पर पानी", "गली में पानी",
    "जलभराव", "पानी भर गया",
    "फसल खराब", "रास्ता बंद",
    "घर के बाहर पानी", "पानी का स्तर बढ़ रहा"
]


def classify_report(message):
    text = message.lower().strip()

    # Obvious empty/noise-only submissions
    compact = re.sub(r"[\W_]+", "", text)

    if (
        len(compact) < 3
        or compact.isdigit()
        or (len(set(compact)) == 1 and len(compact) >= 3)
    ):
        return "FLAGGED", "F01"

    # Life-threatening reports get highest priority
    if any(phrase in text for phrase in HIGH_PHRASES):
        return "HIGH", "H01"

    # Non-immediate flood impact
    if any(phrase in text for phrase in LOW_PHRASES):
        return "LOW", "L01"

    # Unknown or unclear reports are never discarded
    return "REVIEW", "R01"


@app.route("/")
def home():
    return jsonify({
        "system": "FloodTriage",
        "status": "Online"
    })


@app.route("/api/reports", methods=["POST"])
def receive_report():
    data = request.get_json(silent=True) or {}

    message = data.get("message", "").strip()

    if not message:
        return jsonify({
            "error": "Emergency description required"
        }), 400

    report_id = str(uuid.uuid4())

    priority, risk_code = classify_report(message)

    con = connect()

    con.execute("""
        INSERT INTO reports (
            id, name, message, location,
            latitude, longitude, priority,
            status, created_at, risk_code
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_id,
        data.get("name", "Anonymous"),
        message,
        data.get("location", ""),
        data.get("latitude"),
        data.get("longitude"),
        priority,
        "RECEIVED",
        datetime.now().isoformat(),
        risk_code
    ))

    con.commit()
    con.close()

    return jsonify({
        "success": True,
        "id": report_id,
        "priority": priority,
        "risk_code": risk_code,
        "status": "RECEIVED"
    }), 201


@app.route("/api/reports", methods=["GET"])
def get_reports():
    con = connect()
    con.row_factory = sqlite3.Row

    rows = con.execute("""
        SELECT * FROM reports
        ORDER BY created_at DESC
    """).fetchall()

    con.close()

    return jsonify([dict(row) for row in rows])


@app.route("/api/reports/<report_id>", methods=["DELETE"])
def delete_report(report_id):
    con = connect()

    cursor = con.execute(
        "DELETE FROM reports WHERE id = ?",
        (report_id,)
    )

    con.commit()
    deleted = cursor.rowcount
    con.close()

    if deleted == 0:
        return jsonify({
            "error": "Report not found"
        }), 404

    return jsonify({
        "success": True,
        "message": "Report removed"
    })


if __name__ == "__main__":
    setup()
    app.run(host="0.0.0.0", port=5000, debug=False)
