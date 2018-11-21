import React from 'react';

import User from './User';

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

export default ChatUsers;