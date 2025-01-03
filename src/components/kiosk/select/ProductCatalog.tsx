import Product from '@/components/kiosk/select/Product'
import ScrollIndicator from '@/components/kiosk/select/ScrollIndicator'
import { isCurrentTimeInOrderWindow } from '@/lib/timeUtils'
import { type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useInterval } from 'react-use'

const ProductCatalog = ({
	cart,
	products,
	onProductSelect
}: {
	cart: CartType
	products: ProductType[]
	onProductSelect: (product: ProductType) => void
}): ReactElement => {
	const [productAvailabilities, setProductAvailabilities] = useState<Record<ProductType['_id'], boolean>>({})
	const [showScrollIndicator, setShowScrollIndicator] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const updateProductAvailabilities = useCallback(() => {
		setProductAvailabilities(
			products.reduce(
				(acc, product) => ({
					...acc,
					[product._id]: isCurrentTimeInOrderWindow(product.orderWindow)
				}),
				{}
			)
		)
	}, [products])

	// Initial update of product availabilities
	useEffect(() => {
		updateProductAvailabilities()
	}, [updateProductAvailabilities])

	useInterval(updateProductAvailabilities, 1000 * 10) // Update product availabilities every 10 seconds

	const checkScrollIndicator = (): void => {
		if (containerRef.current === null) return

		const {
			scrollTop,
			clientHeight,
			scrollHeight
		} = containerRef.current

		if (scrollHeight <= clientHeight) {
			setShowScrollIndicator(false)
			return
		}

		const nearBottom = scrollHeight - scrollTop <= clientHeight + 100
		setShowScrollIndicator(!nearBottom)
	}

	// Check scroll indicator on scroll
	useEffect(() => {
		const el = containerRef.current
		if (el !== null) {
			el.addEventListener('scroll', checkScrollIndicator)
			requestAnimationFrame(checkScrollIndicator)
		}

		return () => {
			el?.removeEventListener('scroll', checkScrollIndicator)
		}
	}, [])

	// Check scroll indicator on window resize
	useEffect(() => {
		window.addEventListener('resize', checkScrollIndicator)
		return () => {
			window.removeEventListener('resize', checkScrollIndicator)
		}
	}, [])

	// Check scroll indicator on product availability change
	useEffect(() => {
		checkScrollIndicator()
	}, [productAvailabilities])

	// Check scroll indicator on cart change
	useEffect(() => {
		checkScrollIndicator()
	}, [cart])

	// Check scroll indicator on product change
	useEffect(() => {
		checkScrollIndicator()
	}, [products])

	return (
		<div
			ref={containerRef}
			className="relative h-full overflow-y-auto overflow-x-hidden"
		>
			<div className="flex flex-wrap justify-center">
				{products
					.filter(product => productAvailabilities[product._id])
					.map((product) => (
						<Product
							key={product._id}
							product={product}
							disabled={!productAvailabilities[product._id]}
							onProductSelect={onProductSelect}
							amount={cart.products[product._id]}
						/>
					))}
			</div>
			{showScrollIndicator && (
				<div className="sticky bottom-14 left-0 w-full flex justify-center h-0">
					<ScrollIndicator />
				</div>
			)}
		</div>
	)
}

export default ProductCatalog
