import Image from 'next/image'
import React from 'react'

import { KioskImages } from '@/lib/images'

const ScrollIndicator = (): React.ReactElement => {
	return (
		<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
			<div className="animate-bounce">
				<div className="translate-y-1 transform rotate-90">
					<Image
						src={KioskImages.scrollIndicator.src}
						alt={KioskImages.scrollIndicator.alt}
						className="filter invert"
						width={30}
						height={30}
						priority
					/>
				</div>
			</div>
		</div>
	)
}

export default ScrollIndicator
