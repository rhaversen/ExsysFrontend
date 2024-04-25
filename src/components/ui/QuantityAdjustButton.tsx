const QuantityAdjustButton = ({
	onClick,
	text,
	available,
}: {
	onClick: () => void
	text: string
	available: boolean
}) => {
	return (
		<button
			type="button"
			className={`w-10 h-10 bg-transparent border-2 font-bold rounded-full flex justify-center items-center ${available
				? 'border-blue-500 text-blue-500'
				: 'border-gray-400 text-gray-400'
			}`}
			onClick={onClick}
			disabled={!available}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
