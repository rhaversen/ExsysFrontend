import { type ReactElement, useEffect, useRef, useState } from 'react'

import Product from '@/components/kiosk/select/Product'
import ScrollIndicator from '@/components/kiosk/select/ScrollIndicator'
import { type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'

const ProductCatalog = ({
	cart,
	products,
	onProductSelect
}: {
	cart: CartType
	products: ProductType[]
	onProductSelect: (product: ProductType) => void
}): ReactElement => {
	const [showScrollIndicator, setShowScrollIndicator] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	const checkScrollIndicator = (): void => {
		if (containerRef.current === null) { return }

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
		const events = [
			'touchstart',
			'touchmove',
			'scroll'
		]

		if (el !== null) {
			events.forEach(event => {
				el.addEventListener(event, checkScrollIndicator)
				requestAnimationFrame(checkScrollIndicator)
			})
		}

		return () => {
			if (el !== null) {
				events.forEach(event => {
					el.removeEventListener(event, checkScrollIndicator)
				})
			}
		}
	}, [])

	// Check scroll indicator on prop change
	useEffect(() => {
		const timeoutId = setTimeout(() => { checkScrollIndicator() }, 10)
		return () => { clearTimeout(timeoutId) }
	}, [cart, products])

	// Add reset scroll handler
	useEffect(() => {
		const handleResetScroll = (): void => {
			if (containerRef.current !== null) {
				containerRef.current.scrollTo({
					top: 0,
					behavior: 'smooth'
				})
			}
		}

		window.addEventListener('resetScroll', handleResetScroll)
		return () => {
			window.removeEventListener('resetScroll', handleResetScroll)
		}
	}, [])

	return (
		<div
			ref={containerRef}
			className="relative h-full overflow-y-auto overflow-x-hidden"
		>
			<div className="flex flex-wrap justify-center">
				{products.map((product) => (
					<Product
						key={product._id}
						product={product}
						disabled={false}
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
