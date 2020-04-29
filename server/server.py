from flask import Flask, render_template, jsonify, Response, request
from google.oauth2 import id_token
from google.auth.transport import requests
from functools import wraps
from flask_cors import CORS
from flask_talisman import Talisman

CLIENT_ID="360927771611-5re4vbbs7ba6envdordshh9fnj31uldf.apps.googleusercontent.com"

app = Flask(__name__, static_url_path='',
            static_folder='../client/build',
            template_folder='../client/build')
Talisman(app, content_security_policy=None)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

latest_id = 2
lobbies = {
    "lobbies": [
        {
            "id": "id1",
            "name": "Lobby 1",
            "players": [
                {
                    "name": "nameA",
                    "elo": 500,
                },
                {
                    "name": "nameB",
                    "elo": 500,
                },
                {
                    "name": "nameC",
                    "elo": 500,
                },
                {
                    "name": "nameD",
                    "elo": 500,
                }
            ],
            "created": 1
        },
        {
            "id": "id2",
            "name": "Lobby 2",
            "players": [
                {
                    "name": "nameA2",
                    "elo": 500,
                },
                {
                    "name": "nameB2",
                    "elo": 500,
                },
                {
                    "name": "nameC2",
                    "elo": 500,
                },
                {
                    "name": "nameD2",
                    "elo": 500,
                }
            ],
            "created": 2
        }
    ]
}

def require_api_token(func):
    @wraps(func)
    def check_token(*args, **kwargs):
        header = request.headers.get('Authorization')
        if not header:
            return Response("Access denied")

        try:
            idinfo = id_token.verify_oauth2_token(header[7:], requests.Request(), CLIENT_ID)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
        except ValueError as e:
            # If it isn't return our access denied message (you can also return a redirect or render_template)
            return str(e), 401
        return func(*args, **kwargs, user=idinfo["email"])
    return check_token

@app.route("/")
def entrypoint():
    return render_template("index.html")

@app.route("/api/load")
@require_api_token
def load(user):
    return jsonify(lobbies)

@app.route("/api/add")
@require_api_token
def add(user):
    latest_id = latest_id + 1
    new = {
        "id": "id%s" % latest_id,
        "players": [
            {
                "name": "nameA%s" % latest_id,
                "elo": 500,
            },
            {
                "name": "nameB%s" % latest_id,
                "elo": 500,
            },
            {
                "name": "nameC%s" % latest_id,
                "elo": 500,
            },
            {
                "name": "nameD%s" % latest_id,
                "elo": 500,
            }
        ],
        "created": 2
    }
    return jsonify(new)
