import React from 'react';

import ChatMsg from './ChatMsg';
import ChatUsers from './ChatUsers';
import ChatLog from './ChatLog';
import ChatInput from './ChatInput';

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
			login: '',
			serverConnected: false
		};

		// api start

		socket.on ('setClientUserList', function(users){
			// обработка получения юзеров с сервера
			this.setState({
  			users: users,
			});
		}.bind(this));

		socket.on ('setClientMessageList', function(msg){
			// обработка получения сообщения с сервера
			var newMessages = this.state.messages;
			var pArgs = msg.props.attachReply; // свойства приватности сообщения
			var privacyHide = false;
			// скрываем, если приватное, или если адресовано не юзеру
			if ( pArgs[2] ) { // если есть метка приватности
				if ( 	pArgs[0] !== this.state.login &&
							msg.props.author !== this.state.login ) {
							// и юзер не отправитель и не получатель
					privacyHide = true;
				}
			}
			// если было системное (0), то не трогаем.
			// если сообщение от автора, добавляем в ленту справа. Если не от него - слева
			var msgType = msg.props.type === 0 ? 0 : this.state.login === msg.props.author ? 2 : 1;
			// если сообщение - дубликат для текущего юзера, не добавляем его в ленту
			var msgIsDuplicate = this.state.login && msg.props.userWithDuplicate === this.state.login;
			if ( msg && msg.props && !privacyHide && !msgIsDuplicate ) {
				newMessages = this.state.messages.concat(
					new ChatMsg({
						type: msgType,
						hideInfo: msg.props.hideInfo,
						author: msg.props.author,
						body: msg.props.body,
						userReply: this.handleReply,					// задаем обработчик реплая
						isReplyWithMsg: true,									// задаем реплай по сообщению, а не по нику
						attachReply: msg.props.attachReply 		// если сообщение - реплай, цепляем оригинал
					})
				);
			}
			this.setState({
  			messages: newMessages
			});
		}.bind(this));


		var serverOnlineMsg = "Server online";

		socket.on ('connect', function(users){
			// обработка подключения клиента к серверу - первый и следующий раз
			this.setState({
  			serverConnected: true
			});
			// генерируем сообщение для юзера
			this.addMsg(new ChatMsg({
				type: 0,
				body: serverOnlineMsg,
				local: true,
				hideInfo: true,
			}));
			// если юзер уже был подключен до этого, подключаем его еще раз
			if ( this.state.login ) {
				socket.emit('addNewUser', this.state.login);	
			}
		}.bind(this));

		socket.on ('disconnect', function(){
			this.addMsg(new ChatMsg({
				type: 0,
				body: "Server disconnected. Messages below will be sent later.",
				local: true,
				hideInfo: true,
			}));
			this.setState({
  			serverConnected: false
			});
			serverOnlineMsg = "Server online. Messages above are succesfully sent."
		}.bind(this));
	}

	addUser(user){
		this.setState({
			users:this.state.users.concat(user)
		});
		socket.emit('addNewUser', user);
	}

	// api end

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
			isReplyWithMsg: true,					// задаем реплай по сообщению, а не по нику
			attachReply: replyTo,					// если сообщение - реплай, цепляем оригинал
			userWithDuplicate: !this.state.serverConnected ? this.state.login : ''
		});
		// создаем новое сообщение, но теперь с хендлером ответа
		this.setState({
			replyTo: [],
		});
		if ( argMsg.props.local || !this.state.serverConnected ) {
			// сообщение локальное или сервер не доступен - пишем в ленту
			this.setState({ messages: this.state.messages.concat(newMsg) });
		}
		if ( !argMsg.props.local || !this.state.serverConnected ) {
			// не локальное - отдаем на сервер
			// или не доступен сервер - ставим в очередь на отправку
			socket.emit('addNewMsg', newMsg);
		}
	}

	userReplyAbort(){
		// если юзер отменяет реплай, отмечаем это
		this.setState({
			replyTo:[] // replyAuthor, replyBody, replyPrivate
		});
	}

	setLogin(login) {
		this.setState({login: login});
	}

	render(){

		return(
			<div className={"wrapper " + (this.state.login ? '' : 'app-disable')}>	
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

export default Chat;