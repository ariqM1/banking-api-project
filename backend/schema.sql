-- customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  createdAt TEXT NOT NULL
);

-- accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL,
  accountName TEXT NOT NULL,
  accountType TEXT DEFAULT 'checking',
  balance REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(customerId) REFERENCES customers(id),
  UNIQUE(customerId, accountName)  -- Prevent duplicate account names per customer
);

-- Keep transfers table
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

CREATE INDEX IF NOT EXISTS idx_accounts_customer ON accounts(customerId);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(fromAccountId);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(toAccountId);
CREATE INDEX IF NOT EXISTS idx_transfers_timestamp ON transfers(timestamp);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);