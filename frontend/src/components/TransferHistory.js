import React from "react";

const TransferHistory = ({ transfers }) => {
	if (transfers.length === 0) {
		return (
			<div className="transfer-history">
				<p>No transfers found</p>
			</div>
		);
	}

	return (
		<div className="transfer-history">
			{transfers.map((transfer) => (
				<div key={transfer.id} className="transfer-item">
					<div className="transfer-header">
						<span className={`badge ${transfer.type}`}>
							{transfer.type}
						</span>
						<strong>${transfer.amount.toFixed(2)}</strong>
					</div>
					<div className="transfer-details">
						{transfer.type === "incoming" ? (
							<span>
								From: {transfer.fromCustomerName} (
								{transfer.fromAccountName})
							</span>
						) : (
							<span>
								To: {transfer.toCustomerName} (
								{transfer.toAccountName})
							</span>
						)}
					</div>
					<small>
						{transfer.description} •{" "}
						{new Date(transfer.timestamp).toLocaleString()}
					</small>
				</div>
			))}
		</div>
	);
};

export default TransferHistory;
