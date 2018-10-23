import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

import openSocket from 'socket.io-client';
const  socket = openSocket('http://localhost:3001');

class Chat extends React.Component {
	constructor(props) {
		super(props);

    this.addMsg = this.addMsg.bind(this);
    this.addUser = this.addUser.bind(this);
    this.handleReply = this.handleReply.bind(this);
    this.userReplyAbort = this.userReplyAbort.bind(this);
    this.setLogin = this.setLogin.bind(this);

		this.state = {
			messages: [
				new ChatMsg({
					body: "Hello and welcome to this chatting science enrichment app!",
					hideInfo: true,
					type: 0
				}),
			],
			users: [],
			replyTo:[],
			login: ''
		};

		socket.on ('setClientUserList', (users) => this.setState({
  		users
		}));

		socket.on ('setClientMessageList', function(msg){
			var newMessages = this.state.messages;
			var pArgs = msg.props.attachReply;
			var privacyHide = false;
			// скрываем, если приватное, или если адресовано не юзеру
			if ( pArgs[2] ) { // если есть метка приватности
				if ( 	pArgs[0] !== this.state.login &&
							msg.props.author !== this.state.login ) {
							// и юзер не отправитель и не получатель
					privacyHide = true;
				}
			}
			// если было системное (0), то не трогаем. Иначе сверяем логин и автора
			var msgType = msg.props.type === 0 ? 0 : this.state.login === msg.props.author ? 2 : 1;
			// var privacyHide = true;
			// debugger;
			// console.log('privacyHide: ' + privacyHide);
			if ( msg && msg.props && !privacyHide ) {
				newMessages = this.state.messages.concat(
					new ChatMsg({
						type: msgType,
						hideInfo: msg.props.hideInfo,
						author: msg.props.author,
						body: msg.props.body,
						userReply: this.handleReply,
						isReplyWithMsg: true,									// реплай по сообщению, а не по нику
						attachReply: msg.props.attachReply 		// если сообщение - реплай, цепляем оригинал
					})
				);
			}
			// debugger;
			this.setState({
  			messages: newMessages
			});
		}.bind(this));
	}

	handleReply(user, body, isPrivate) {
		this.setState({
			replyTo: [user, body, isPrivate]
		});
	}

	addMsg(argMsg){
		let replyTo = [ this.state.replyTo[0], this.state.replyTo[1] ];
		if ( argMsg.props.isPrivate ) {
			replyTo = replyTo.concat( argMsg.props.isPrivate );
		}
		let newMsg = new ChatMsg({
			type: argMsg.props.type,
			hideInfo: argMsg.props.hideInfo,
			author: argMsg.props.author,
			body: argMsg.props.body,
			userReply: this.handleReply,
			isReplyWithMsg: true,					// реплай по сообщению, а не по нику
			attachReply: replyTo 					// если сообщение - реплай, цепляем оригинал
		});
		// создаем новое сообщение, но теперь с хендлером ответа
		this.setState({
			replyTo: [],
		});
		if ( argMsg.props.local ) {
			this.setState({ messages: this.state.messages.concat(newMsg) });
		} else {
			socket.emit('addNewMsg', newMsg);
		}
	}

	userReplyAbort(){
		this.setState({
			replyTo:[] // replyAuthor, replyBody, replyPrivate
		});
	}

	addUser(user){
		this.setState({
			users:this.state.users.concat(user)
		});
		socket.emit('addNewUser', user);
	}

	setLogin(login) {
		this.setState({login: login});
	}

	render(){
		return(
			<div className="wrapper">	
				<div className="side-panel">	
					<ChatUsers
						userList={this.state.users}
						userReply={this.handleReply}
					/>
				</div>
	      <div className="main-panel">
					<ChatLog
						msgList={this.state.messages}
					/>
					<ChatInput
						msgSend={this.addMsg}
						newUser={this.addUser}
						setLogin={this.setLogin}
						allUsers={this.state.users}
						replyTo={this.state.replyTo}
						userReplyAbort={this.userReplyAbort}
					/>
				</div>
			</div>
		);
	}
}

function User(props) {
	return(
		<div className="user-item">
			<span>{props.name}</span>
			<button onClick={props.onClick} tabIndex="11">reply{props.isMsg ? " to message" : ""}</button>
		</div>
	);
}

class ChatLog extends React.Component {
	constructor(props) {
		super(props);
    this.refToMsgList = React.createRef();
	}

	componentDidUpdate(){
		// после добавления в список нового сообщения, скролл до него
		const node = this.refToMsgList.current;
		if ( node ) {
			let sum = -10;
			for (var j = 0; j < node.children.length; j++) {
				sum += node.children[j].clientHeight + 10;
			}
			node.scrollTo(0,sum);
		}
	}

	render(){
		let i = 0;
		const messages = this.props.msgList.map(el => {
			i++;
			return(
				<div key={i}> {el.render()} </div>
			);
		});
		return(
			<div ref={this.refToMsgList} className="msg-list">{messages}</div>
		);
	}
}


