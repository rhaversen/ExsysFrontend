import { type ReactElement, useCallback, useEffect, useState } from 'react'

import OptionsBar from '@/components/kiosk/select/OptionsBar'
import ProductCatalog from '@/components/kiosk/select/ProductCatalog'
import { useAnalytics } from '@/contexts/AnalyticsProvider'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'

const SelectionWindow = ({
	cart,
	products,
	options,
	handleCartChange
}: {
	cart: CartType
	products: ProductType[]
	options: OptionType[]
	handleCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', change: number) => void
}): ReactElement => {
	const { track } = useAnalytics()
	const [productsOptions, setProductsOptions] = useState<OptionType[]>([])

	const handleProductSelect = useCallback((product: ProductType): void => {
		track('product_select')
		handleCartChange(product._id, 'products', 1)
	}, [handleCartChange, track])

	const handleOptionSelect = useCallback((option: OptionType): void => {
		track('option_select')
		handleCartChange(option._id, 'options', 1)
	}, [handleCartChange, track])

	// Update the productsOptions to include all options which are in the products in the cart
	useEffect(() => {
		const optionsMap = new Map<string, OptionType>()

		products
			.filter(product => cart.products[product._id])
			.forEach(product => {
				product.options.forEach(option => {
					// Sets unique options by _id
					optionsMap.set(option, options.find(o => o._id === option) as OptionType)
				})
			})

		// Convert Map values to array
		setProductsOptions(Array.from(optionsMap.values()))
	}, [products, options, cart])

	return (
		<div className="flex flex-col h-full">
			{/* Product Catalog Section */}
			<div className="flex-1 overflow-y-auto">
				<ProductCatalog
					cart={cart}
					products={products}
					onProductSelect={handleProductSelect}
				/>
			</div>

			{/* Options Bar at the Bottom */}
			<div className="w-full shadow-t-md">
				<OptionsBar
					cart={cart}
					options={productsOptions}
					onOptionSelect={handleOptionSelect}
				/>
			</div>
		</div>
	)
}

export default SelectionWindow
