const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function findCustomerById(customerId) {
	return db.prepare("SELECT * FROM customers WHERE id = ?").get(customerId);
}

function findCustomerByEmail(email) {
	return db.prepare("SELECT * FROM customers WHERE email = ?").get(email);
}

function findAccountById(accountId) {
	return db
		.prepare(
			`
		SELECT a.*, c.name as customerName, c.email as customerEmail 
		FROM accounts a 
		JOIN customers c ON a.customerId = c.id 
		WHERE a.id = ?
	`
		)
		.get(accountId);
}

function getCustomerAccounts(customerId) {
	return db
		.prepare(
			"SELECT * FROM accounts WHERE customerId = ? ORDER BY accountName"
		)
		.all(customerId);
}

function searchAccountsByName(searchTerm) {
	return db
		.prepare(
			`
		SELECT a.*, c.name as customerName, c.email as customerEmail
		FROM accounts a 
		JOIN customers c ON a.customerId = c.id 
		WHERE a.accountName LIKE ? OR c.name LIKE ?
		ORDER BY c.name, a.accountName
		LIMIT 20
	`
		)
		.all(`%${searchTerm}%`, `%${searchTerm}%`);
}

function updateBalance(accountId, newBalance) {
	db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(
		newBalance,
		accountId
	);
}

// Routes

// Check if customer exists (by email)
app.get("/api/customers/check/:email", (req, res) => {
	const customer = findCustomerByEmail(req.params.email);

	if (customer) {
		const accounts = getCustomerAccounts(customer.id);
		res.json({
			exists: true,
			customer: {
				id: customer.id,
				name: customer.name,
				email: customer.email,
				accountCount: accounts.length,
			},
		});
	} else {
		res.json({ exists: false });
	}
});

// Create new customer
app.post("/api/customers", (req, res) => {
	const { name, email } = req.body;

	if (!name?.trim())
		return res.status(400).json({ error: "Customer name is required" });
	if (!email?.trim())
		return res.status(400).json({ error: "Email is required" });

	// Check if customer already exists
	const existingCustomer = findCustomerByEmail(email.trim().toLowerCase());
	if (existingCustomer)
		return res
			.status(409)
			.json({ error: "Customer with this email already exists" });

	const newCustomer = {
		id: uuidv4(),
		name: name.trim(),
		email: email.trim().toLowerCase(),
		createdAt: new Date().toISOString(),
	};

	db.prepare(
		`
		INSERT INTO customers (id, name, email, createdAt)
		VALUES (@id, @name, @email, @createdAt)
	`
	).run(newCustomer);

	res.status(201).json({
		message: "Customer created successfully",
		customer: newCustomer,
	});
});

// Create Account (now requires customerId and accountName)
app.post("/api/accounts", (req, res) => {
	const { customerId, accountName, accountType, initialDeposit } = req.body;

	if (!customerId)
		return res.status(400).json({ error: "Customer ID is required" });
	if (!accountName?.trim())
		return res.status(400).json({ error: "Account name is required" });
	if (initialDeposit == null || initialDeposit < 0)
		return res
			.status(400)
			.json({ error: "Initial deposit must be non-negative" });

	// Verify customer exists
	const customer = findCustomerById(customerId);
	if (!customer) return res.status(404).json({ error: "Customer not found" });

	// Check if customer already has an account with this name
	const existingAccount = db
		.prepare(
			`
		SELECT id FROM accounts 
		WHERE customerId = ? AND accountName = ?
	`
		)
		.get(customerId, accountName.trim());

	if (existingAccount)
		return res
			.status(409)
			.json({ error: "You already have an account with this name" });

	const newAccount = {
		id: uuidv4(),
		customerId: customerId,
		accountName: accountName.trim(),
		accountType: accountType || "checking", // Default to checking
		balance: parseFloat(initialDeposit),
		createdAt: new Date().toISOString(),
	};

	db.prepare(
		`
		INSERT INTO accounts (id, customerId, accountName, accountType, balance, createdAt)
		VALUES (@id, @customerId, @accountName, @accountType, @balance, @createdAt)
	`
	).run(newAccount);

	// Get customer accounts count
	const customerAccounts = getCustomerAccounts(customerId);

	res.status(201).json({
		message: "Account created successfully",
		account: {
			...newAccount,
			customerName: customer.name,
			customerEmail: customer.email,
		},
		totalCustomerAccounts: customerAccounts.length,
	});
});

