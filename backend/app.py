
from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from pathlib import Path

app = Flask(__name__)
CORS(app)

DB_PATH = Path(__file__).parent / "kampus.db"


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                website TEXT NOT NULL
            )
        """)


@app.route("/")
def home():
    return jsonify({
        "message": "Kampus.VC backend is running!"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend is working"
    })


@app.route("/api/brand", methods=["POST"])
def register_brand():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    website = data.get("website", "").strip()

    if not name or not website:
        return jsonify({
            "error": "Brand name and website are required"
        }), 400

    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute(
            "INSERT INTO brands (name, website) VALUES (?, ?)",
            (name, website)
        )
        brand_id = cursor.lastrowid

    return jsonify({
        "message": "Brand registered successfully",
        "brand": {
            "id": brand_id,
            "name": name,
            "website": website
        }
    }), 201


@app.route("/api/brand", methods=["GET"])
def get_brands():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, name, website FROM brands ORDER BY id DESC"
        ).fetchall()

    brands = [dict(row) for row in rows]

    return jsonify({"brands": brands})


if __name__ == "__main__":
    init_db()
    app.run(host="127.0.0.1", port=5000, debug=True)
