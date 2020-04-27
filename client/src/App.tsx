import React from 'react';
import './App.css';
import GoogleLogin, { GoogleLogout } from 'react-google-login';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import 'font-awesome/css/font-awesome.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const handleSubmit = (event: any) => {
  if (event.which === 13) {
    event.preventDefault();
    console.log("enter pressed")
  }
}

const load = () => {

  let token = ""
  const stored = localStorage.getItem("tokenInfo")
  if (stored !== null) {
    const storedJson = JSON.parse(stored)
    if (storedJson !== undefined) {
      token = storedJson.token
    }
  }

  let xhr = new XMLHttpRequest()
  xhr.addEventListener('load', () => {
    console.log(xhr.responseText)
  })
  xhr.open('GET', 'http://localhost:5000/api/load')
  xhr.setRequestHeader("Authorization", "Bearer " + token);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xhr.send(JSON.stringify({
    "some": "stuff"
  }))
}

class Player {
  name: string
  elo: number

  constructor(name: string, elo: number) {
    this.name = name
    this.elo = elo
  }
}

class Team {
  players: Player[] = []
  constructor(players: Player[]) {
    this.players = players
  }

  total() {
    return this.players.map((p) => {return p.elo})
                       .reduce((total, add) => {return total + add})
  }
}

class Lobby {
  players: Player[] = []
  teams: Team[] = []
  id: string
  name: string

  constructor(id: string, name: string, players: Player[], teams: Team[]) {
    this.players = players
    this.id = id
    this.name = name
    this.teams = teams
  }

  playerActive(p: Player) {
    for (const team of this.teams) {
      if (team.players.map((pl) => { return pl.name }).includes(p.name)) {
        return true
      }
    }
    return false
  } 
}

const createSampleLobby = () => {
  let t1 = [new Player("Bibimbap", 500), new Player("Jormey", 300), new Player("Bon", 600)]
  let t2 = [new Player("Corl", 5), new Player("Potato", 200), new Player("Albo", 750)]
  let unteamed = [new Player("Josus", 260), new Player("Grop", 320)]
  return new Lobby("0000-0000-0000-0000", "Sample Lobby", [...t1, ...t2, ...unteamed], [new Team(t1), new Team(t2)])
}

function inputForm(inputStr: string, type: string, width: string) {
  return (
    <div className="group" style={{marginBottom: "10px", maxWidth: width}}>
      <input type={type} style={{maxWidth: width}} placeholder={inputStr}/>
      <span className="highlight" style={{maxWidth: width}}></span>
      <span className="bar" style={{maxWidth: width}}></span>
    </div>
  )
}

