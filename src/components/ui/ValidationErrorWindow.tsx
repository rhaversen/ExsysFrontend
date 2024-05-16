import React, { type ReactElement } from 'react'

const ValidationErrorWindow = ({
	message
}: {
	message: string
}): ReactElement => {
	return (
		<div className='relative transform translate-x-2 translate-y-2'>
			<div className='absolute w-2 h-2 bg-red-800 transform rotate-45 -translate-y-1 translate-x-1'></div>
			<div className='absolute rounded-md px-2 bg-red-800 text-white font-bold whitespace-nowrap overflow-ellipsis overflow-hidden'>
				{message}
			</div>
		</div>
	)
}

export default ValidationErrorWindow
