import { type ReactElement } from 'react'

const ValidationErrorWindow = ({
	errors
}: {
	errors: string[]
}): ReactElement => {
	return (
		<div
			className="my-2 not-italic rounded-lg border-2 border-red-800 text-red-800 font-bold flex flex-row items-center">
			<div className="flex flex-col mx-2">
				{errors.map((error, i) => (
					<p key={i + error} className="text-sm">
						{error}
					</p>
				))}
			</div>
		</div>
	)
}

export default ValidationErrorWindow
