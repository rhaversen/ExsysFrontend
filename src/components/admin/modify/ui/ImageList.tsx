import AsyncImage from '@/components/ui/AsyncImage'
import CloseableModal from '@/components/ui/CloseableModal'
import ProductImages from '@/lib/ProductImages'
import Image from 'next/image'
import { type ReactElement } from 'react'

const ImageList = ({
	onClose,
	onSelect
}: {
	onClose: () => void
	onSelect: (imageURL: string) => void
}): ReactElement => {
	return (
		<CloseableModal onClose={onClose}>
			<h3 className="text-gray-800 text-center text-2xl font-bold">{'Vælg Billede'}</h3>
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
						<AsyncImage
							className="w-full h-full"
							width={70}
							height={70}
							quality={30}
							src={imageURL}
							alt={imageURL?.split('/').pop() ?? 'Item Image'}
							draggable={false}
							priority={true}
						/>
					</button>
				))}
				<button
					key="none"
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
						src="/none.svg"
						alt="none"
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
		</CloseableModal>
	)
}

export default ImageList