// Get all accounts for a customer
app.get("/api/customers/:customerId/accounts", (req, res) => {
	const customer = findCustomerById(req.params.customerId);
	if (!customer) return res.status(404).json({ error: "Customer not found" });

	const accounts = getCustomerAccounts(req.params.customerId);

	res.json({
		customer: {
			id: customer.id,
			name: customer.name,
			email: customer.email,
		},
		accounts,
	});
});

// Search accounts
app.get("/api/accounts/search", (req, res) => {
	const { q } = req.query;

	if (!q || q.trim().length < 2) {
		return res
			.status(400)
			.json({ error: "Search term must be at least 2 characters" });
	}

	const accounts = searchAccountsByName(q.trim());
	res.json({
		searchTerm: q.trim(),
		results: accounts.length,
		accounts,
	});
});

// Get all accounts (admin view)
app.get("/api/accounts", (req, res) => {
	const accounts = db
		.prepare(
			`
		SELECT a.*, c.name as customerName, c.email as customerEmail
		FROM accounts a 
		JOIN customers c ON a.customerId = c.id
		ORDER BY c.name, a.accountName
	`
		)
		.all();

	res.json({ accounts });
});

// Get account balance
app.get("/api/accounts/:accountId/balance", (req, res) => {
	const account = findAccountById(req.params.accountId);
	if (!account) return res.status(404).json({ error: "Account not found" });

	res.json({
		accountId: account.id,
		accountName: account.accountName,
		customerId: account.customerId,
		customerName: account.customerName,
		customerEmail: account.customerEmail,
		accountType: account.accountType,
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

	res.json({
		message: "Deposit successful",
		newBalance,
		accountName: account.accountName,
		accountType: account.accountType,
		customerName: account.customerName,
	});
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

	res.json({
		message: "Withdrawal successful",
		newBalance,
		accountName: account.accountName,
		accountType: account.accountType,
		customerName: account.customerName,
	});
});

// Transfer money between any two accounts
app.post("/api/transfers", (req, res) => {
	const { fromAccountId, toAccountId, amount, description } = req.body;

	// Validation
	if (!fromAccountId || !toAccountId)
		return res
			.status(400)
			.json({ error: "Both from and to account IDs are required" });
	if (fromAccountId === toAccountId)
		return res
			.status(400)
			.json({ error: "Cannot transfer to the same account" });
	if (!amount || amount <= 0)
		return res
			.status(400)
			.json({ error: "Transfer amount must be positive" });

	// Get both accounts
	const fromAccount = findAccountById(fromAccountId);
	const toAccount = findAccountById(toAccountId);

	if (!fromAccount)
		return res.status(404).json({ error: "Source account not found" });
	if (!toAccount)
		return res.status(404).json({ error: "Destination account not found" });

	// Check sufficient funds (balance must never be negative)
	if (fromAccount.balance < amount)
		return res.status(400).json({
			error: "Insufficient funds",
			available: fromAccount.balance,
			requested: amount,
		});

	// Calculate new balances
	const newFromBalance = fromAccount.balance - parseFloat(amount);
	const newToBalance = toAccount.balance + parseFloat(amount);

	// Create transfer record
	const transfer = {
		id: uuidv4(),
		fromAccountId,
		toAccountId,
		amount: parseFloat(amount),
		description:
			description ||
			`Transfer from ${fromAccount.accountName} to ${toAccount.accountName}`,
		timestamp: new Date().toISOString(),
	};

	// Execute transfer in a transaction
	const insertTransfer = db.prepare(`
		INSERT INTO transfers (id, fromAccountId, toAccountId, amount, description, timestamp)
		VALUES (@id, @fromAccountId, @toAccountId, @amount, @description, @timestamp)
	`);

	const transaction = db.transaction(() => {
		updateBalance(fromAccountId, newFromBalance);
		updateBalance(toAccountId, newToBalance);
		insertTransfer.run(transfer);
	});

	transaction();

	// Determine transfer type for response
	const sameCustomer = fromAccount.customerId === toAccount.customerId;

	res.json({
		message: "Transfer completed successfully",
		transfer: {
			...transfer,
			sameCustomer,
			fromAccount: {
				id: fromAccount.id,
				name: fromAccount.accountName,
				customerName: fromAccount.customerName,
				newBalance: newFromBalance,
			},
			toAccount: {
				id: toAccount.id,
				name: toAccount.accountName,
				customerName: toAccount.customerName,
				newBalance: newToBalance,
			},
		},
	});
});

// Get transfer history for an account
app.get("/api/accounts/:accountId/transfers", (req, res) => {
	const accountId = req.params.accountId;
	const account = findAccountById(accountId);
	if (!account) return res.status(404).json({ error: "Account not found" });

	const stmt = db.prepare(`
		SELECT t.*, 
		       from_acc.accountName as fromAccountName,
		       from_acc.accountType as fromAccountType,
		       to_acc.accountName as toAccountName,
		       to_acc.accountType as toAccountType,
		       from_cust.name as fromCustomerName,
		       to_cust.name as toCustomerName
		FROM transfers t
		LEFT JOIN accounts from_acc ON t.fromAccountId = from_acc.id
		LEFT JOIN accounts to_acc ON t.toAccountId = to_acc.id
		LEFT JOIN customers from_cust ON from_acc.customerId = from_cust.id
		LEFT JOIN customers to_cust ON to_acc.customerId = to_cust.id
		WHERE t.fromAccountId = ? OR t.toAccountId = ?
		ORDER BY t.timestamp DESC
	`);

	const transfers = stmt.all(accountId, accountId).map((t) => ({
		...t,
		type: t.fromAccountId === accountId ? "outgoing" : "incoming",
	}));

	res.json({
		accountId,
		accountName: account.accountName,
		customerName: account.customerName,
		accountType: account.accountType,
		transfers,
	});
});

// Get all transfers for a customer (across all their accounts)
app.get("/api/customers/:customerId/transfers", (req, res) => {
	const customer = findCustomerById(req.params.customerId);
	if (!customer) return res.status(404).json({ error: "Customer not found" });

	const customerAccounts = getCustomerAccounts(req.params.customerId);
	const accountIds = customerAccounts.map((acc) => acc.id);

	if (accountIds.length === 0) {
		return res.json({
			customerId: req.params.customerId,
			customerName: customer.name,
			transfers: [],
		});
	}

	const placeholders = accountIds.map(() => "?").join(",");
	const stmt = db.prepare(`
		SELECT t.*, 
		       from_acc.accountName as fromAccountName,
		       from_acc.accountType as fromAccountType,
		       to_acc.accountName as toAccountName,
		       to_acc.accountType as toAccountType,
		       from_cust.name as fromCustomerName,
		       to_cust.name as toCustomerName
		FROM transfers t
		LEFT JOIN accounts from_acc ON t.fromAccountId = from_acc.id
		LEFT JOIN accounts to_acc ON t.toAccountId = to_acc.id
		LEFT JOIN customers from_cust ON from_acc.customerId = from_cust.id
		LEFT JOIN customers to_cust ON to_acc.customerId = to_cust.id
		WHERE t.fromAccountId IN (${placeholders}) OR t.toAccountId IN (${placeholders})
		ORDER BY t.timestamp DESC
	`);

	const transfers = stmt.all(...accountIds, ...accountIds);

	res.json({
		customerId: req.params.customerId,
		customerName: customer.name,
		accounts: customerAccounts.length,
		transfers,
	});
});

// Error handler
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
	console.log("Banking API server running on port");
});
