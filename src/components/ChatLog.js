import React from 'react';

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

export default ChatLog;