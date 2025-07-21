import React from "react";

const MessageBar = ({ message }) => {
	if (!message) return null;

	return <div className={`message ${message.type}`}>{message.text}</div>;
};

export default MessageBar;
