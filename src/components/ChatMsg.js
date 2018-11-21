import React from 'react';

import User from './User';

class ChatMsg extends React.Component {
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

export default ChatMsg;