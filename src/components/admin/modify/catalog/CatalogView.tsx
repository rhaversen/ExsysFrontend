'use client'

import AddOption from '@/components/admin/modify/catalog/option/AddOption'
import Option from '@/components/admin/modify/catalog/option/Option'
import AddProduct from '@/components/admin/modify/catalog/product/AddProduct'
import Product from '@/components/admin/modify/catalog/product/Product'
import SortingControl from '@/components/admin/modify/ui/SortingControl'
import ViewSelectionBar from '@/components/admin/ui/ViewSelectionBar'
import ResourceInfo from '@/components/admin/modify/ui/ResourceInfo'
import useSorting from '@/hooks/useSorting'
import type sortConfig from '@/lib/SortConfig'
import { type OptionType, type ProductType } from '@/types/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import { AdminImages } from '@/lib/images'
import Image from 'next/image'

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
			<div className="flex gap-4 p-4">
				{selectedView !== null && (
					<div className="flex flex-col gap-4">
						<button
							type="button"
							title="Tilføj"
							className="flex w-80 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded items-center justify-center"
							onClick={() => {
								switch (selectedView) {
									case 'Produkter':
										setShowAddProduct(true)
										break
									case 'Tilvalg':
										setShowAddOption(true)
										break
								}
							}}
						>
							<Image
								className="h-7 w-7"
								src={AdminImages.add.src}
								alt={AdminImages.add.alt}
								width={10}
								height={10}
							/>
							<span className="p-2 mx-5 font-bold">{`Tilføj ${selectedView}`}</span>
						</button>
						{isEnabled && (
							<SortingControl
								options={sortingOptions}
								currentField={sortField}
								currentDirection={sortDirection}
								onSortFieldChange={setSortField}
								onSortDirectionChange={setSortDirection}
							/>
						)}
						<ResourceInfo viewName={selectedView} />
					</div>
				)}
				<div className="flex-1">
					{selectedView === null && (
						<p className="flex justify-center p-10 font-bold text-gray-800 text-2xl">{'Vælg en kategori'}</p>
					)}
					{selectedView === 'Produkter' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(products).map((product) => (
								<div className="min-w-64" key={product._id}>
									<Product
										options={options}
										product={product}
										products={products}
									/>
								</div>
							))}
						</div>
					)}
					{selectedView === 'Tilvalg' && (
						<div className="flex flex-wrap justify-evenly gap-4">
							{sortByField(options).map((option) => (
								<div className="min-w-64 h-full" key={option._id}>
									<Option
										products={products}
										option={option}
										options={options}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
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
					products={products}
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