function LobbyView(props) {

  let teamView = props.lobby.teams.map((elem, idx) => {
      return (
        <div key={idx} className="card" style={{borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", backgroundColor: "#333"}}>
          <div className="card" style={{padding: "0px 20px", margin: "8px 0px", left: "5px", backgroundColor: "#282c34", borderRadius: "10px", display: "flex", flexDirection: "row"}}>
            <h3 style={{}} key={idx}>Team {idx+1} ({elem.total()})</h3>
            <i className="fa fa-fw fa-close lighten" style={{marginLeft: "auto", paddingTop: "15px", fontSize: '1.75em', color: "#ff9999 " }} />
          </div>
          <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", flexGrow: 1}}>
            {elem.players.map((p, pidx) => {
                return (
                  <div key={pidx} className="cardanim" style={{display: "flex", flexDirection: "column", borderRadius: "10px", padding: "5px", marginRight: "5px", marginBottom: "5px", backgroundColor: "#282c34"}}>
                    <h5  style={{margin: "2px",}}>{p.name} ({p.elo})</h5>
                    <div style={{display: "flex", flexDirection: "row", maxWidth: "60px"}}>
                      <i className="fa fa-fw fa-arrow-down lighten" style={{marginRight: "auto", paddingTop: "15px", fontSize: '1em', color: "#555555"}} />
                      <i className="fa fa-fw fa-arrow-up lighten" style={{marginRight: "auto", paddingTop: "15px", fontSize: '1em', color: "#555555 " }} />
                      <i className="fa fa-fw fa-close lighten" style={{marginRight: "auto", paddingTop: "15px", fontSize: '1em', color: "#ff9999 " }} />
                    </div>
                  </div>
                )
            })}
          </div>
        </div>
      )
  })

  let newTeam = (
    <div className="card" style={{display: "flex", flexDirection: "row", borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", marginRight: "auto", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", padding: "10px 20px", margin: "8px 0px", left: "5px"}}>New Team</h3>
      <i className="fa fa-fw fa-plus lighten" style={{marginLeft: "auto", paddingTop: "15px", paddingRight: "20px", fontSize: '1.75em', color: "#99ff99 " }} />
    </div>
  )

  let playerView = (
    <div className="card" style={{borderRadius: "10px", padding: "10px 20px", marginBottom: "10px", backgroundColor: "#333"}}>
      <h3 className="card" style={{backgroundColor: "#282c34", borderRadius: "10px", padding: "10px 20px", margin: "8px 0px", left: "5px"}}>Players</h3>
      <div style={{display: "flex", flexDirection: "row", flexWrap: "wrap", flexGrow: 1}}>
        {props.lobby.players.map((p, pidx) => {
            return (
              <div className="lighten" key={pidx} style={{borderRadius: "10px", padding: "5px", marginRight: "5px", marginBottom: "5px", marginTop: "5px", backgroundColor: props.lobby.playerActive(p) ? "#337733" : "#282c34"}}>
                <h5 style={{margin: "2px",}}>{p.name} ({p.elo})</h5>
              </div>
            )
        })}
      </div>
    </div>
  )

  let matchmakeLoad = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Automatchmake:{' '}
      </span>
      <span onClick={load} style={{marginTop: "35px"}}>
        <i className="fa fa-fw fa-download lighten" style={{ fontSize: '1.25em', color: "#99ff99" }} />
      </span>
    </div>
  )

  let selectTeam = (
    <div style={{display: "flex", flexDirection: "row"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Select winning team:{' '} 
      </span>
      {props.lobby.teams.map((team, idx) => {
          return (
            <span key={idx} className="cardanim lighten" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", marginLeft: "5px", borderRadius: "10px"}}>
              Team {idx+1}
            </span>
          )
        })}
      <div>
        <i className="fa fa-fw fa-angle-double-right lighten" style={{fontSize: '1.75em', color: "#99ff99" }} />
      </div>
    </div>
  )

  let playerActions = (
    <div style={{display: "flex", flexDirection: "column", marginTop: "20px"}}>
      <div style={{display: "flex", flexDirection: "row"}}>
        {inputForm("Add/Remove Player", "text", "200px")}
        <div style={{marginLeft: "10px", marginRight: "10px"}}></div>
        {inputForm("Elo", "number", "200px")}
        <div style={{marginRight: "20px"}}></div>
        <i className="fa fa-fw fa-plus lighten" style={{ paddingTop: "5px", fontSize: '1.75em', color: "#99ff99 " }} />
        <i className="fa fa-fw fa-close lighten" style={{ paddingTop: "5px", fontSize: '1.75em', color: "#ff9999 " }} />
      </div>
    </div>
  )

  let unfollowView = (
    <div style={{marginBottom: "15px"}}>
      <span className="card" style={{fontSize: "calc(12px + 1vh)", padding: "5px", backgroundColor: "#282c34", borderRadius: "10px"}}>
        Unfollow:{' '}
      </span>
      <span style={{marginTop: "50px"}}>
        <i className="fa fa-fw fa-minus-circle lighten" style={{ fontSize: '1.25em', color: "#ff9999" }} />
      </span>
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
      {selectTeam}
    </div>
  )

  teamView = (
    <div style={{marginBottom: "auto", alignItems: "flex-start"}}>
      {commandView}
      {teamView}
      {newTeam}
      {playerView}
      {settingsView}
    </div>
  )

return (
    <div style={{marginLeft: "25px", marginRight: "auto"}}>
      <h1 style={{marginTop: "auto", marginBottom: "0px", paddingTop: "0px"}}>{props.lobby.name}</h1>
      <h6 style={{marginTop: "auto", padding: "0px 25px"}}>id: {props.lobby.id}</h6>
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
  selected: number;
}

interface NavigatorProps {
  lobbies: Lobby[];
}

class Navigator extends React.Component<NavigatorProps, NavigatorState> {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
      selected: -1,
    }
  }

  sidebar = () => {
    if (!this.state.expanded) {
      return null
    }

    const search = (
      <div style={{flexDirection: "row", display: "flex"}}>
        <i className="fa fa-fw fa-search" style={{ marginTop: "7px", marginLeft: "7px", marginRight: "7px", fontSize: '1.25em' }} />
        {inputForm("Add by id", "text", "123px")}
      </div>
    )

    const addNew = (
      <div style={{flexDirection: "row", display: "flex"}}>
        <i className="fa fa-fw fa-plus" style={{ marginTop: "7px", marginLeft: "7px", marginRight: "7px", fontSize: '1.25em' }} />
        {inputForm("Add new", "text", "123px")}
      </div>
    )

    return <div className="sidebar">
       {this.props.lobbies.map((elem, idx) => {
         return (
          <div key={elem.name} style={{flexDirection: "row", display: "flex", marginBottom: "10px"}}>
            <i className="fa fa-fw fa-angle-double-right" style={{ fontSize: '1.75em' }} />
            <span style={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}className="sidebar-link">{elem.name}</span>
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
        {this.sidebar()}
      </div>
    </div>
  }
}

interface AppState {
  token?: string;
  expiration?: number;
  lobbies: Lobby[]
}

class App extends React.Component<{}, AppState> {
  constructor(props) {
    super(props)

    let state = this.defaultState()
    const stored = localStorage.getItem("tokenInfo")
    if (stored !== null) {
      const storedJson = JSON.parse(stored)
      if (storedJson !== undefined) {
        state.token = storedJson.token
        state.expiration = storedJson.expiration
      }
    }
    this.state = {
      ...state
    }

  }

  defaultState = () => {
    return {
      token: undefined,
      expiration: 0,
      lobbies: [createSampleLobby()],
    }
  }

  setState = (state) => {
    super.setState(state)
    localStorage.setItem("tokenInfo", JSON.stringify({
      token: this.state.token,
      expiration: this.state.expiration,
    }))
  }

  handleLogin = (response) => {
    console.log(response.tokenObj.id_token)
    this.setState({
      token: response.tokenObj.id_token,
      expiration: response.tokenObj.expires_at,
    })
    console.log(localStorage.getItem("tokenInfo"))
  }

  handleLogout = () => {
    this.setState({
      token: null,
      expiration: 0,
      email: ""
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
            onFailure={(event)=>{ console.log(event); toast("Failed to login")}}
            isSignedIn={true}
            cookiePolicy={'single_host_origin'}
          />
        </div>
      )

    return (
      <div className="App-header">
       <ToastContainer />
       {login}
       <div style={{display: "flex", flexDirection: "row", marginBottom: "auto", marginRight: "auto"}}>
         <Navigator lobbies={this.state.lobbies} />
         <LobbyView token="0" lobby={this.state.lobbies[0]} />
       </div>
      </div>
    )
  }
}

export default App;
