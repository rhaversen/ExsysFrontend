import React, { type ReactElement } from 'react'

const AmountIndicator = ({
	amount
}: {
	amount: number
}): ReactElement => {
	return (
		<div className="w-10 h-10 z-50 bg-blue-500 font-bold rounded-full flex justify-center items-center">
			<h3 className="font-bold text-white">
				{amount}
			</h3>
		</div>
	)
}

export default AmountIndicator
