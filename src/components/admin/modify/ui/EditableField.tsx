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
					className={`${italic ? 'italic' : ''} text-center bg-transparent border-2 rounded-md cursor-text px-1 py-0.5 pr-1.5 transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? 'border-orange-400 hover:border-orange-600 focus:border-orange-700' : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}
					readOnly={!editable}
					size={text.length}
					aria-label={text}
				/>
			}
			{!editable &&
				<p className={`${italic ? 'italic' : ''} p-0 m-0 text-center border-0 rounded-md cursor-text px-1 py-0.5 pr-1.5 transition-colors duration-200 ease-in-out focus:outline-none w-auto ${edited ? 'border-orange-400 hover:border-orange-600 focus:border-orange-700' : 'border-blue-500 hover:border-blue-600 focus:border-blue-700'}`}>
					{text}
				</p>
			}
		</div>
	)
}

export default EditableField
