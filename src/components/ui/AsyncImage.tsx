import Image from 'next/image'
import React, { type ReactElement, useState } from 'react'
import { LoadingImage } from '@/lib/images'

const AsyncImage = ({
	className,
	width,
	height,
	quality,
	src,
	alt,
	priority,
	draggable
}: {
	className: string
	width: number
	height: number
	quality: number
	src: string
	alt: string
	priority: boolean
	draggable: boolean
}): ReactElement => {
	const [imageLoaded, setImageLoaded] = useState(false)
	const [loadingLoaded, setLoadingLoaded] = useState(false)

	return (
		<div className={className}>
			{!imageLoaded && (
				<Image
					width={width}
					height={height}
					quality={quality}
					src={LoadingImage.src}
					alt='Loading...'
					priority
					className={`h-full w-full transition-opacity duration-300 ease-in-out ${loadingLoaded ? 'opacity-100' : 'opacity-0'}`}
					draggable="false"
					onLoad={() => {
						setLoadingLoaded(true)
					}}
				/>
			)}
			<Image
				width={width}
				height={height}
				quality={quality}
				src={src}
				alt={alt}
				className={`transition-opacity duration-300 ease-in-out ${imageLoaded ? 'opacity-100 h-full w-full' : 'opacity-0 h-0 w-0'}`}
				draggable={draggable}
				priority={priority}
				onLoad={() => {
					setImageLoaded(true)
				}}
			/>
		</div>
	)
}

export default AsyncImage
