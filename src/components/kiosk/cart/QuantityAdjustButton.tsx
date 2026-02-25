import { type ReactElement } from 'react'

const QuantityAdjustButton = ({
	onClick,
	text
}: {
	onClick: () => void
	text: string
}): ReactElement => {
	return (
		<button
			type="button"
			className="w-10 h-10 text-2xl rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center cursor-pointer"
			onClick={onClick}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
