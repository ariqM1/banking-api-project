import React, { useEffect, useState } from "react";
import "./App.scss";
import MessageBar from "./components/MessageBar";
import Navigation from "./components/Navigation";
import AccountsPage from "./pages/AccountsPage";
import CreateAccountPage from "./pages/CreateAccountPage";
import OperationsPage from "./pages/OperationsPage";
import TransfersPage from "./pages/TransfersPage";
import { fetchAccounts } from "./services/api";

export default function App() {
	const [message, setMessage] = useState("");
	const [activeTab, setActiveTab] = useState("create-account");
	const [accounts, setAccounts] = useState([]);

	const showMessage = (text, type = "info") => {
		setMessage({ text, type });
		setTimeout(() => setMessage(""), 4000);
	};

	const refreshAccounts = async () => {
		try {
			const accountsData = await fetchAccounts();
			setAccounts(accountsData);
		} catch (error) {
			showMessage("Error fetching accounts", "error");
		}
	};

	useEffect(() => {
		refreshAccounts();
	}, []);

	const renderActiveTab = () => {
		const commonProps = {
			accounts,
			showMessage,
			refreshAccounts,
		};

		switch (activeTab) {
			case "create-account":
				return <CreateAccountPage {...commonProps} />;
			case "operations":
				return <OperationsPage {...commonProps} />;
			case "transfers":
				return <TransfersPage {...commonProps} />;
			case "accounts":
				return <AccountsPage {...commonProps} />;
			default:
				return <CreateAccountPage {...commonProps} />;
		}
	};

	return (
		<div className="banking-app">
			<MessageBar message={message} />
			<Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
			<div className="tab-content">{renderActiveTab()}</div>
		</div>
	);
}
