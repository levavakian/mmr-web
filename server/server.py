from flask import Flask, render_template
from flask_talisman import Talisman

app = Flask(__name__, static_url_path='',
            static_folder='../client/build',
            template_folder='../client/build')
csp = {
    'default-src': [
        'unsafe-inline',
        'self',
    ],
    'media-src': [
        'unsafe-inline',
        '*',
    ],
    'img-src': [
        'unsafe-inline',
        '*',
    ],
    'font-src': [
        'unsafe-inline',
        '*',
    ],
    'style-src': [
        'unsafe-inline',
        '*',
    ],
    'script-src': [
        'unsafe-inline',
        '*'
    ],
    'manifest-src': [
        'unsafe-inline',
        '*'
    ],

}
Talisman(app, content_security_policy=csp)

@app.route("/")
def entrypoint():
    return render_template("index.html")