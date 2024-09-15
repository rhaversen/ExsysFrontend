import Option from '@/components/admin/modify/productOptions/Option'
import { type OptionType } from '@/types/backendDataTypes'
import { type ReactElement } from 'react'

const Options = ({
	selectedOptions,
	editable = true,
	onDeleteOption,
	showOptions
}: {
	selectedOptions: OptionType[]
	editable?: boolean
	onDeleteOption: (v: OptionType) => void
	showOptions: () => void
}): ReactElement => {
	return (
		<div className="flex flex-row flex-wrap">
			{selectedOptions.map((option) => (
				<Option
					key={option._id}
					option={option}
					editable={editable}
					onDelete={onDeleteOption}
				/>
			))}
			{editable &&
				<div className="m-1 text-center font-semibold border-2 border-blue-500 rounded-full">
					<button
						type="button"
						className="cursor-pointer"
						onClick={() => {
							showOptions()
						}}
					>
						<div className="text-blue-500 px-3 items-center">{' + '}</div>
					</button>
				</div>
			}
		</div>
	)
}

export default Options
