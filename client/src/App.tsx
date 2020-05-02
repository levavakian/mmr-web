import React from 'react';
import './App.css';
import GoogleLogin, { GoogleLogout } from 'react-google-login';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import 'font-awesome/css/font-awesome.min.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const serverURL: string = process.env.REACT_APP_MMRHOST || "https://mmr-tracker.herokuapp.com"

const api = (action: string, route: string, content: any = undefined, onload: any = undefined) => {
  let token = ""
  const stored = localStorage.getItem("tokenInfo")
  if (stored !== null) {
    const storedJson = JSON.parse(stored)
    if (storedJson !== undefined) {
      token = storedJson.token
    }
  }

  let xhr = new XMLHttpRequest()
  xhr.responseType = 'json'
  if (onload) {
    xhr.addEventListener('load', onload)
  }
  xhr.addEventListener('error', () => toast("there was an error with the request, are you logged in?"))
  xhr.open(action, serverURL + "/api/" + route)
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  if (content) {
    xhr.send(JSON.stringify(
      content
    ))
  } else {
    xhr.send()
  }
}

class Player {
  name: string
  elo: number
  locked: boolean
  team: number

  constructor(name: string, elo: number) {
    this.name = name
    this.elo = elo
    this.locked = false
    this.team = 0
  }
}

class Lobby {
  teams: Set<number>
  chosenTeam: number = 0
  id: string
  name: string
  players: Map<string, Player>
  enforceEvenTeams: boolean = false
  playerEditText: string = ""
  playerEditNum: string = ""

  constructor(id: string, name: string, players: Map<string, Player>) {
    this.players = players
    this.id = id
    this.name = name
    this.teams = new Set([1, 2])
  }
}

const getTotalForTeam = (lobby, team) => {
  const pArr: Array<Player> = Array.from(lobby.players.values())
  return pArr.reduce((total, player) => {
    if (player.team === team) {
      return total + player.elo
    } else {
      return total
    }
  }, 0)
}

const deepcopyPlayer = (player: Player) => {
  return {
    ...player
  }
}

const deepcopyLobby = (lobby: Lobby) => {
  const pArr: Array<[string, Player]> = Array.from(lobby.players.values()).map((p) => [p.name, deepcopyPlayer(p)])
  let nlobby = new Lobby(
    lobby.id,
    lobby.name,
    new Map(pArr)
  )

  const teamArr: Array<number> = Array.from(lobby.teams)
  nlobby.teams = new Set(teamArr)
  nlobby.chosenTeam = lobby.chosenTeam
  nlobby.playerEditNum = lobby.playerEditNum
  nlobby.playerEditText = lobby.playerEditText
  nlobby.enforceEvenTeams = lobby.enforceEvenTeams
  return nlobby
}

const deepcopyLobbies = (lobbies: Map<string, Lobby>) => {
  const lArr: Array<[string, Lobby]> = Array.from(lobbies).map((l) => [l[1].id, deepcopyLobby(l[1])])
  return new Map(lArr)
}

const createSampleLobby = () => {
  let t1 = new Map([
    ["Bibimbap", new Player("Bibimbap", 500)],
    ["Jormey", new Player("Jormey", 300)],
    ["Bon", new Player("Bon", 600)]
  ])
  let t2 = new Map([
    ["Corl", new Player("Corl", 5)],
    ["Potato", new Player("Potato", 200)],
    ["Albo", new Player("Albo", 750)]
  ])
  let unteamed = new Map([
    ["Josus", new Player("Josus", 260)],
    ["Grop", new Player("Grop", 320)]
  ])
  return new Lobby("0000-0000-0000-0000", "Sample Lobby (Login to Edit)", new Map([...t1, ...t2, ...unteamed]))
}

function inputForm(inputStr: string, type: string, content: string | number, width: string, onChange: any, onKey: any) {
  return (
    <div className="group" style={{marginBottom: "10px", maxWidth: width}}>
      <input type={type} onKeyPress={onKey} onChange={onChange} value={content} style={{maxWidth: width}} placeholder={inputStr}/>
      <span className="highlight" style={{maxWidth: width}}></span>
      <span className="bar" style={{maxWidth: width}}></span>
    </div>
  )
}

