CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  customerName TEXT NOT NULL,
  balance REAL NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY,
  fromAccountId TEXT,
  toAccountId TEXT,
  amount REAL NOT NULL,
  description TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY(fromAccountId) REFERENCES accounts(id),
  FOREIGN KEY(toAccountId) REFERENCES accounts(id)
);
