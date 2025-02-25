'use client'

import AddOption from '@/components/admin/modify/catalog/option/AddOption'
import Option from '@/components/admin/modify/catalog/option/Option'
import AddProduct from '@/components/admin/modify/catalog/product/AddProduct'
import Product from '@/components/admin/modify/catalog/product/Product'
import ItemList from '@/components/admin/modify/ui/ItemList'
import SortingControl from '@/components/admin/modify/ui/SortingControl'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import useSorting from '@/hooks/useSorting'
import type sortConfig from '@/lib/SortConfig'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'

const CatalogView = ({
	products,
	options
}: {
	products: ProductType[]
	options: OptionType[]
}): ReactElement => {
	const views = ['Produkter', 'Tilvalg']
	const [selectedView, setSelectedView] = useState<string | null>(null)
	const [showAddOption, setShowAddOption] = useState(false)
	const [showAddProduct, setShowAddProduct] = useState(false)

	const {
		setSortField,
		setSortDirection,
		sortByField,
		sortField,
		sortDirection,
		sortingOptions,
		isEnabled
	} = useSorting(selectedView as keyof typeof sortConfig)

	return (
		<div>
			<ViewSelectionBar
				subLevel={1}
				views={views}
				selectedView={selectedView}
				setSelectedView={setSelectedView}
			/>
			{isEnabled && (
				<SortingControl
					options={sortingOptions}
					currentField={sortField}
					currentDirection={sortDirection}
					onSortFieldChange={setSortField}
					onSortDirectionChange={setSortDirection}
				/>
			)}
			{selectedView === null &&
				<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
			}
			{selectedView === 'Produkter' &&
				<ItemList
					buttonText="Nyt Produkt"
					headerText="Produkter er de primære bestillingsmuligheder og vises som det første på kiosken, efter en aktivitet er valgt. Tilvalg kan knyttes til produkter og bliver vist, hvis produktet de tilhører er valgt. Bestillingsvinduet bestemmer, hvornår produkter vises på kioskerne. Hvis der ikke er nogen produkter inden for bestillingsvinduet, går kiosken i dvale."
					onAdd={() => {
						setShowAddProduct(true)
					}}
				>
					{sortByField(products).map((product) => (
						<div
							className="min-w-64"
							key={product._id}
						>
							<Product
								options={options}
								product={product}
								products={products}
							/>
						</div>
					))}
				</ItemList>
			}
			{selectedView === 'Tilvalg' &&
				<ItemList
					headerText="Tilvalg er sekundære bestillingsmuligheder, der knyttes til et eller flere produkter. De vises på kiosken, hvis mindst ét af de produkter, de er tilknyttet, er valgt."
					buttonText="Nyt Tilvalg"
					onAdd={() => {
						setShowAddOption(true)
					}}
				>
					{sortByField(options).map((option) => (
						<div
							className="min-w-64 h-full"
							key={option._id}
						>
							<Option
								option={option}
								options={options}
							/>
						</div>
					))}
				</ItemList>
			}
			{showAddProduct &&
				<AddProduct
					options={options}
					products={products}
					onClose={() => {
						setShowAddProduct(false)
					}}
				/>
			}
			{showAddOption &&
				<AddOption
					options={options}
					onClose={() => {
						setShowAddOption(false)
					}}
				/>
			}
		</div>
	)
}

export default CatalogView
