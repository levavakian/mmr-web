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
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
Talisman(app, content_security_policy=None)

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
    print (user)
    print("running load")
    return jsonify({"a": "hello"})