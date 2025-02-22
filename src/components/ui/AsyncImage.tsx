import { LoadingImage } from '@/lib/images'
import Image from 'next/image'
import React, { type ReactElement, useState, useEffect } from 'react'

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
	const [skipAnimation, setSkipAnimation] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => {
			if (!imageLoaded) {
				setSkipAnimation(false)
			}
		}, 50)

		setSkipAnimation(true)
		return () => { clearTimeout(timer) }
	}, [])

	return (
		<div className={className}>
			{!imageLoaded && (
				<Image
					width={width}
					height={height}
					quality={quality}
					src={LoadingImage.src}
					alt={LoadingImage.alt}
					priority
					className={`h-full w-full ${skipAnimation ? '' : 'transition-opacity duration-100 ease-in-out'} ${loadingLoaded ? 'opacity-100' : 'opacity-0'}`}
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
				className={`${skipAnimation ? '' : 'transition-opacity duration-300 ease-in-out'} ${imageLoaded ? 'opacity-100 h-full w-full' : 'opacity-0 h-0 w-0'}`}
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
