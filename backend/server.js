const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helpers
function findAccountById(accountId) {
	return db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
}

function updateBalance(accountId, newBalance) {
	db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(
		newBalance,
		accountId
	);
}

// Routes

// Create Account
app.post("/api/accounts", (req, res) => {
	const { customerName, initialDeposit } = req.body;

	if (!customerName?.trim())
		return res.status(400).json({ error: "Customer name is required" });
	if (initialDeposit == null || initialDeposit < 0)
		return res
			.status(400)
			.json({ error: "Initial deposit must be non-negative" });

	const newAccount = {
		id: uuidv4(),
		customerName: customerName.trim(),
		balance: parseFloat(initialDeposit),
		createdAt: new Date().toISOString(),
	};

	db.prepare(
		`
		INSERT INTO accounts (id, customerName, balance, createdAt)
		VALUES (@id, @customerName, @balance, @createdAt)
	`
	).run(newAccount);

	res.status(201).json({ message: "Account created", account: newAccount });
});

// Get all accounts
app.get("/api/accounts", (req, res) => {
	const accounts = db.prepare("SELECT * FROM accounts").all();
	res.json({ accounts });
});

// Get account balance
app.get("/api/accounts/:accountId/balance", (req, res) => {
	const account = findAccountById(req.params.accountId);
	if (!account) return res.status(404).json({ error: "Account not found" });

	res.json({
		accountId: account.id,
		customerName: account.customerName,
		balance: account.balance,
	});
});

// Deposit
app.post("/api/accounts/:accountId/deposit", (req, res) => {
	const { amount } = req.body;
	const account = findAccountById(req.params.accountId);

	if (!account) return res.status(404).json({ error: "Account not found" });
	if (!amount || amount <= 0)
		return res.status(400).json({ error: "Amount must be positive" });

	const newBalance = account.balance + parseFloat(amount);
	updateBalance(account.id, newBalance);

	res.json({ message: "Deposit successful", newBalance });
});

// Withdraw
app.post("/api/accounts/:accountId/withdraw", (req, res) => {
	const { amount } = req.body;
	const account = findAccountById(req.params.accountId);

	if (!account) return res.status(404).json({ error: "Account not found" });
	if (!amount || amount <= 0)
		return res.status(400).json({ error: "Amount must be positive" });
	if (account.balance < amount)
		return res.status(400).json({ error: "Insufficient funds" });

	const newBalance = account.balance - parseFloat(amount);
	updateBalance(account.id, newBalance);

	res.json({ message: "Withdrawal successful", newBalance });
});

// Transfer money
app.post("/api/transfers", (req, res) => {
	const { fromAccountId, toAccountId, amount, description } = req.body;

	if (!fromAccountId || !toAccountId || fromAccountId === toAccountId)
		return res.status(400).json({ error: "Invalid from/to account IDs" });
	if (!amount || amount <= 0)
		return res.status(400).json({ error: "Invalid amount" });

	const from = findAccountById(fromAccountId);
	const to = findAccountById(toAccountId);
	if (!from || !to)
		return res
			.status(404)
			.json({ error: "One or both accounts not found" });
	if (from.balance < amount)
		return res.status(400).json({ error: "Insufficient funds" });

	const newFromBalance = from.balance - amount;
	const newToBalance = to.balance + amount;

	const transfer = {
		id: uuidv4(),
		fromAccountId,
		toAccountId,
		amount,
		description: description || "Transfer",
		timestamp: new Date().toISOString(),
	};

	const insert = db.prepare(`
		INSERT INTO transfers (id, fromAccountId, toAccountId, amount, description, timestamp)
		VALUES (@id, @fromAccountId, @toAccountId, @amount, @description, @timestamp)
	`);

	const transaction = db.transaction(() => {
		updateBalance(from.id, newFromBalance);
		updateBalance(to.id, newToBalance);
		insert.run(transfer);
	});

	transaction();

	res.json({ message: "Transfer successful", transfer });
});

// Get transfer history
app.get("/api/accounts/:accountId/transfers", (req, res) => {
	const accountId = req.params.accountId;
	const account = findAccountById(accountId);
	if (!account) return res.status(404).json({ error: "Account not found" });

	const stmt = db.prepare(`
		SELECT * FROM transfers
		WHERE fromAccountId = ? OR toAccountId = ?
		ORDER BY timestamp DESC
	`);
	const transfers = stmt.all(accountId, accountId).map((t) => ({
		...t,
		type: t.fromAccountId === accountId ? "outgoing" : "incoming",
	}));

	res.json({ accountId, customerName: account.customerName, transfers });
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
	console.log("Banking API server running");
});
