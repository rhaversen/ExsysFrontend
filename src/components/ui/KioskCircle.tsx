import React from 'react'
import { FiCheck, FiX } from 'react-icons/fi'

const KioskCircle = ({
	isClosed,
	content,
	size = 'md',
	className = ''
}: {
	isClosed: boolean
	content: string | React.ReactNode
	size?: 'sm' | 'md' | 'lg'
	className?: string
}): React.ReactElement => {
	// Calculate sizes based on the size prop
	const dimensions = {
		sm: 'w-12 h-12 text-base',
		md: 'w-16 h-16 text-xl',
		lg: 'w-20 h-20 text-2xl'
	}

	const indicatorSizes = {
		sm: 'w-5 h-5 -bottom-0.5 -right-0.5',
		md: 'w-6 h-6 -bottom-1 -right-1',
		lg: 'w-7 h-7 -bottom-1 -right-1'
	}

	const iconSizes = {
		sm: 12,
		md: 14,
		lg: 16
	}

	return (
		<div className={`relative ${className}`}>
			<div
				className={`${dimensions[size]} rounded-full flex items-center justify-center font-semibold shadow-sm ${isClosed
					? 'bg-white text-yellow-700 ring-2 ring-yellow-400'
					: 'bg-white text-green-700 ring-2 ring-green-400'
				}`}
				title={isClosed ? 'Lukket' : 'Åben'}
			>
				<div className={`absolute inset-2 rounded-full opacity-20 ${isClosed ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
				<span className="relative z-10">{content}</span>
			</div>
			<div className={`absolute ${indicatorSizes[size]} rounded-full flex items-center justify-center shadow-sm border border-gray-100 bg-white ${isClosed ? 'text-yellow-600' : 'text-green-600'}`}>
				{isClosed ? <FiX size={iconSizes[size]} /> : <FiCheck size={iconSizes[size]} />}
			</div>
		</div>
	)
}

export default KioskCircle
