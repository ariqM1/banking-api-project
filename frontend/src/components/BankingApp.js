import React, { useEffect, useState } from "react";
import "./BankingApp.scss";

const API_BASE_URL = "http://localhost:3001/api";

export default function BankingApp() {
	const [accounts, setAccounts] = useState([]);
	const [message, setMessage] = useState("");
	const [customerName, setCustomerName] = useState("");
	const [initialDeposit, setInitialDeposit] = useState("");
	const [balanceAccountId, setBalanceAccountId] = useState("");
	const [balanceInfo, setBalanceInfo] = useState(null);
	const [fromAccountId, setFromAccountId] = useState("");
	const [toAccountId, setToAccountId] = useState("");
	const [transferAmount, setTransferAmount] = useState("");
	const [description, setDescription] = useState("");
	const [historyAccountId, setHistoryAccountId] = useState("");
	const [transferHistory, setTransferHistory] = useState([]);

	const showMessage = (text) => {
		setMessage(text);
		setTimeout(() => setMessage(""), 3000);
	};

	const fetchAccounts = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/accounts`);
			const data = await response.json();
			setAccounts(data.accounts || []);
		} catch (error) {
			showMessage("Error fetching accounts");
		}
	};

	useEffect(() => {
		fetchAccounts();
	}, []);

	const createAccount = async () => {
		if (!customerName || !initialDeposit) return;

		try {
			const response = await fetch(`${API_BASE_URL}/accounts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerName,
					initialDeposit: parseFloat(initialDeposit),
				}),
			});

			const data = await response.json();
			if (response.ok) {
				showMessage("Account created!");
				setCustomerName("");
				setInitialDeposit("");
				fetchAccounts();
			} else {
				showMessage(data.error || "Error creating account");
			}
		} catch (error) {
			showMessage("Error creating account");
		}
	};

	const checkBalance = async () => {
		if (!balanceAccountId) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/accounts/${balanceAccountId}/balance`
			);
			const data = await response.json();
			setBalanceInfo(response.ok ? data : null);
			if (!response.ok)
				showMessage(data.error || "Error checking balance");
		} catch (error) {
			showMessage("Error checking balance");
			setBalanceInfo(null);
		}
	};

	const performTransfer = async () => {
		if (!fromAccountId || !toAccountId || !transferAmount) return;

		try {
			const response = await fetch(`${API_BASE_URL}/transfers`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					fromAccountId,
					toAccountId,
					amount: parseFloat(transferAmount),
					description,
				}),
			});

			const data = await response.json();
			if (response.ok) {
				showMessage("Transfer completed!");
				setFromAccountId("");
				setToAccountId("");
				setTransferAmount("");
				setDescription("");
				fetchAccounts();
			} else {
				showMessage(data.error || "Transfer failed");
			}
		} catch (error) {
			showMessage("Transfer failed");
		}
	};

	const getTransferHistory = async () => {
		if (!historyAccountId) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/accounts/${historyAccountId}/transfers`
			);
			const data = await response.json();
			setTransferHistory(response.ok ? data.transfers || [] : []);
			if (!response.ok)
				showMessage(data.error || "Error fetching history");
		} catch (error) {
			showMessage("Error fetching history");
			setTransferHistory([]);
		}
	};

	return (
		<div className="banking-app">
			{message && <div className="message">{message}</div>}

			<div className="grid">
				{/* Create Account */}
				<div className="card">
					<h2>Create Account</h2>
					<input
						type="text"
						placeholder="Customer Name"
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
					/>
					<input
						type="number"
						placeholder="Initial Deposit"
						value={initialDeposit}
						onChange={(e) => setInitialDeposit(e.target.value)}
					/>
					<button onClick={createAccount}>Create Account</button>
				</div>

				{/* Check Balance */}
				<div className="card">
					<h2>Check Balance</h2>
					<select
						value={balanceAccountId}
						onChange={(e) => setBalanceAccountId(e.target.value)}
					>
						<option value="">Select Account</option>
						{accounts.map((account) => (
							<option key={account.id} value={account.id}>
								{account.customerName} (ID: {account.id})
							</option>
						))}
					</select>
					<button onClick={checkBalance}>Check Balance</button>
					{balanceInfo && (
						<div className="balance-info">
							<h3>{balanceInfo.customerName}</h3>
							<div className="balance">
								${balanceInfo.balance.toFixed(2)}
							</div>
							<small>ID: {balanceInfo.accountId}</small>
						</div>
					)}
				</div>

				{/* Transfer Money */}
				<div className="card full-width">
					<h2>Transfer Money</h2>
					<div className="transfer-form">
						<select
							value={fromAccountId}
							onChange={(e) => setFromAccountId(e.target.value)}
						>
							<option value="">From Account</option>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.customerName} ($
									{account.balance.toFixed(2)})
								</option>
							))}
						</select>
						<select
							value={toAccountId}
							onChange={(e) => setToAccountId(e.target.value)}
						>
							<option value="">To Account</option>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.customerName} ($
									{account.balance.toFixed(2)})
								</option>
							))}
						</select>
						<input
							type="number"
							placeholder="Amount"
							value={transferAmount}
							onChange={(e) => setTransferAmount(e.target.value)}
						/>
						<input
							type="text"
							placeholder="Description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
						<button onClick={performTransfer}>Transfer</button>
					</div>
				</div>

				{/* All Accounts */}
				<div className="card">
					<h2>All Accounts</h2>
					{accounts.length === 0 ? (
						<p>No accounts found</p>
					) : (
						accounts.map((account) => (
							<div key={account.id} className="account-item">
								<strong>{account.customerName}</strong>
								<div>
									Balance: ${account.balance.toFixed(2)}
								</div>
								<small>ID: {account.id}</small>
							</div>
						))
					)}
				</div>

				{/* Transfer History */}
				<div className="card">
					<h2>Transfer History</h2>
					<select
						value={historyAccountId}
						onChange={(e) => setHistoryAccountId(e.target.value)}
					>
						<option value="">Select Account</option>
						{accounts.map((account) => (
							<option key={account.id} value={account.id}>
								{account.customerName} (ID: {account.id})
							</option>
						))}
					</select>
					<button onClick={getTransferHistory}>Get History</button>
					{transferHistory.length === 0 ? (
						<p>No transfers found</p>
					) : (
						transferHistory.map((transfer) => (
							<div key={transfer.id} className="transfer-item">
								<div className="transfer-header">
									<span className={`badge ${transfer.type}`}>
										{transfer.type}
									</span>
									<strong>
										${transfer.amount.toFixed(2)}
									</strong>
								</div>
								<div>
									{transfer.type === "incoming"
										? `From: ${transfer.fromCustomerName}`
										: `To: ${transfer.toCustomerName}`}
								</div>
								<small>
									{transfer.description} •{" "}
									{new Date(
										transfer.timestamp
									).toLocaleString()}
								</small>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
