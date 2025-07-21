import React from "react";

const Navigation = ({ activeTab, setActiveTab }) => {
	const tabs = [
		{ id: "create-account", label: "Create Account" },
		{ id: "operations", label: "Operations" },
		{ id: "transfers", label: "Transfers" },
		{ id: "accounts", label: "All Accounts" },
	];

	return (
		<nav className="tabs">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					className={activeTab === tab.id ? "active" : ""}
					onClick={() => setActiveTab(tab.id)}
				>
					{tab.label}
				</button>
			))}
		</nav>
	);
};

export default Navigation;
