import React from 'react'
import { FaExclamationTriangle, FaUserSlash, FaUsers } from 'react-icons/fa'
import { FiCheck, FiX } from 'react-icons/fi'

export type KioskWarningStatus = 'inactive' | 'multiSession' | 'noSession'

const KIOSK_RING = {
	open: 'ring-2 ring-green-400',
	closed: 'ring-2 ring-yellow-400'
}
const KIOSK_TEXT = {
	open: 'text-green-700',
	closed: 'text-yellow-700'
}
const KIOSK_WARNING = {
	inactive: {
		bg: 'bg-orange-400',
		icon: <FaExclamationTriangle className="w-3.5 h-3.5 text-orange-700" />
	},
	multiSession: {
		bg: 'bg-orange-400',
		icon: <FaUsers className="w-3.5 h-3.5 text-orange-700" />
	},
	noSession: {
		bg: 'bg-orange-400',
		icon: <FaUserSlash className="w-3.5 h-3.5 text-orange-700" />
	},
	none: {
		bg: 'bg-transparent',
		icon: null
	}
}

const KIOSK_STATUS_ICON = {
	open: <FiCheck className="w-3.5 h-3.5 text-green-600" />,
	closed: <FiX className="w-3.5 h-3.5 text-yellow-600" />
}

const KioskCircle = ({
	warningStatus,
	isClosed,
	kioskTag,
	className = ''
}: {
	warningStatus?: KioskWarningStatus
	isClosed: boolean
	kioskTag: string
	className?: string
}): React.ReactElement => {
	const ringClass = isClosed ? KIOSK_RING.closed : KIOSK_RING.open
	const textClass = isClosed ? KIOSK_TEXT.closed : KIOSK_TEXT.open
	const statusIcon = isClosed ? KIOSK_STATUS_ICON.closed : KIOSK_STATUS_ICON.open

	const warningKey = warningStatus ?? 'none'
	const { bg: bgClass, icon: warningIcon } = KIOSK_WARNING[warningKey]

	return (
		<div className={`relative ${className}`}>
			<div
				className={`w-16 h-16 text-xl rounded-full flex items-center justify-center font-semibold shadow-sm bg-white ${ringClass}`}
			>
				<div className={`absolute inset-2 rounded-full opacity-20 ${bgClass}`}></div>
				<span className={`relative z-10 text-lg ${textClass}`}>{kioskTag}</span>
			</div>
			<div
				className="absolute w-6 h-6 -bottom-1 -right-1 rounded-full flex items-center justify-center shadow-sm border border-gray-100 bg-white"
			>
				{warningIcon ?? statusIcon}
			</div>
		</div>
	)
}

export default KioskCircle
