from flask import Flask, render_template, jsonify, request, Response
from google.oauth2 import id_token
from google.auth.transport import requests
from functools import wraps
from flask_cors import CORS
from flask_talisman import Talisman
from uuid import uuid1
from ortools.linear_solver import pywraplp

CLIENT_ID="360927771611-5re4vbbs7ba6envdordshh9fnj31uldf.apps.googleusercontent.com"

app = Flask(__name__, static_url_path='',
            static_folder='../client/build',
            template_folder='../client/build')
Talisman(app, content_security_policy=None)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

global_user_to_lobbies = {}
global_lobbies = {}

def require_api_token(func):
    @wraps(func)
    def check_token(*args, **kwargs):
        header = request.headers.get('Authorization')
        if not header:
            return jsonify({"error": "Access denied"}), 401 

        try:
            idinfo = id_token.verify_oauth2_token(header[7:], requests.Request(), CLIENT_ID)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
        except ValueError as e:
            # If it isn't return our access denied message (you can also return a redirect or render_template)
            return Response(str(e)), 401
        return func(*args, **kwargs, user=idinfo["email"])
    return check_token

@app.route("/")
def entrypoint():
    return render_template("index.html")

@app.route("/api/load")
@require_api_token
def load(user):
    if user not in global_user_to_lobbies:
        global_user_to_lobbies[user] = []
    lobby_ids = global_user_to_lobbies[user]
    lobbies = []
    for lobby_id in lobby_ids:
        if lobby_id in global_lobbies:
            lobbies.append(global_lobbies[lobby_id])
    return jsonify({"lobbies": lobbies})

@app.route("/api/add", methods=['POST'])
@require_api_token
def add(user):
    if "name" not in request.json:
        return jsonify({"error": "No name given for lobby"}), 400
    uid = str(uuid1())
    global_lobbies[uid] = {"name": request.json["name"], "id": uid, "players": []}
    if user not in global_user_to_lobbies:
        global_user_to_lobbies[user] = []
    global_user_to_lobbies[user].append(uid)
    return jsonify(global_lobbies[uid]), 201

@app.route("/api/subscribe", methods=['POST'])
@require_api_token
def subscribe(user):
    if "id" not in request.json:
        return jsonify({"error": "No name given for lobby"}), 400
    if request.json["id"] not in global_lobbies:
        return jsonify({"error": "No lobby with given id exists"}), 400
    if user not in global_user_to_lobbies:
        global_user_to_lobbies[user] = []
    global_user_to_lobbies[user].append(request.json["id"])
    return jsonify(global_lobbies[request.json["id"]]), 201

@app.route("/api/unsubscribe", methods=['POST'])
@require_api_token
def unsubscribe(user):
    if "id" not in request.json:
        return jsonify({"error": "No name given for lobby"}), 400
    if request.json["id"] not in global_lobbies:
        return jsonify({"error": "No lobby with given id exists"}), 400
    if user not in global_user_to_lobbies:
        global_user_to_lobbies[user] = []
    global_user_to_lobbies[user] = list(filter(lambda x: x != request.json["id"], global_user_to_lobbies[user]))
    return jsonify(global_lobbies[request.json["id"]]), 201

@app.route("/api/player", methods=['POST', 'PUT', 'PATCH'])
@require_api_token
def modifyPlayer(user):
    if "lobby" not in request.json:
        return jsonify({"error": "No id given for lobby"}), 400
    if request.json["lobby"] not in global_lobbies:
        return jsonify({"error": "No lobby with given id exists"}), 400
    if "player" not in request.json:
        return jsonify({"error": "No player"}), 400
    if "name" not in request.json["player"]:
        return jsonify({"error": "No name given for player"}), 400
    if "elo" not in request.json["player"]:
        return jsonify({"error": "No elo given for player"}), 400
    if not isinstance(request.json["player"]["elo"], int):
        return jsonify({"error": "elo was not an int"}), 400
    if "existing" not in request.json["player"]:
        return jsonify({"error": "No existing elo given for player"}), 400
    if not isinstance(request.json["player"]["existing"], int):
        return jsonify({"error": "elo was not an int"}), 400

    lobby = global_lobbies[request.json["lobby"]]
    req_player = request.json["player"]
    player = next((p for p in lobby["players"] if p["name"] == req_player["name"]), None)
    if player is None:
        lobby["players"].append({"name": req_player["name"], "elo": req_player["elo"]})
    else:
        if player["elo"] != req_player["existing"]:
            return jsonify({"error": "existing elo stale, please refresh"}), 400
        player["elo"] = req_player["elo"]
    return jsonify(global_lobbies[request.json["lobby"]]), 201

