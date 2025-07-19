const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let accounts = [];
let transfers = [];

const findAccountById = (accountId) => {
	return accounts.find((account) => account.id === accountId);
};

const hasValidBalance = (accountId, amount) => {
	const account = findAccountById(accountId);
	return account && account.balance >= amount;
};

// Create a new bank account
app.post("/api/accounts", (req, res) => {
	const { customerName, initialDeposit } = req.body;

	if (!customerName || !customerName.trim()) {
		return res.status(400).json({ error: "Customer name is required" });
	}

	if (!initialDeposit || initialDeposit < 0) {
		return res
			.status(400)
			.json({ error: "Initial deposit must be a positive number" });
	}

	// Create new account
	const newAccount = {
		id: uuidv4(),
		customerName: customerName.trim(),
		balance: parseFloat(initialDeposit),
		createdAt: new Date().toISOString(),
	};

	accounts.push(newAccount);

	res.status(201).json({
		message: "Account created successfully",
		account: newAccount,
	});
});

// Get all accounts (for admin interface)
app.get("/api/accounts", (req, res) => {
	res.json({ accounts });
});

// Get account balance
app.get("/api/accounts/:accountId/balance", (req, res) => {
	const { accountId } = req.params;
	const account = findAccountById(accountId);

	if (!account) {
		return res.status(404).json({ error: "Account not found" });
	}

	res.json({
		accountId: account.id,
		customerName: account.customerName,
		balance: account.balance,
	});
});

// Transfer money between accounts
app.post("/api/transfers", (req, res) => {
	const { fromAccountId, toAccountId, amount, description } = req.body;

	// Validation
	if (!fromAccountId || !toAccountId) {
		return res
			.status(400)
			.json({ error: "Both from and to account IDs are required" });
	}

	if (!amount || amount <= 0) {
		return res
			.status(400)
			.json({ error: "Amount must be a positive number" });
	}

	if (fromAccountId === toAccountId) {
		return res
			.status(400)
			.json({ error: "Cannot transfer to the same account" });
	}

	// Check if accounts exist
	const fromAccount = findAccountById(fromAccountId);
	const toAccount = findAccountById(toAccountId);

	if (!fromAccount) {
		return res.status(404).json({ error: "From account not found" });
	}

	if (!toAccount) {
		return res.status(404).json({ error: "To account not found" });
	}

	// Check if from account has sufficient balance
	if (!hasValidBalance(fromAccountId, amount)) {
		return res.status(400).json({ error: "Insufficient balance" });
	}

	// Perform transfer
	const transferAmount = parseFloat(amount);
	fromAccount.balance -= transferAmount;
	toAccount.balance += transferAmount;

	// Record transfer
	const transfer = {
		id: uuidv4(),
		fromAccountId,
		toAccountId,
		fromCustomerName: fromAccount.customerName,
		toCustomerName: toAccount.customerName,
		amount: transferAmount,
		description: description || "Transfer",
		timestamp: new Date().toISOString(),
	};

	transfers.push(transfer);

	res.json({
		message: "Transfer completed successfully",
		transfer,
		fromAccountBalance: fromAccount.balance,
		toAccountBalance: toAccount.balance,
	});
});

// Get transfer history for an account
app.get("/api/accounts/:accountId/transfers", (req, res) => {
	const { accountId } = req.params;

	// Check if account exists
	const account = findAccountById(accountId);
	if (!account) {
		return res.status(404).json({ error: "Account not found" });
	}

	// Get transfers for this account
	const accountTransfers = transfers.filter(
		(transfer) =>
			transfer.fromAccountId === accountId ||
			transfer.toAccountId === accountId
	);

	// Format transfers to show direction
	const formattedTransfers = accountTransfers.map((transfer) => ({
		...transfer,
		type: transfer.fromAccountId === accountId ? "outgoing" : "incoming",
	}));

	res.json({
		accountId,
		customerName: account.customerName,
		transfers: formattedTransfers,
	});
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
	console.log(`Banking API server running on http://localhost:${PORT}`);
	console.log("Available endpoints:");
	console.log("POST /api/accounts - Create new account");
	console.log("GET /api/accounts - Get all accounts");
	console.log("GET /api/accounts/:id/balance - Get account balance");
	console.log("POST /api/transfers - Transfer money");
	console.log("GET /api/accounts/:id/transfers - Get transfer history");
});

module.exports = app;
