from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/timeline")
def api_timeline():
    path = os.path.join(app.static_folder, "timeline_data.json")
    with open(path) as f:
        data = json.load(f)
    return jsonify(data)

@app.route("/api/claims")
def claims():
    with open("static/claims.json", "r") as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True, port=8000)