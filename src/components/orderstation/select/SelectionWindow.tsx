import React from 'react'
import { ProductType, OptionType } from '@/app/orderstation/[room]/page'
import ProductCatalog from '@/components/orderstation/select/ProductCatalog'

const SelectionWindow = ({
	products,
	options,
	onCartChange
}: {
	products: ProductType[]
	options: OptionType[]
	onCartChange: (_id: string, type: 'products' | 'options', quantity: number) => void
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