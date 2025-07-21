import React, { useState } from "react";
import {
	checkCustomerExists,
	createAccount,
	createCustomer,
} from "../services/api";

const CreateAccountPage = ({ showMessage, refreshAccounts }) => {
	const [customerEmail, setCustomerEmail] = useState("");
	const [customerName, setCustomerName] = useState("");
	const [accountName, setAccountName] = useState("");
	const [accountType, setAccountType] = useState("checking");
	const [initialDeposit, setInitialDeposit] = useState("");
	const [isNewCustomer, setIsNewCustomer] = useState(true);
	const [existingCustomer, setExistingCustomer] = useState(null);

	const handleCheckCustomer = async () => {
		if (!customerEmail.trim()) {
			showMessage("Please enter an email address", "error");
			return;
		}

		try {
			const data = await checkCustomerExists(customerEmail.trim());

			if (data.exists) {
				setExistingCustomer(data.customer);
				setIsNewCustomer(false);
				setCustomerName(data.customer.name);
				showMessage(
					`Found existing customer: ${data.customer.name} (${data.customer.accountCount} accounts)`,
					"success"
				);
			} else {
				setExistingCustomer(null);
				setIsNewCustomer(true);
				setCustomerName("");
				showMessage(
					"Email not found. You can create a new customer account.",
					"info"
				);
			}
		} catch (error) {
			showMessage("Error checking customer", "error");
		}
	};

	const handleCreateCustomer = async () => {
		if (!customerName.trim() || !customerEmail.trim()) {
			showMessage("Please enter both name and email", "error");
			return null;
		}

		try {
			const data = await createCustomer({
				name: customerName.trim(),
				email: customerEmail.trim(),
			});

			setExistingCustomer(data.customer);
			setIsNewCustomer(false);
			showMessage("Customer created successfully!", "success");
			return data.customer;
		} catch (error) {
			showMessage(error.message || "Error creating customer", "error");
			return null;
		}
	};

	const handleCreateAccount = async () => {
		if (!accountName.trim() || !initialDeposit) {
			showMessage(
				"Please enter account name and initial deposit",
				"error"
			);
			return;
		}

		let customerId = existingCustomer?.id;

		// Create customer if new
		if (isNewCustomer) {
			const newCustomer = await handleCreateCustomer();
			if (!newCustomer) return;
			customerId = newCustomer.id;
		}

		try {
			await createAccount({
				customerId,
				accountName: accountName.trim(),
				accountType,
				initialDeposit: parseFloat(initialDeposit),
			});

			showMessage(
				`Account "${accountName}" created successfully!`,
				"success"
			);

			// Reset form
			setCustomerEmail("");
			setCustomerName("");
			setAccountName("");
			setInitialDeposit("");
			setExistingCustomer(null);
			setIsNewCustomer(true);

			refreshAccounts();
		} catch (error) {
			showMessage(error.message || "Error creating account", "error");
		}
	};

	return (
		<div className="grid">
			<div className="card full-width">
				<h2>Create New Account</h2>

				<div className="form-section">
					<h3>Step 1: Customer Information</h3>
					<div className="form-row">
						<input
							type="email"
							placeholder="Customer Email"
							value={customerEmail}
							onChange={(e) => setCustomerEmail(e.target.value)}
						/>
						<button onClick={handleCheckCustomer}>
							Check Customer
						</button>
					</div>

					{customerEmail && (
						<div className="customer-status">
							{isNewCustomer ? (
								<div className="new-customer">
									<h4>New Customer</h4>
									<input
										type="text"
										placeholder="Customer Name"
										value={customerName}
										onChange={(e) =>
											setCustomerName(e.target.value)
										}
									/>
								</div>
							) : existingCustomer ? (
								<div className="existing-customer">
									<h4>Existing Customer</h4>
									<p>
										<strong>{existingCustomer.name}</strong>
									</p>
									<p>
										{existingCustomer.accountCount} existing
										accounts
									</p>
								</div>
							) : null}
						</div>
					)}
				</div>

				{(existingCustomer || (isNewCustomer && customerName)) && (
					<div className="form-section">
						<h3>Step 2: Account Details</h3>
						<input
							type="text"
							placeholder="Account Name (e.g., 'Main Checking', 'Savings')"
							value={accountName}
							onChange={(e) => setAccountName(e.target.value)}
						/>
						<select
							value={accountType}
							onChange={(e) => setAccountType(e.target.value)}
						>
							<option value="checking">Checking</option>
							<option value="savings">Savings</option>
							<option value="business">Business</option>
						</select>
						<input
							type="number"
							placeholder="Initial Deposit"
							value={initialDeposit}
							onChange={(e) => setInitialDeposit(e.target.value)}
						/>
						<button
							onClick={handleCreateAccount}
							className="primary"
						>
							Create Account
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default CreateAccountPage;
