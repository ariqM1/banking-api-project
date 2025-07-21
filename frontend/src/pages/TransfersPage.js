import React, { useEffect, useState } from "react";
import AccountSearch from "../components/AccountSearch";
import AccountSelector from "../components/AccountSelector";
import { createTransfer } from "../services/api";

const TransfersPage = ({ accounts, showMessage, refreshAccounts }) => {
	const [fromAccountId, setFromAccountId] = useState("");
	const [toAccountId, setToAccountId] = useState("");
	const [transferAmount, setTransferAmount] = useState("");
	const [transferDescription, setTransferDescription] = useState("");

	const handleTransfer = async () => {
		if (!fromAccountId || !toAccountId || !transferAmount) {
			showMessage("Please fill in all transfer fields", "error");
			return;
		}

		try {
			const data = await createTransfer({
				fromAccountId,
				toAccountId,
				amount: parseFloat(transferAmount),
				description: transferDescription,
			});

			const transfer = data.transfer;
			showMessage(
				`Transfer of $${transferAmount} completed! From ${transfer.fromAccount.name} to ${transfer.toAccount.name}`,
				"success"
			);

			// Reset form
			setFromAccountId("");
			setToAccountId("");
			setTransferAmount("");
			setTransferDescription("");

			refreshAccounts();
		} catch (error) {
			showMessage(error.message || "Transfer failed", "error");
		}
	};

	return (
		<div className="grid">
			<div className="card full-width">
				<h2>Transfer Money</h2>
				<div className="transfer-form">
					<div className="transfer-row">
						<div className="transfer-field">
							<label>From Account</label>
							<AccountSelector
								accounts={accounts}
								value={fromAccountId}
								onChange={setFromAccountId}
								placeholder="Select source account"
							/>
						</div>
						<div className="transfer-field">
							<label>To Account</label>
							<AccountSelector
								accounts={accounts}
								value={toAccountId}
								onChange={setToAccountId}
								placeholder="Select destination account"
							/>
						</div>
					</div>

					<AccountSearch onAccountSelect={setToAccountId} />

					<div className="transfer-row">
						<input
							type="number"
							placeholder="Amount"
							value={transferAmount}
							onChange={(e) => setTransferAmount(e.target.value)}
						/>
						<input
							type="text"
							placeholder="Description (optional)"
							value={transferDescription}
							onChange={(e) =>
								setTransferDescription(e.target.value)
							}
						/>
					</div>

					<button onClick={handleTransfer} className="primary">
						Transfer Money
					</button>
				</div>
			</div>
		</div>
	);
};

export default TransfersPage;
