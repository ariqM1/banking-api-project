import React, { useEffect, useState } from "react";
import { searchAccounts } from "../services/api";

const AccountSearch = ({ onAccountSelect }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState([]);

	const handleSearch = async (term) => {
		if (!term || term.length < 2) {
			setSearchResults([]);
			return;
		}

		try {
			const results = await searchAccounts(term);
			setSearchResults(results);
		} catch (error) {
			setSearchResults([]);
		}
	};

	useEffect(() => {
		const timeoutId = setTimeout(() => handleSearch(searchTerm), 300);
		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	const handleAccountSelect = (accountId) => {
		onAccountSelect(accountId);
		setSearchTerm("");
		setSearchResults([]);
	};

	return (
		<div className="search-section">
			<label>Or search for destination account:</label>
			<input
				type="text"
				placeholder="Search by account name or customer name..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
			{searchResults.length > 0 && (
				<div className="search-results">
					{searchResults.map((account) => (
						<div
							key={account.id}
							className="search-result"
							onClick={() => handleAccountSelect(account.id)}
						>
							<strong>{account.customerName}</strong> -{" "}
							{account.accountName}
							<small>
								{" "}
								({account.accountType}, $
								{account.balance.toFixed(2)})
							</small>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default AccountSearch;
