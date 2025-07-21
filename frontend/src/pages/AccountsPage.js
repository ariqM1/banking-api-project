import React from "react";

const AccountsPage = ({ accounts }) => {
	return (
		<div className="grid">
			<div className="card full-width">
				<h2>All Accounts ({accounts.length})</h2>
				{accounts.length === 0 ? (
					<div className="empty-state">
						<h3>No accounts found</h3>
						<p>Create your first account to get started!</p>
					</div>
				) : (
					<div className="accounts-list">
						{accounts.map((account) => (
							<div key={account.id} className="account-item">
								<div className="account-header">
									<h3>{account.customerName}</h3>
									<span className="account-type">
										{account.accountType}
									</span>
								</div>
								<div className="account-details">
									<h4>{account.accountName}</h4>
									<div className="balance">
										${account.balance.toFixed(2)}
									</div>
								</div>
								<small>
									Created:{" "}
									{new Date(
										account.createdAt
									).toLocaleDateString()}{" "}
									• ID: {account.id}
								</small>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default AccountsPage;
