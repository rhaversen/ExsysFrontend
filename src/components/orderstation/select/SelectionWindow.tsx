import React from 'react'
import { ProductType, OptionType } from '@/app/orderstation/[room]/page'
import ProductCatalog from '@/components/orderstation/select/ProductCatalog'

const SelectionWindow = ({
	products,
	options,
	handleCartChange
}: {
	products: ProductType[]
	options: OptionType[]
	handleCartChange: (_id: string, type: 'products' | 'options', change: number) => void
}) => {
	return (
		<div>
			<ProductCatalog
				products={products}
				onProductSelect={() => { }}
			/>
		</div>
	)
}

export default SelectionWindow