import React, { type ReactElement, useCallback, useState } from 'react'
import { type OptionType, type ProductType } from '@/lib/backendDataTypes'
import ProductCatalog from '@/components/orderstation/select/ProductCatalog'
import OptionsWindow from '@/components/orderstation/select/OptionsWindow'

const SelectionWindow = ({
	products,
	handleCartChange
}: {
	products: ProductType[]
	handleCartChange: (_id: ProductType['_id'] | OptionType['_id'], type: 'products' | 'options', change: number) => void
}): ReactElement => {
	const [showOptions, setShowOptions] = useState(false)
	const [selectedProductOptions, setSelectedProductOptions] = useState<OptionType[]>([])

	const handleProductSelect = useCallback((product: ProductType): void => {
		if (product.options.length > 0) {
			setSelectedProductOptions(product.options)
			setShowOptions(true)
		}
		handleCartChange(product._id, 'products', 1)
	}, [setSelectedProductOptions, setShowOptions, handleCartChange])

	const handleOptionSelect = useCallback((option: OptionType): void => {
		setShowOptions(false)
		handleCartChange(option._id, 'options', 1)
	}, [setShowOptions, handleCartChange])

	return (
		<div>
			<ProductCatalog
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