class ChatInput extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			msgText: '',
			login: '',
			isPrivateSet: false,
			isPrivateVal: false
		};
    this.onSubmit = this.onSubmit.bind(this);
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleCboxClick = this.handleCboxClick.bind(this);
    this.handleReplyAbort = this.handleReplyAbort.bind(this);
    this.refToCbox = React.createRef();
	}

  handleReplyAbort(){
		this.props.userReplyAbort();
  }

  handleTextChange(e) {
    this.setState({ msgText: e.target.value });
  }

	shouldComponentUpdate(){
		return true;
	}

  handleCboxClick(e) {
		let cboxVal = this.refToCbox.current.checked;
		if ( cboxVal ) {
			this.setState({
				isPrivateSet: true,
				isPrivateVal: true
			});
		}
		else {
			this.setState({
				isPrivateSet: true,
				isPrivateVal: false
			});
		}
  }

	componentDidUpdate(){
		var isPrivateValFlag = this.props.replyTo && this.props.replyTo[2] ? this.props.replyTo[2] : false;
		if ( this.refToCbox.current ) {
			if (  !this.state.isPrivateSet ? this.state.isPrivateVal !== isPrivateValFlag : false ) {
				this.setState({
					isPrivateVal: isPrivateValFlag
				});
				this.refToCbox.current.checked = isPrivateValFlag;
			}
		}
	}

  onSubmit(e) {
  	let inputText = this.state.msgText;
		e.preventDefault();
		if ( inputText && inputText.trim().length > 0 ) {
			if ( !this.state.login.length ) {
				// если новый юзер - надо выбрать уникальный логин
				if ( !!this.props.allUsers.find(function(el){ return el === inputText }) ) {
					// логин неуникальный - сообщение об ошибке
					this.props.msgSend(new ChatMsg({
						body: "nickname <<" + inputText + ">> is taken, pick another one",
						hideInfo: true,
						type: 0,
						local: true
					}));
				} else {
					this.setState(state => ({
						msgText: '',
						login: inputText
					}));
					this.props.setLogin(inputText);
					this.props.userReplyAbort();
					this.props.msgSend(new ChatMsg({
						body: inputText + " is joining the chat",
						hideInfo: true,
						type: 0
					}));
					this.props.newUser(inputText);	
				}
			} else {
				// если логин уже выбран, просто отправляем сообщение
				let newMsg = new ChatMsg({
					body: inputText,
					author: this.state.login,
					type: 2,
					isPrivate: this.state.isPrivateVal
				});
				this.setState({
					msgText: '',
					isPrivateSet: false,
					isPrivateVal: false
				});
				this.props.msgSend(newMsg);
			}
		}
	}

	render(){
		// debugger;
		return(
			<form className="form-dark" onSubmit={this.onSubmit}>
				<input
					type="text"
					tabIndex="1"
					placeholder={!this.state.login.length ? "Nickname" : "Message"}
					value={this.state.msgText}
					onChange={this.handleTextChange}
				></input>
				{ this.state.login && this.props.replyTo.length > 0 ? (
						<div className="flexbox ai-c">
							<div className="flexbox ai-c mr-10">
								<span>in reply to {this.props.replyTo[0]}{this.props.replyTo[1] ? "'s message" : ""}</span>
								<button type="button" tabIndex="3" onClick={this.handleReplyAbort}>X</button>
							</div>
							<label>
								<span>private</span>
								<input
									type="checkbox"
									ref={this.refToCbox}
									onClick={this.handleCboxClick}
								></input>
							</label>
						</div>
						):
						""
				}
				<input
					type="submit"
					value={!this.state.login ? "Set nickname" : "Send"}
					tabIndex="9"
				></input>
			</form>
		);
	}
}

class ChatMsg extends React.Component {
	// type, hideInfo, author, body
	handleReply(name, body, isPrivate){
		this.props.userReply(name, body, isPrivate);
	}

	render(){
		const reply = this.props.attachReply;
		const replyPhrase = reply && reply[2] ? "whispers to" : "in reply to";
		const name = reply && reply[0] ?
			<div><b>{this.props.author}</b><span className="fz-10 ff-a mr-0"> {replyPhrase} </span><b>{reply[0]}</b></div> :
			<b>{this.props.author}</b>
		;
		const replyMsg = reply && reply[1] ?
			<div className="bubble">
				<span className="fz-10 ff-a">Original message:</span><br></br>
				{reply[1]}
			</div>
			: "";
		return(
			<div className={
					this.props.type === 0 ? "msg-system" :
					this.props.type === 1 ? "msg-left" :
					this.props.type === 2 ? "msg-right" : ""
			}>
				{this.props.hideInfo ? "" : (
					<div className="msg-info">
						<User
							name={name}
							onClick={this.handleReply.bind(this, this.props.author, this.props.body, reply && reply[2] ? true : false)}
							isMsg={this.props.isReplyWithMsg}
						/>
					</div>
				)}
				{ replyMsg ? replyMsg : "" }
				<div>
					<span className="bubble">{this.props.body}</span>
				</div>
			</div>
		);
	}
}

class ChatUsers extends React.Component {
	handleReply(el){
		this.props.userReply(el);
	}
	render(){
		let i = 0;
		const users = this.props.userList.map(el => {
			i++;
			return(
				<User
					name=<b>{el}</b>
					key={i}
					onClick={this.handleReply.bind(this,el)}
				/>
			);
		});
		return(
			<div className="user-list">{users}</div>
		);
	}
}	


ReactDOM.render(
	<Chat />,
	document.getElementById('root')
);