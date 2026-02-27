import { type ReactElement, useCallback } from 'react'

import ProductCatalog from '@/components/kiosk/select/ProductCatalog'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'

const SelectionWindow = ({
	cart,
	products,
	onProductChange
}: {
	cart: CartType
	products: ProductType[]
	onProductChange: (productId: ProductType['_id'], change: number) => void
}): ReactElement => {
	const { track } = useAnalytics()

	const handleProductSelect = useCallback((product: ProductType): void => {
		track('product_select', { productId: product._id })
		onProductChange(product._id, 1)
	}, [onProductChange, track])

	return (
		<ProductCatalog
			cart={cart}
			products={products}
			onProductSelect={handleProductSelect}
		/>
	)
}

export default SelectionWindow
