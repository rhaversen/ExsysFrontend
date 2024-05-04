import React, { useState } from 'react'
import { ProductType, OptionType } from '@/app/orderstation/[room]/page'
import ProductCatalog from '@/components/orderstation/select/ProductCatalog'
import OptionsWindow from '@/components/orderstation/select/OptionsWindow'

const SelectionWindow = ({
	products,
	options,
	handleCartChange
}: {
	products: ProductType[]
	options: OptionType[]
	handleCartChange: (_id: string, type: 'products' | 'options', change: number) => void
}) => {
	const [showOptions, setShowOptions] = useState(false)
	const [selectedProductOptions, setSelectedProductOptions] = useState<OptionType[]>([])

	const handleProductSelect = (product: ProductType) => {
		handleCartChange(product._id, 'products', 1)

		if (product.options.length > 0) {
			const productOptions = options.filter(option => product.options.includes(option._id))
			setSelectedProductOptions(productOptions)
			setShowOptions(true)
		}
	}

	const handleOptionSelect = (option: OptionType) => {
		handleCartChange(option._id, 'options', 1)
		setShowOptions(false)
	}

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
					onClose={() => { setShowOptions(false) }}
				/>
			)}
		</div>
	)
}

export default SelectionWindow