@app.route("/api/player", methods=['DELETE'])
@require_api_token
def deletePlayer(user):
    if "lobby" not in request.json:
        return jsonify({"error": "No id given for lobby"}), 400
    if request.json["lobby"] not in global_lobbies:
        return jsonify({"error": "No lobby with given id exists"}), 400
    if "player" not in request.json:
        return jsonify({"error": "No player"}), 400
    if "name" not in request.json["player"]:
        return jsonify({"error": "No name given for player"}), 400

    lobby = global_lobbies[request.json["lobby"]]
    req_player = request.json["player"]
    lobby["players"] = list(filter(lambda x: x["name"] != req_player["name"], lobby["players"]))

    return jsonify(global_lobbies[request.json["lobby"]]), 202

@app.route("/api/matchmake", methods=['POST'])
def matchmake():
    solver = pywraplp.Solver('simple_mip_program',
                         pywraplp.Solver.CBC_MIXED_INTEGER_PROGRAMMING)
    def acc_elo(team):
        return sum([elos[i][1]*team[i] for i, _ in enumerate(team)])
    
    # Get how many teams to set up
    nteams = len(request.json["teams"])

    # Filter out players with no team, set up locked in groups
    players = list(filter(lambda x: x["team"] > 0, request.json["players"]))
    exclusion_groups = {}
    for player in players:
        if player["locked"]:
            if player["team"] not in exclusion_groups:
                exclusion_groups[player["team"]] = []
            exclusion_groups[player["team"]].append(player)
    player_mutual_exclusions = []
    player_mutual_inclusions = []
    if exclusion_groups:
        for group_outer in exclusion_groups.values():
            for group_inner in exclusion_groups.values():
                if group_outer[0] == group_inner[0]:
                    continue
                player_mutual_exclusions.append((group_outer[0], group_inner[0]))
            
            for elem in group_outer:
                if group_outer[0] == elem:
                    continue
                player_mutual_inclusions.append((group_outer[0], elem))

    elos = [(player, player["elo"]) for player in players]

    # Set up decision variables
    teams = [[] for _ in range(nteams)]
    for tidx, team in enumerate(teams):
        for pidx in range(len(elos)):
            dv = solver.IntVar(0, 1, f't[{tidx}]p[{pidx}]')
            team.append(dv)
    
    # A team needs at least one player
    for team in teams:
        solver.Add(sum(team) >= 1)
        solver.Add(acc_elo(team) >= 0)
    
    # Any one player can only be on one team
    for pidx in range(len(elos)):
        solver.Add(sum([team[pidx] for team in teams]) == 1)
    
    # Enforce even teams if requested and players are divisible by teams    
    even_teams = (request.json["even"] and (len(players) % nteams == 0))
    if even_teams:
        for team in teams:
            solver.Add(sum(team) == sum(teams[0]))
    
    # Apply player mutual exclusion
    for exclusion in player_mutual_exclusions:
        pid0 = [x for x, _ in enumerate(elos) if elos[x][0] == exclusion[0]][0]
        pid1 = [x for x, _ in enumerate(elos) if elos[x][0] == exclusion[1]][0]
        for team in teams:
            solver.Add(team[pid0] + team[pid1] <= 1)
    
    # Apply player mutual inclusion
    for inclusion in player_mutual_inclusions:
        pid0 = [x for x, _ in enumerate(elos) if elos[x][0] == inclusion[0]][0]
        pid1 = [x for x, _ in enumerate(elos) if elos[x][0] == inclusion[1]][0]
        for team in teams:
            solver.Add(team[pid0] - team[pid1] == 0)
    
    # Order teams by Elo
    objs = []
    for t0idx, team0 in enumerate(teams):
        for t1idx, team1 in enumerate(teams):
            if t0idx >= t1idx:
                continue
            solver.Add(acc_elo(team1) >= acc_elo(team0))
    
    # Minimize distance between team with max elo and team with mine elo
    solver.Minimize(acc_elo(teams[-1]) - acc_elo(teams[0]))

    status = solver.Solve()
    if status == pywraplp.Solver.OPTIMAL:
        # Set up the team ordering so that locked players stay in their teams
        tarr_no_order = set(request.json["teams"])
        print(tarr_no_order)
        tarr = [0]*nteams
        for idx, team in enumerate(teams):
            for pidx, p in enumerate(team):
                if elos[pidx][0]["locked"] and elos[pidx][0]["team"] in tarr_no_order and p.solution_value() == 1:
                    tarr[idx] = elos[pidx][0]["team"]
                    tarr_no_order.remove(elos[pidx][0]["team"])
                    break

        for t in tarr_no_order:
            for idx in range(nteams):
                if tarr[idx] == 0:
                    tarr[idx] = t
                    break

        # Assign players to teams
        for idx, team in enumerate(teams):
            for pidx, p in enumerate(team):
                if p.solution_value() == 1:
                    elos[pidx][0]["team"] = tarr[idx]
            
        res = [{"name": elo[0]["name"], "team": elo[0]["team"]} for elo in elos]
        return jsonify({"players": res}), 200
    else:
        return jsonify({"error": "solution does not exist"}), 400
