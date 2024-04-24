const QuantityAdjustButton = ({
	onClick,
	text,
}: {
	onClick: () => void;
	text: string;
}) => {
	return (
		<button
			type="button"
			className="w-10 h-10 bg-transparent border-2 border-blue-500 text-blue-500 font-bold rounded-full flex justify-center items-center"
			onClick={onClick}
		>
			{text}
		</button>
	)
}

export default QuantityAdjustButton
