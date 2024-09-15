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
			className="w-16 h-16 text-5xl border-4 rounded-full border-blue-500 text-blue-500"
			onClick={onClick}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
