import React, { useState } from "react";
import AccountSelector from "../components/AccountSelector";
import TransferHistory from "../components/TransferHistory";
import {
	depositToAccount,
	getAccountBalance,
	getTransferHistory,
	withdrawFromAccount,
} from "../services/api";

const OperationsPage = ({ accounts, showMessage, refreshAccounts }) => {
	const [selectedAccountId, setSelectedAccountId] = useState("");
	const [operationAmount, setOperationAmount] = useState("");
	const [balanceInfo, setBalanceInfo] = useState(null);
	const [historyAccountId, setHistoryAccountId] = useState("");
	const [transferHistory, setTransferHistory] = useState([]);

	const handleCheckBalance = async () => {
		if (!selectedAccountId) return;

		try {
			const data = await getAccountBalance(selectedAccountId);
			setBalanceInfo(data);
		} catch (error) {
			showMessage(error.message || "Error checking balance", "error");
			setBalanceInfo(null);
		}
	};

	const handleDeposit = async () => {
		if (!selectedAccountId || !operationAmount) return;

		try {
			await depositToAccount(
				selectedAccountId,
				parseFloat(operationAmount)
			);
			showMessage(
				`Deposit of $${operationAmount} successful!`,
				"success"
			);
			setOperationAmount("");
			refreshAccounts();

			if (balanceInfo && balanceInfo.accountId === selectedAccountId) {
				handleCheckBalance(); // Refresh balance if showing
			}
		} catch (error) {
			showMessage(error.message || "Deposit failed", "error");
		}
	};

	const handleWithdraw = async () => {
		if (!selectedAccountId || !operationAmount) return;

		try {
			await withdrawFromAccount(
				selectedAccountId,
				parseFloat(operationAmount)
			);
			showMessage(
				`Withdrawal of $${operationAmount} successful!`,
				"success"
			);
			setOperationAmount("");
			refreshAccounts();

			if (balanceInfo && balanceInfo.accountId === selectedAccountId) {
				handleCheckBalance(); // Refresh balance if showing
			}
		} catch (error) {
			showMessage(error.message || "Withdrawal failed", "error");
		}
	};

	const handleGetTransferHistory = async () => {
		if (!historyAccountId) return;

		try {
			const transfers = await getTransferHistory(historyAccountId);
			setTransferHistory(transfers);
		} catch (error) {
			showMessage(error.message || "Error fetching history", "error");
			setTransferHistory([]);
		}
	};

	return (
		<div className="grid">
			{/* Check Balance */}
			<div className="card">
				<h2>Check Balance</h2>
				<AccountSelector
					accounts={accounts}
					value={selectedAccountId}
					onChange={setSelectedAccountId}
					placeholder="Select Account"
					showBalance={false}
				/>
				<button onClick={handleCheckBalance}>Check Balance</button>
				{balanceInfo && (
					<div className="balance-info">
						<h3>{balanceInfo.customerName}</h3>
						<h4>{balanceInfo.accountName}</h4>
						<div className="balance">
							${balanceInfo.balance.toFixed(2)}
						</div>
						<small>{balanceInfo.accountType} account</small>
					</div>
				)}
			</div>

			{/* Deposit */}
			<div className="card">
				<h2>Deposit</h2>
				<AccountSelector
					accounts={accounts}
					value={selectedAccountId}
					onChange={setSelectedAccountId}
					placeholder="Select Account"
				/>
				<input
					type="number"
					placeholder="Amount"
					value={operationAmount}
					onChange={(e) => setOperationAmount(e.target.value)}
				/>
				<button onClick={handleDeposit}>Deposit</button>
			</div>

			{/* Withdraw */}
			<div className="card">
				<h2>Withdraw</h2>
				<AccountSelector
					accounts={accounts}
					value={selectedAccountId}
					onChange={setSelectedAccountId}
					placeholder="Select Account"
				/>
				<input
					type="number"
					placeholder="Amount"
					value={operationAmount}
					onChange={(e) => setOperationAmount(e.target.value)}
				/>
				<button onClick={handleWithdraw}>Withdraw</button>
			</div>

			{/* Transfer History */}
			<div className="card">
				<h2>Transfer History</h2>
				<AccountSelector
					accounts={accounts}
					value={historyAccountId}
					onChange={setHistoryAccountId}
					placeholder="Select Account"
					showBalance={false}
				/>
				<button onClick={handleGetTransferHistory}>Get History</button>
				<TransferHistory transfers={transferHistory} />
			</div>
		</div>
	);
};

export default OperationsPage;
