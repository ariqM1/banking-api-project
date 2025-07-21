import React from "react";

const AccountSelector = ({
	accounts,
	value,
	onChange,
	placeholder,
	showBalance = true,
}) => (
	<select value={value} onChange={(e) => onChange(e.target.value)}>
		<option value="">{placeholder}</option>
		{accounts.map((account) => (
			<option key={account.id} value={account.id}>
				{account.customerName} - {account.accountName}
				{showBalance && ` ($${account.balance.toFixed(2)})`}
			</option>
		))}
	</select>
);

export default AccountSelector;