interface PlayerEditState {
  textInput: string 
  numInput: string
}

interface PlayerEditProps {
  lobby: Lobby
}

function LobbyView(props) {
  if (props.lobby === undefined) {
    return (
      <div style={{marginLeft: "25px", marginRight: "auto"}}>
        <h1 style={{marginTop: "auto", marginBottom: "0px", paddingTop: "0px"}}>No lobby selected</h1>
        <h6 style={{marginTop: "auto", padding: "0px 25px"}}>Please create a new lobby or add an existing one</h6>
      </div>
    )
  }
  const teamsArr: Array<number> = Array.from(props.lobby.teams)

  const teamElems = teamsArr.map((t) => {
    const pArr: Array<Player> = Array.from(props.lobby.players.values())
    const playersForTeam = pArr.filter((p) => p.team === t)
    const teamTotal = getTotalForTeam(props.lobby, t)
    const playerElems = playersForTeam.map((p, pidx) => {
      return (
        <div key={pidx} className="cardanim" style={{display: "flex", flexDirection: "column", borderRadius: "10px", padding: "5px", marginRight: "5px", marginBottom: "5px", backgroundColor: "#282c34"}}>
          <h5  style={{margin: "2px"}}>{p.name} ({p.elo})</h5>
          <div style={{display: "flex", flexDirection: "row", maxWidth: "80px"}}>
            <i onClick={() => props.onPlayerLower(props.lobby, p.name)} className="fa fa-fw fa-arrow-down lighten" style={{paddingRight: "3px", paddingTop: "15px", fontSize: '1em', color: "#555555"}} />
            <i onClick={() => props.onPlayerRaise(props.lobby, p.name)} className="fa fa-fw fa-arrow-up lighten" style={{paddingRight: "3px", paddingTop: "15px", fontSize: '1em', color: "#555555" }} />
            <i onClick={() => props.onPlayerLockToggle(props.lobby, p.name)} className="fa fa-fw fa-lock lighten" style={{paddingRight: "3px", paddingTop: "15px", fontSize: '1em', color: p.locked ? "#ff9999" : "#555555" }} />
            <i onClick={() => props.onPlayerToggle(props.lobby, p.name)} className="fa fa-fw fa-close lighten" style={{paddingRight: "3px", paddingTop: "15px", fontSize: '1em', color: "#ff9999 " }} />
          </div>
        </div>
      )
    })

    return (
      <div key={t} className="card" style={{borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", backgroundColor: "#333"}}>
        <div className="card" style={{padding: "0px 20px", margin: "8px 0px", left: "5px", backgroundColor: "#282c34", borderRadius: "10px", display: "flex", flexDirection: "row"}}>
          <h3 style={{}} key={t}>Team {t} ({teamTotal})</h3>
          {t > 2 ?
            <i className="fa fa-fw fa-close lighten" onClick={() => {props.onDeleteTeam(props.lobby, t)}} style={{marginLeft: "auto", paddingTop: "15px", fontSize: '1.75em', color: "#ff9999 " }} /> :
            null}
        </div>
        <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", flexGrow: 1}}>
          {playerElems}
        </div>
      </div>
    )
  })

  let newTeam = (
    <div className="card" style={{display: "flex", flexDirection: "row", borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", marginRight: "auto", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", padding: "10px 20px", margin: "8px 0px", left: "5px"}}>New Team</h3>
      <i className="fa fa-fw fa-plus lighten" onClick={() => {props.onNewTeam(props.lobby)}} style={{marginLeft: "auto", paddingTop: "15px", paddingRight: "20px", fontSize: '1.75em', color: "#99ff99 " }} />
    </div>
  )

  let playerView = (
    <div className="card" style={{borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", padding: "10px 20px", margin: "8px 0px", left: "5px"}}>Players</h3>
      <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", flexGrow: 1}}>
        {[...props.lobby.players.values()].map((p, pidx) => {
            return (
              <div className="lighten" key={pidx} style={{borderRadius: "10px", padding: "5px", marginRight: "5px", marginBottom: "5px", marginTop: "5px", backgroundColor: props.lobby.teams.has(p.team) ? "#337733" : "#282c34"}}>
                <h5 onClick={() => props.onPlayerToggle(props.lobby, p.name)} style={{margin: "2px",}}>{p.name} ({p.elo})</h5>
              </div>
            )
        })}
      </div>
    </div>
  )

  let matchmakeLoad = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Matchmake:{' '}
      </span>
      <span style={{marginTop: "35px"}}>
        <i onClick={() => props.matchmake(props.lobby)} className="fa fa-fw fa-download lighten" style={{ fontSize: '1.25em', color: "#99ff99" }} />
      </span>
    </div>
  )

  const copyTeamComp = () => {
    let out = ""
    const pArr: Array<Player> = Array.from(props.lobby.players.values())
    for (const t of props.lobby.teams) {
      const playersForTeam = pArr.filter((p) => p.team === t)
      const totElo = playersForTeam.map((p) => p.elo).reduce((tot, add) => tot + add, 0)
      out = out + "Team " + t + "(" + totElo + "): "
      for (let p of playersForTeam) {
        out = out + "  " + p.name + " (" + p.elo + ") "
      }
      out = out + "\n"
    }
    navigator.clipboard.writeText(out)
    toast("copied")
  }
  let teamCompCopy = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Copy team composition:{' '}
      </span>
      <span style={{marginTop: "35px"}}>
        <i onClick={copyTeamComp} className="fa fa-fw fa-clipboard lighten" style={{ fontSize: '1.25em', color: "#99ff99" }} />
      </span>
    </div>
  )

  let teamCompSelect = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Team proposals:{' '}
      </span>
      <span onClick={() => props.onPropose(props.lobby)} className="card lighten" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", marginLeft: "5px", borderRadius: "10px"}}>
        Propose
      </span>
      <span onClick={() => props.onRetrieve(props.lobby)} className="card lighten" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", marginLeft: "5px", borderRadius: "10px"}}>
        Retrieve
      </span>
    </div>
  )

  const enforceIconClass = props.lobby.enforceEvenTeams ? "fa fa-fw fa-toggle-on lighten" : "fa fa-fw fa-toggle-off lighten"
  const enforceIconColor = props.lobby.enforceEvenTeams ? "#99ff99" : "#ff9999"
  let enforceEvenToggle = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Enforce even teams:{' '}
      </span>
      <span style={{marginTop: "35px"}}>
        <i onClick={() => props.onEnforceToggle(props.lobby)} className={enforceIconClass} style={{ fontSize: '1.25em', color: enforceIconColor }} />
      </span>
    </div>
  )

  let selectTeam = (
    <div style={{display: "flex", flexDirection: "row"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Select winning team:{' '} 
      </span>
      {teamsArr.map((tidx) => {
          const backgroundColor = props.lobby.chosenTeam === tidx ? "#337733" : "#282c34"
          return (
            <span key={tidx} onClick={() => {props.onSelectTeam(props.lobby, tidx)}} className="cardanim lighten" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: backgroundColor, marginLeft: "5px", borderRadius: "10px"}}>
              Team {tidx}
            </span>
          )
        })}
      <div>
        <i onClick={() => {props.onSendWinner(props.lobby)}} className="fa fa-fw fa-angle-double-right lighten" style={{fontSize: '1.75em', color: "#99ff99" }} />
      </div>
    </div>
  )

  let unfollowView = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Unfollow:{' '}
      </span>
      <span style={{marginTop: "50px"}}>
        <i onClick={() => props.onUnfollow(props.lobby)} className="fa fa-fw fa-minus-circle lighten" style={{ fontSize: '1.25em', color: "#ff9999" }} />
      </span>
    </div>
  )

  let playerActions = (
    <div style={{display: "flex", flexDirection: "column", marginTop: "20px"}}>
      <div style={{display: "flex", flexDirection: "row"}}>
        {inputForm("Add/Remove Player", "text", props.lobby.playerEditText, "200px", (e) => props.onPlayerEditTextChange(props.lobby, e), null)}
        <div style={{marginLeft: "10px", marginRight: "10px"}}></div>
        {inputForm("Elo", "number", props.lobby.playerEditNum, "200px", (e) => props.onPlayerEditNumChange(props.lobby, e), null)}
        <div style={{marginRight: "20px"}}></div>
        <i onClick={() => props.onPlayerEditAdd(props.lobby)} className="fa fa-fw fa-plus lighten" style={{ paddingTop: "5px", fontSize: '1.75em', color: "#99ff99 " }} />
        <i onClick={() => props.onPlayerEditRemove(props.lobby)} className="fa fa-fw fa-close lighten" style={{ paddingTop: "5px", fontSize: '1.75em', color: "#ff9999 " }} />
      </div>
    </div>
  )

  let settingsView = (
    <div className="card" style={{borderRadius: "10px", padding: "10px 20px", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", marginBottom: "15px", marginTop: "10px", padding: "10px 20px", left: "5px"}}>Settings</h3>
      {playerActions}
      {unfollowView}
    </div>
  )

  let commandView = (
    <div className="card" style={{borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", marginBottom: "15px", marginTop: "10px", padding: "10px 20px", left: "5px"}}>Commands</h3>
      {matchmakeLoad}
      {enforceEvenToggle}
      {teamCompCopy}
      {teamCompSelect}
      {selectTeam}
    </div>
  )

  const teamView = (
    <div style={{marginBottom: "auto", alignItems: "flex-start"}}>
      {commandView}
      {teamElems}
      {newTeam}
      {playerView}
      {settingsView}
    </div>
  )

return (
    <div style={{marginLeft: "25px", marginRight: "auto"}}>
      <h1 style={{marginTop: "auto", marginBottom: "0px", paddingTop: "0px"}}>{props.lobby.name}</h1>
      <div style={{flexDirection: "row", display: "flex"}}>
        <h6 style={{marginTop: "auto", paddingLeft: "25px", paddingRight: "5px"}}>id: {props.lobby.id}</h6>
        <i onClick={() => { navigator.clipboard.writeText(props.lobby.id); toast("copied") }} className="fa fa-fw fa-clipboard lighten" style={{color: "#99ff99" }} />
      </div>
      {teamView}
    </div>
  )
}

const SidebarIcon = ({handleClick, expanded}) => {
  return <div onClick={handleClick} style={{float: "right"}}>
    {expanded ? 
     <i className="fa fa-fw fa-close lighten" style={{ fontSize: '1.75em' }} /> :
     <i className="fa fa-fw fa-bars lighten" style={{ fontSize: '1.75em' }} />}
  </div>
}

interface NavigatorState {
  expanded: boolean;
  searchVal: string,
  addVal: string,
}

interface NavigatorProps {
  lobbies: Map<string, Lobby>;
  selected?: Lobby;
  onSelectLobby: any;
  onAddNewLobby: any;
  onFindNewLobby: any;
}

class Navigator extends React.Component<NavigatorProps, NavigatorState> {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
      searchVal: "",
      addVal: "",
    }
  }

  onSearchChange = (e) => {
    const val = e.target.value
    this.setState({
      searchVal: val
    })
  }

  onSearchSubmit = (e) => {
    if (e.which === 13) {
      e.preventDefault();
      this.onSearchClick()
    }
  }

  onSearchClick = () => {
    if (this.state.searchVal) {
      this.props.onFindNewLobby(this.state.searchVal)
    }
    this.setState({
      searchVal: ""
    })
  }

  onAddChange = (e) => {
    const val = e.target.value
    this.setState({
      addVal: val
    })
  }

  onAddSubmit = (e) => {
    if (e.which === 13) {
      e.preventDefault();
      this.onAddClick()
    }
  }

  onAddClick = () => {
    if (this.state.addVal) {
      this.props.onAddNewLobby(this.state.addVal)
    }
    this.setState({
      addVal: ""
    })
  }

  sidebar = (props) => {
    if (!this.state.expanded) {
      return null
    }

    const search = (
      <div style={{flexDirection: "row", display: "flex"}}>
        <i className="fa fa-fw fa-search" style={{ marginTop: "7px", marginLeft: "7px", marginRight: "7px", fontSize: '1.25em' }} />
        {inputForm("Add by id", "text", this.state.searchVal, "123px", this.onSearchChange, this.onSearchSubmit)}
      </div>
    )

    const addNew = (
      <div style={{flexDirection: "row", display: "flex"}}>
        <i className="fa fa-fw fa-plus" style={{ marginTop: "7px", marginLeft: "7px", marginRight: "7px", fontSize: '1.25em' }} />
        {inputForm("Add new", "text", this.state.addVal, "123px", this.onAddChange, this.onAddSubmit)}
      </div>
    )

    return <div className="sidebar">
       {[...this.props.lobbies.values()].map((elem, idx) => {
         return (
          <div key={elem.name} style={{flexDirection: "row", display: "flex", marginBottom: "10px"}}>
            <i className="fa fa-fw fa-angle-double-right" style={{ fontSize: '1.75em' }} />
            <span onClick={() => props.onSelectLobby(elem)} style={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}className="sidebar-link">{elem.name}</span>
          </div>
         )
       })}
       {search}
       {addNew}
    </div>
  }

  toggle = () => {
    this.setState({
      expanded: !this.state.expanded
    })
  }

  render() {
    return <div style={{
        marginRight: "auto",
        backgroundColor: "#A33",
        minHeight: "100vh",
        marginTop: "0px",
        display: "inline-block"}}>
      <div style={{flexDirection: "row"}} className="sidebar-icon">
        <SidebarIcon
          expanded={this.state.expanded}
          handleClick={this.toggle}
        />
        <div style={{paddingBottom: "10px"}}></div>
        {this.sidebar(this.props)}
      </div>
    </div>
  }
}

interface AppState {
  token?: string;
  expiration?: number;
  lobbies: Map<string, Lobby>;
  selectedLobby: string;
}

class App extends React.Component<{}, AppState> {
  constructor(props) {
    super(props)

    let state = this.defaultState()
    const stored = localStorage.getItem("tokenInfo")
    if (stored !== null) {
      const storedJson = JSON.parse(stored)
      if (storedJson !== undefined && storedJson.expiration > Date.now()) {
        state.token = storedJson.token
        state.expiration = storedJson.expiration
      }
    }
    this.state = {
      ...state
    }
  }

  componentDidMount = () => {
    if (this.state.token) {
      const load = async () => { this.setFromLoad() }
      load()
    }
  }

  onPlayerEditTextChange = (lobby, event) => {
    const val = event.target.value
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.playerEditText = val
      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerEditNumChange = (lobby, event) => {
    const val = event.target.value
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.playerEditNum = val
      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerEditAdd = (lobby) => {
    const text = lobby.playerEditText
    const elo = lobby.playerEditNum
    const existing = lobby.players.get(text)?.elo || 0
    
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      
      nlobby.playerEditNum = ""
      nlobby.playerEditText = ""

      return {
        lobbies: nlobbies
      }
    })

    if (elo && text) {
      api('POST', 'player', {"lobby": lobby.id, "player": {"name": text, "elo": parseInt(elo), "existing": existing}}, (e) => {
        if (e.target.status !== 201) {
          toast(e.target.response.error)
          return
        }
        this.setSingleLobby(e.target.response)
      })
    }
  }

  onPlayerEditRemove = (lobby) => {
    const text = lobby.playerEditText

    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.playerEditNum = ""
      nlobby.playerEditText = ""
      return {
        lobbies: nlobbies
      }
    })

    if (text) {
      api('DELETE', 'player', {"lobby": lobby.id, "player": {"name": text}}, (e) => {
        if (e.target.status !== 202) {
          toast(e.target.response.error)
          return
        }
        this.setSingleLobby(e.target.response)
      })
    }
  }

  defaultState = () => {
    const sample = createSampleLobby()
    return {
      token: undefined,
      expiration: 0,
      lobbies: new Map([[sample.id, sample]]),
      selectedLobby: sample.id,
    }
  }

  setState = (state) => {
    super.setState(state)
    localStorage.setItem("tokenInfo", JSON.stringify({
      token: this.state.token,
      expiration: this.state.expiration,
    }))
  }

  getCurrentLobby = () => {
    for (const lobby of this.state.lobbies.values()) {
      if (lobby.id === this.state.selectedLobby) {
        return lobby
      }
    }
    return undefined
  }

  handleLogin = (response) => {
    this.setState({
      token: response.tokenObj.id_token,
      expiration: response.tokenObj.expires_at,
    })
    this.setFromLoad()
  }

  newLobbyFromExisting = (jlobby, elobby) => {
    let players = new Map<string, Player>(jlobby.players.map((p) => {
      let player = new Player(p.name, p.elo)
      if (elobby) {
        const existing = elobby.players.get(p.name)
        if (!existing)
        {
          return [player.name, player]
        }
        player.locked = existing.locked
        player.team = existing.team
      }
      return [player.name, player]
    }))
    let lobby = new Lobby(jlobby.id, jlobby.name, players)
    if (elobby) {
      lobby.teams = elobby.teams
      lobby.playerEditNum = elobby.playerEditNum
      lobby.playerEditText = elobby.playerEditText
      lobby.chosenTeam = elobby.chosenTeam
      lobby.enforceEvenTeams = elobby.enforceEvenTeams
    }
    return lobby
  }

  setSingleLobby = (jlobby) => {
    this.setState((prevState) => {
      const elobby = prevState.lobbies.get(jlobby.id);
      const nlobby = this.newLobbyFromExisting(jlobby, elobby ? deepcopyLobby(elobby) : undefined)
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      nlobbies.set(nlobby.id, nlobby)
      return {
        lobbies: nlobbies
      }
    })
  }

  setFromLoad = () => {
    api('GET', 'load', undefined, (e) => {
      if (e.target.status !== 200) {
        toast(e.target.response.error)
        return
      }
      this.setState((prevState) => {
        const resp = e.target.response
        const lobbies = resp.lobbies.map((jlobby) => {
          const elobby = prevState.lobbies.get(jlobby.id);
          return this.newLobbyFromExisting(jlobby, elobby ? deepcopyLobby(elobby) : undefined)
        })
        let lobbiesMap = new Map<string, Lobby>()
        lobbies.map((elem) => lobbiesMap.set(elem.id, elem))
        let selected = prevState.selectedLobby
        if (!lobbiesMap.has(prevState.selectedLobby) && lobbies.length > 0) {
          selected = lobbies[0].id
        }
        return {
          selectedLobby: selected,
          lobbies: lobbiesMap,
        }
      })
    })
  }

  handleLogout = () => {
    this.setState(
      this.defaultState()
    )
  }

  onNewTeam = (lobby) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      const nIdx = Math.max(...nlobby?.teams) + 1
      nlobby.teams.add(nIdx)
      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerToggle = (lobby, player) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      let nplayer = nlobby.players.get(player)
      if (!nplayer) {
        return {}
      }

      let nTeam = 0
      if (!nlobby.teams.has(nplayer.team)) {
        nTeam = 1
        let min = getTotalForTeam(nlobby, 1)
        for (const team of Array.from(nlobby.teams)) {
          const tot = getTotalForTeam(nlobby, team)
          if (tot < min) {
            nTeam = team
            min = tot
          }
        }
      }

      nplayer.team = nTeam

      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerLockToggle = (lobby, player) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      let nplayer = nlobby.players.get(player)
      if (!nplayer) {
        return {}
      }

      nplayer.locked = !nplayer.locked
      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerRaise = (lobby, player) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      let nplayer = nlobby.players.get(player)
      if (!nplayer) {
        return {}
      }

      const pteam = nplayer?.team
      const nt = Math.max(...Array.from(nlobby.teams).filter((t) => t < pteam))
      if (!isFinite(nt)) {
        return {}
      }

      nplayer.team = nt
      return {
        lobbies: nlobbies
      }
    })
  }

  onPlayerLower = (lobby, player) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      let nplayer = nlobby.players.get(player)
      if (!nplayer) {
        return {}
      }
      const pteam = nplayer?.team
      const nt = Math.min(...Array.from(nlobby.teams).filter((t) => t > pteam))
      if (!isFinite(nt)) {
        return {}
      }

      nplayer.team = nt
      return {
        lobbies: nlobbies
      }
    })
  }

  onDeleteTeam = (lobby, team) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.teams.delete(team)
      return {
        lobbies: nlobbies
      }
    })
  }

  onSelectTeam = (lobby, team) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.chosenTeam = team
      return {
        lobbies: nlobbies
      }
    })
  }

  onEnforceToggle = (lobby) => {
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        return {}
      }
      nlobby.enforceEvenTeams = !nlobby.enforceEvenTeams
      return {
        lobbies: nlobbies
      }
    })
  }

  onSelectLobby = (lobby) => {
    this.setState({
      selectedLobby: lobby.id
    })
  }

  onAddNewLobby = (name) => {
    api('POST', 'add', {"name": name}, (e) => {
      if (e.target.status !== 201) {
        toast(e.target.response.error)
        return
      }
      this.setSingleLobby(e.target.response)
    })
  }

  onFindNewLobby = (id) => {
    api('POST', 'subscribe', {"id": id}, (e) => {
      if (e.target.status !== 201) {
        toast(e.target.response.error)
        return
      }
      this.setSingleLobby(e.target.response)
    })
  }

  onUnfollow = (lobby) => {
    api('POST', 'unsubscribe', {"id": lobby.id}, (e) => {
      if (e.target.status !== 201) {
        toast(e.target.response.error)
        return
      }
      this.setState((prevState) => {
        let nlobbies = deepcopyLobbies(prevState.lobbies)
        nlobbies.delete(lobby.id)
        return {
          lobbies: nlobbies
        }
      })
    })
  }

  matchmake = (lobby) => {
    let pArr: Array<Player> = Array.from(lobby.players).map((p: any) => p[1])
    pArr = pArr.filter((p: any) => p !== null)
    const content = {"id": lobby.id, "teams": Array.from(lobby.teams), "even": lobby.enforceEvenTeams, "players": pArr}
    api('POST', 'matchmake', content, (e) => {
      if (e.target.status !== 200) {
        toast(e.target.response.error)
        return
      }
      this.setState((prevState) => {
        let nlobbies = deepcopyLobbies(prevState.lobbies)
        let nlobby = nlobbies.get(lobby.id)
        if (!nlobby) {
          toast("could not find lobby for matchmaking")
          return {}
        }
        for (let pin of e.target.response.players) {
          let nplayer = nlobby.players.get(pin.name)
          if (!nplayer) {
            toast("could not find all players for matchmaking")
            return {}
          }
          nplayer.team = pin.team
        }
        return {
          lobbies: nlobbies
        }
      })
    })
  }

  onSendWinner = (lobby) => {
    const pArr: Array<Player> = Array.from(lobby.players).map((p: any) => p[1])
    const content = {"id": lobby.id, "players": pArr, "winner": lobby.chosenTeam}
    this.setState((prevState) => {
      let nlobbies = deepcopyLobbies(prevState.lobbies)
      let nlobby = nlobbies.get(lobby.id)
      if (!nlobby) {
        toast("could not find lobby for matchmaking")
        return {}
      }
      nlobby.chosenTeam = 0
      return {
        lobbies: nlobbies
      }
    })
    api('POST', 'win', content, (e) => {
      if (e.target.status !== 200) {
        toast(e.target.response.error)
        return
      }
      this.setSingleLobby(e.target.response)
    })
  }

  onPropose = (lobby) => {
    const pArr: Array<Player> = Array.from(lobby.players).map((p: any) => p[1])
    const tArr: Array<number> = Array.from(lobby.teams).map((p: any) => p)
    const content = {"id": lobby.id, "players": pArr, "teams": tArr}
    api('POST', 'propose', content, (e) => {
      if (e.target.status !== 201) {
        toast(e.target.response.error)
      }
    })
  }

  onRetrieve = (lobby) => {
    api('POST', 'retrieve', {"id": lobby.id}, (e) => {
      if (e.target.status !== 200) {
        toast(e.target.response.error)
      }

      this.setState((prevState) => {
        let nlobbies = deepcopyLobbies(prevState.lobbies)
        let nlobby = nlobbies.get(lobby.id)
        if (!nlobby) {
          toast("could not find lobby for matchmaking")
          return {}
        }

        nlobby.teams = new Set(e.target.response.teams)
        nlobby.players.forEach((p) => {
          for (let pr of e.target.response.players) {
            if (pr.name === p.name)
            {
              p.team = pr.team
              return
            }
          }
        })
        return {
          lobbies: nlobbies
        }
      })
    })
  }

  render() {
    const loggedIn = (this.state.token && this.state.expiration && Date.now() < this.state.expiration)
    const login =
      loggedIn ?
      (
        <div style={{display: "inline-block", position: "absolute", right: "5px", top: "5px", padding: "5px 5px"}}>
          <GoogleLogout
            clientId="360927771611-5re4vbbs7ba6envdordshh9fnj31uldf.apps.googleusercontent.com"
            buttonText="Logout"
            onLogoutSuccess={this.handleLogout} />
        </div>
      ) : (
        <div style={{display: "inline-block", position: "absolute", right: "5px", top: "5px", padding: "5px 5px"}}>
          <GoogleLogin
            clientId="360927771611-5re4vbbs7ba6envdordshh9fnj31uldf.apps.googleusercontent.com"
            buttonText="Login"
            onSuccess={this.handleLogin}
            onFailure={(event)=>{ toast("Failed to login")}}
            isSignedIn={true}
            cookiePolicy={'single_host_origin'}
          />
        </div>
      )
    
    const currentLobby = this.getCurrentLobby()

    return (
      <div className="App-header">
       <ToastContainer />
       {login}
       <div style={{display: "flex", flexDirection: "row", marginBottom: "auto", marginRight: "auto"}}>
         <Navigator
           lobbies={this.state.lobbies}
           selected={currentLobby}
           onAddNewLobby={this.onAddNewLobby}
           onFindNewLobby={this.onFindNewLobby}
           onSelectLobby={this.onSelectLobby} />
         <LobbyView
            lobby={currentLobby}
            onNewTeam={this.onNewTeam}
            onPlayerToggle={this.onPlayerToggle}
            onSelectTeam={this.onSelectTeam}
            onPlayerRaise={this.onPlayerRaise}
            onPlayerLower={this.onPlayerLower}
            onEnforceToggle={this.onEnforceToggle}
            onPlayerLockToggle={this.onPlayerLockToggle}
            onPlayerEditAdd={this.onPlayerEditAdd}
            onPlayerEditRemove={this.onPlayerEditRemove}
            onPlayerEditTextChange={this.onPlayerEditTextChange}
            onPlayerEditNumChange={this.onPlayerEditNumChange}
            onPropose={this.onPropose}
            onRetrieve={this.onRetrieve}
            onSendWinner={this.onSendWinner}
            matchmake={this.matchmake}
            onUnfollow={this.onUnfollow}
            onDeleteTeam={this.onDeleteTeam} />
       </div>
      </div>
    )
  }
}

export default App;
