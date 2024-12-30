import React from 'react'

const ScrollIndicator = (): React.ReactElement => {
	return (
		<div className="fixed bottom-10 left-1/2 -translate-x-1/2">
			<div className="w-10 h-10 bg-white border-gray-800 border-2 rounded-full flex items-center justify-center">
				<div className="text-xl text-gray-800 animate-bounce">
					<div className="translate-y-1.5">
						{'V'}
					</div>
				</div>
			</div>
		</div>
	)
}

export default ScrollIndicator
