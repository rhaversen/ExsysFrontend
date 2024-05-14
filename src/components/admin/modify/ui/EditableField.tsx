import React, { type ReactElement, useRef } from 'react'

const EditableField = ({
	text,
	italic,
	editable,
	edited,
	onChange
}: {
	text: string
	italic: boolean
	editable: boolean
	edited: boolean
	onChange: (v: string) => void
}): ReactElement => {
	const ref = useRef<HTMLInputElement>(null)

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		onChange(e.target.value)
	}

	return (
		<div>
			{editable &&
				<input
					ref={ref}
					type="text"
					value={text}
					onChange={handleInputChange}
					onBlur={handleInputChange}
					className={`${italic ? 'italic' : ''} text-center bg-transparent border-2 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? 'border-green-500 hover:border-green-600 focus:border-green-700' : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}
					readOnly={!editable}
					size={Math.max(text.length, 1)}
					aria-label={text}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 rounded-md cursor-text transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? 'border-green-500 hover:border-green-600 focus:border-green-700' : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}>
					{text}
				</p>
			}
		</div>
	)
}

export default EditableField
