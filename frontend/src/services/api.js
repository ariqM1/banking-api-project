const API_BASE_URL = "http://localhost:3001/api";

// utility func
const apiCall = async (endpoint, options = {}) => {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		headers: {
			"Content-Type": "application/json",
			...options.headers,
		},
		...options,
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.error || "API call failed");
	}

	return data;
};

// Customer API calls
export const checkCustomerExists = async (email) => {
	return apiCall(`/customers/check/${encodeURIComponent(email)}`);
};

export const createCustomer = async (customerData) => {
	return apiCall("/customers", {
		method: "POST",
		body: JSON.stringify(customerData),
	});
};

// Account API calls
export const fetchAccounts = async () => {
	const data = await apiCall("/accounts");
	return data.accounts || [];
};

export const createAccount = async (accountData) => {
	return apiCall("/accounts", {
		method: "POST",
		body: JSON.stringify(accountData),
	});
};

export const getAccountBalance = async (accountId) => {
	return apiCall(`/accounts/${accountId}/balance`);
};

export const depositToAccount = async (accountId, amount) => {
	return apiCall(`/accounts/${accountId}/deposit`, {
		method: "POST",
		body: JSON.stringify({ amount }),
	});
};

export const withdrawFromAccount = async (accountId, amount) => {
	return apiCall(`/accounts/${accountId}/withdraw`, {
		method: "POST",
		body: JSON.stringify({ amount }),
	});
};

export const searchAccounts = async (searchTerm) => {
	const data = await apiCall(
		`/accounts/search?q=${encodeURIComponent(searchTerm)}`
	);
	return data.accounts || [];
};

// Transfer API calls
export const createTransfer = async (transferData) => {
	return apiCall("/transfers", {
		method: "POST",
		body: JSON.stringify(transferData),
	});
};

export const getTransferHistory = async (accountId) => {
	const data = await apiCall(`/accounts/${accountId}/transfers`);
	return data.transfers || [];
};
