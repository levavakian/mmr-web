import React from 'react';
import './App.css';
import GoogleLogin from 'react-google-login';
import SideNav, { NavItem, NavIcon, NavText } from '@trendmicro/react-sidenav';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import 'font-awesome/css/font-awesome.min.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faPlus } from "@fortawesome/free-solid-svg-icons";

const responseGoogle = (response: any) => {
  console.log("pre")
  console.log(response)
  console.log("post")
}

const clicked = () => {
  console.log("clicked")
}

const handleSubmit = (event: any) => {
  if (event.which === 13) {
    event.preventDefault();
    console.log("enter pressed")
}
}

const inputForm = (name: string, on: boolean, icon: any) => {
  if (on) {
    return (
      <form>
        <label>
          <input type={name} onKeyPress={handleSubmit} style={{ width: "150px", position: "absolute", bottom: "18px", left: "50px"}} name={name} placeholder="some value"/>
        </label>
        <FontAwesomeIcon icon={icon} onClick={clicked} style={{ position: "absolute", bottom: "20px", left: "210px"}}/>
      </form>
    )
  } else {
    return (
      <div></div>
    )
  }
  
}

class Sidebar extends React.Component<{}, {expanded: boolean, inputfield: string}> {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      inputfield: ""
    };
  }

  handleExpand(expanded: boolean) {
    this.setState({
      expanded: expanded
    })
  }

  handleSelect(selected: string) {
    console.log(selected)
  }

  handleSubmit(event) {
    console.log(event)
  }

  handleChange(event) {
    this.setState({inputfield: event.target.value});
  }

  expand() {
    this.setState({expanded: true})
  }

  render() {
    // var blah = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u"];
    var blah = ["a", "b", "c"];
    var rv : any = [];
    blah.forEach(element => {
      rv.push(
        <NavItem eventKey={element} key={element}>
          <NavIcon>
              <i className="fa fa-fw fa-angle-double-right" style={{ fontSize: '1.75em' }} />
          </NavIcon>
          <NavText>
              {element}
          </NavText>
        </NavItem>
      )
    });
    rv.push(
      <NavItem eventKey="find" key="find" disabled onClick={() => {this.expand()}}>
        <NavIcon>
          <i className="fa fa-fw fa-search" style={{ fontSize: '1.75em' }} />
        </NavIcon>
        {inputForm("find", this.state.expanded, faSearch)}
      </NavItem>
    )
    rv.push(
      <NavItem eventKey="new" key="new" disabled onClick={() => {this.expand()}}>
        <NavIcon>
          <i className="fa fa-fw fa-plus" style={{ fontSize: '1.75em' }} />
        </NavIcon>
        {inputForm("new", this.state.expanded, faPlus)}
      </NavItem>
    )
    return (
      <div>
      <SideNav onSelect={(selected: string) => this.handleSelect(selected)}
               onToggle={(expanded) => {this.handleExpand(expanded)}}
               expanded={this.state.expanded}
      >
      <SideNav.Toggle />
      <SideNav.Nav defaultSelected="home">
      {rv}
      </SideNav.Nav>
      </SideNav>
      </div>
    );
  }
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

function LobbyView(props) {

  let teamView = props.lobby.teams.map((elem, idx) => {
      return (
        <div key={idx} style={{borderRadius: "15px", padding: "10px 20px", border: "2px solid #AAA", margin: "10px 0px"}}>
          <h3 style={{display: "inline-block", borderRadius: "15px", padding: "10px 20px", border: "2px solid #AAA", margin: "0px 0px", left: "5px"}} key={idx}>Team {idx+1} ({elem.total()})</h3>
          <p>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
          </p>
        </div>
      )
  })
  teamView = (
    <div style={{marginBottom: "auto", alignItems: "flex-start"}}>
      {teamView}
    </div>
  )

return (
    <div style={{marginLeft: "25px"}}>
      <h1 style={{marginTop: "auto", marginBottom: "0px", paddingTop: "0px"}}>{props.lobby.name}</h1>
      <h6 style={{marginTop: "auto", padding: "0px 25px"}}>id: {props.lobby.id}</h6>
      {teamView}
    </div>
  )
}

const SidebarIcon = ({handleClick, expanded}) => {
  return <div onClick={handleClick} style={{float: "right"}}>
    {expanded ? 
     <i className="fa fa-fw fa-close" style={{ fontSize: '1.75em' }} /> :
     <i className="fa fa-fw fa-bars" style={{ fontSize: '1.75em' }} />}
  </div>
}

class Navigator extends React.Component<{}, {expanded: boolean, selected: string}> {
  constructor(props) {
    super(props)
    this.state={
      expanded: false,
      selected: ""
    }
  }

  sidebar = () => {
    if (!this.state.expanded) {
      return null
    }

    return <div className="sidebar">
       <div style={{flexDirection: "row", display: "flex", verticalAlign: "middle"}}>
        <i className="fa fa-fw fa-angle-double-right" style={{ fontSize: '1.75em' }} />
        <span style={{textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"}}className="sidebar-link">Home</span>
       </div>
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

function getLogin() {
  var login : any
  if (true) {
    login = (
      <div style={{display: "inline-block", position: "absolute", right: "5px", top: "5px", padding: "5px 5px"}}>
        <GoogleLogin
                clientId="360927771611-5re4vbbs7ba6envdordshh9fnj31uldf.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={responseGoogle}
                onFailure={responseGoogle}
                cookiePolicy={'single_host_origin'}
        />
      </div>
    )
  } else {
    login = (
      <div></div>
    )
  }
  return login
}

function App() {
  console.log("hello")
  const lobby = createSampleLobby()
  return (
    <div className="App-header">
      {getLogin()}
      <div style={{display: "flex", flexDirection: "row", marginBottom: "auto"}}>
        <Navigator />
        {/* <Sidebar /> */}
        <LobbyView token="0" lobby={lobby} />
      </div>
    </div>
  );
}

export default App;
