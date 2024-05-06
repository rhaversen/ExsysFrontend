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
			className={'w-10 h-10 bg-transparent border-2 font-bold rounded-full flex justify-center items-center border-blue-500 text-blue-500'}
			onClick={onClick}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
