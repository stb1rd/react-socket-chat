import React from 'react';

function User(props) {
	return(
		<div className="user-item">
			<span>{props.name}</span>
			<button onClick={props.onClick} tabIndex="11">reply{props.isMsg ? " to message" : ""}</button>
		</div>
	);
}

export default User;