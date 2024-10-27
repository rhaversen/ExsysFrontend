import React, { type ReactElement } from 'react'

const AmountIndicator = ({
	amount
}: {
	amount: number
}): ReactElement => {
	return (
		<div
			className={`${amount > 99 ? 'w-16' : 'w-10'} h-10 z-50 bg-blue-500 rounded-full border-2 border-blue-400 flex justify-center items-center drop-shadow-lg`}>
			<h3 className="text-2xl text-white">
				{amount > 99 ? '99+' : amount}
			</h3>
		</div>
	)
}

export default AmountIndicator
