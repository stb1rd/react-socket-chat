import React from 'react';

import ChatMsg from './ChatMsg';

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

  handleTextChange(e) {
    this.setState({ msgText: e.target.value });
  }

  // обработка чекбокса (ЧБ) "приватное сообщение"
  handleReplyAbort(){
  	// изначально или после отмены ЧБ не трогали и значения в нем нет
  	this.setState({
			isPrivateSet: false,
			isPrivateVal: false
  	});
		this.props.userReplyAbort();
  }

  handleCboxClick(e) {
  	// если кликнули, отмечаем, что клик был и отмечаем его результат
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
		// после рендера определяем, передана ли приватность от кнопки реплая
		var isPrivateValFlag = this.props.replyTo && this.props.replyTo[2] ? this.props.replyTo[2] : false;
		if ( this.refToCbox.current ) {
			if (  !this.state.isPrivateSet ? this.state.isPrivateVal !== isPrivateValFlag : false ) {
				// если ЧБ не трогали, то верим переданной приватности
				this.setState({
					isPrivateVal: isPrivateValFlag
				});
				this.refToCbox.current.checked = isPrivateValFlag;
			}
		}
	}
	// конец обработки ЧБ

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
					// уникальный - добавляем его
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
				// не забываем обнулить ЧБ приватности
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
export default ChatInput;