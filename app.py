import os
import logging
from flask import Flask, render_template

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")


@app.route('/')
def index():
    """Render the main page of the sugar level tracking application"""
    return render_template('index.html')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)