import { ProductImages } from '@/lib/ProductImages'
import { type ReactElement } from 'react'
import Image from 'next/image'

const ImageList = ({
	onClose,
	onSelect
}: {
	onClose: () => void
	onSelect: (imageURL: string) => void
}): ReactElement => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/50 z-20">
			<button
				type="button"
				className="absolute inset-0 w-full h-full"
				onClick={onClose}
			>
				<span className="sr-only">
					{'Close'}
				</span>
			</button>
			<div
				className="bg-white rounded-3xl p-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
				<h3 className="text-gray-800 text-center text-2xl font-bold">Vælg Billede</h3>
				<div className="flex flex-wrap justify-center gap-4">
					{ProductImages.map((imageURL) => (
						<button
							key={imageURL}
							type="button"
							className="w-32 h-32 rounded-md hover:border-2 border-blue-500 hover:scale-105 transition-transform duration-200 ease-in-out"
							onClick={() => {
								onSelect(imageURL)
							}}
						>
							<span className="sr-only">
								{'Select image'}
							</span>
							<Image
								width={70}
								height={70}
								quality={30}
								src={imageURL}
								alt={imageURL}
								className="w-full h-full object-cover"
							/>
						</button>
					))}
					<button
						key={'none'}
						type="button"
						className="w-32 h-32 rounded-md hover:border-2 border-blue-500 hover:scale-105 transition-transform duration-200 ease-in-out"
						onClick={() => {
							onSelect('/none.svg')
						}}
					>
						<span className="sr-only">
							{'Select image'}
						</span>
						<Image
							width={70}
							height={70}
							quality={30}
							src={'/none.svg'}
							alt={'none'}
							className="w-full h-full object-cover"
						/>
					</button>
				</div>
				<button
					type="button"
					className="mt-4 w-full bg-blue-500 text-white rounded-md py-1"
					onClick={onClose}
				>
					{'Tilbage'}
				</button>
			</div>
		</div>
	)
}

export default ImageList
