import OptionsBar from '@/components/orderstation/select/OptionsBar'
import ProductCatalog from '@/components/orderstation/select/ProductCatalog'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import { type CartType } from '@/types/frontendDataTypes'
import React, { type ReactElement, useCallback, useEffect, useState } from 'react'

const SelectionWindow = ({
	cart,
	products,
	handleCartChange
}: {
	cart: CartType
	products: ProductType[]
	handleCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', change: number) => void
}): ReactElement => {
	const [productsOptions, setProductsOptions] = useState<OptionType[]>([])

	const handleProductSelect = useCallback((product: ProductType): void => {
		handleCartChange(product._id, 'products', 1)
	}, [handleCartChange])

	const handleOptionSelect = useCallback((option: OptionType): void => {
		handleCartChange(option._id, 'options', 1)
	}, [handleCartChange])

	// Update the productsOptions to include all options which are in the products in the cart
	useEffect(() => {
		const optionsMap = new Map<string, OptionType>()

		products
			.filter(product => cart.products[product._id])
			.forEach(product => {
				product.options.forEach(option => {
					// Sets unique options by _id
					optionsMap.set(option._id, option)
				})
			})

		// Convert Map values to array
		setProductsOptions(Array.from(optionsMap.values()))
	}, [products, cart])

	return (
		<div>
				<ProductCatalog
					cart={cart}
					products={products}
					onProductSelect={handleProductSelect}
				/>
			{showOptions && (
				<OptionsWindow
					productOptions={selectedProductOptions}
					onOptionSelect={handleOptionSelect}
					onClose={() => {
						setShowOptions(false)
					}}
				/>
			)}
		</div>
	)
}

export default SelectionWindow
