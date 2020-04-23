from flask import Flask, render_template
from flask_talisman import Talisman

app = Flask(__name__, static_url_path='',
            static_folder='../client/build',
            template_folder='../client/build')
csp = {
    'default-src': [
        '*'
    ]
}
Talisman(app, content_security_policy=csp)

@app.route("/")
def entrypoint():
    return render_template("index.html")