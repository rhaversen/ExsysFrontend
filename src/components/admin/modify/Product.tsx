import { type OptionType, type ProductType } from '@/lib/backendDataTypes'
import React, { type ReactElement, useState } from 'react'
import EditableField from '@/components/admin/modify/ui/EditableField'
import EditableImage from '@/components/admin/modify/ui/EditableImage'
import ConfirmDeletion from '@/components/admin/modify/ui/ConfirmDeletion'
import EditingControls from '@/components/admin/modify/ui/EditControls'
import Options from '@/components/admin/modify/productOptions/Options'
import OptionsWindow from '@/components/admin/modify/OptionsWindow'
import axios from 'axios'
import { convertOrderWindowToUTC } from '@/lib/timeUtils'

const Product = ({
	product,
	options,
	onProductPatched,
	onProductDeleted
}: {
	product: ProductType
	options: OptionType[]
	onProductPatched: (product: ProductType) => void
	onProductDeleted: (id: ProductType['_id']) => void
}): ReactElement => {
	const API_URL = process.env.NEXT_PUBLIC_API_URL

	const [isEditing, setIsEditing] = useState(false)
	const [newProduct, setNewProduct] = useState<ProductType>(product)
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
	const [showOptions, setShowOptions] = useState(false)

	const patchProduct = (product: ProductType, productPatch: Omit<ProductType, '_id'>): void => {
		// Convert order window to UTC with convertOrderWindowToUTC
		const productPatchUTC = {
			...productPatch,
			orderWindow: convertOrderWindowToUTC(productPatch.orderWindow)
		}
		axios.patch(`${API_URL}/v1/products/${product._id}`, productPatchUTC).then((response) => {
			onProductPatched(response.data as ProductType)
		}).catch((error) => {
			console.error('Error updating product:', error)
			setNewProduct(product)
		})
	}

	const deleteProduct = (product: ProductType, confirm: boolean): void => {
		axios.delete(`${API_URL}/v1/products/${product._id}`, {
			data: { confirm }
		}).then(() => {
			onProductDeleted(product._id)
		}).catch((error) => {
			console.error('Error deleting product:', error)
			setNewProduct(product)
		})
	}

	const handleNameChange = (v: string): void => {
		setNewProduct({
			...newProduct,
			name: v
		})
	}

	const handlePriceChange = (v: string): void => {
		v = v.replace(/[^0-9.]/g, '')
		setNewProduct({
			...newProduct,
			price: Number(v)
		})
	}

	const handleImageChange = (v: string): void => {
		setNewProduct({
			...newProduct,
			imageURL: v
		})
	}

	const handleOrderWindowFromMinuteChange = (v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				from: {
					...newProduct.orderWindow.from,
					minute: Number(v)
				}
			}
		})
	}

	const handleOrderWindowFromHourChange = (v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				from: {
					...newProduct.orderWindow.from,
					hour: Number(v)
				}
			}
		})
	}

	const handleOrderWindowToMinuteChange = (v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				to: {
					...newProduct.orderWindow.to,
					minute: Number(v)
				}
			}
		})
	}

	const handleOrderWindowToHourChange = (v: string): void => {
		v = v.replace(/[^0-9]/g, '')
		setNewProduct({
			...newProduct,
			orderWindow: {
				...newProduct.orderWindow,
				to: {
					...newProduct.orderWindow.to,
					hour: Number(v)
				}
			}
		})
	}

	const handleAddOption = (v: OptionType): void => {
		setNewProduct({
			...newProduct,
			options: [...newProduct.options, v]
		})
	}

	const handleDeleteOption = (v: OptionType): void => {
		setNewProduct({
			...newProduct,
			options: newProduct.options.filter((option) => option._id !== v._id)
		})
	}

	const handleUndoEdit = (): void => {
		setNewProduct(product)
		setIsEditing(false)
	}

	const handleCompleteEdit = (): void => {
		patchProduct(product, newProduct)
		setIsEditing(false)
	}

	const handleDeleteProduct = (confirm: boolean): void => {
		deleteProduct(product, confirm)
	}

	return (
		<div className={`p-2 m-2 ${isEditing ? 'mp-10' : ''}`}>
			<div className="flex flex-col items-center justify-center">
				<div className="flex flex-row items-center justify-center">
					<div className="font-bold p-2 text-black">
						<EditableField
							text={newProduct.name}
							italic={false}
							editable={isEditing}
							edited={newProduct.name !== product.name}
							onChange={(v: string) => {
								handleNameChange(v)
							}}
						/>
					</div>
					<div className="flex flex-row italic items-center text-gray-700">
						<EditableField
							text={newProduct.price.toString()}
							italic={true}
							editable={isEditing}
							edited={newProduct.price !== product.price}
							onChange={(v: string) => {
								handlePriceChange(v)
							}}
						/>
						<div className="pl-1">
							{' kr'}
						</div>
					</div>
				</div>
				<div className="flex flex-row text-gray-700">
					<EditableField
						text={newProduct.orderWindow.from.hour.toString().padStart(2, '0')}
						italic={false}
						editable={isEditing}
						edited={newProduct.orderWindow.from.hour !== product.orderWindow.from.hour}
						onChange={(v: string) => {
							handleOrderWindowFromHourChange(v)
						}}
					/>:
					<EditableField
						text={newProduct.orderWindow.from.minute.toString().padStart(2, '0')}
						italic={false}
						editable={isEditing}
						edited={newProduct.orderWindow.from.minute !== product.orderWindow.from.minute}
						onChange={(v: string) => {
							handleOrderWindowFromMinuteChange(v)
						}}
					/>
					{' - '}
					<EditableField
						text={newProduct.orderWindow.to.hour.toString().padStart(2, '0')}
						italic={false}
						editable={isEditing}
						edited={newProduct.orderWindow.to.hour !== product.orderWindow.to.hour}
						onChange={(v: string) => {
							handleOrderWindowToHourChange(v)
						}}
					/>:
					<EditableField
						text={newProduct.orderWindow.to.minute.toString().padStart(2, '0')}
						italic={false}
						editable={isEditing}
						edited={newProduct.orderWindow.to.minute !== product.orderWindow.to.minute}
						onChange={(v: string) => {
							handleOrderWindowToMinuteChange(v)
						}}
					/>
				</div>
				<EditableImage
					defaultURL={product.imageURL}
					newURL={newProduct.imageURL}
					editable={isEditing}
					edited={newProduct.imageURL !== product.imageURL}
					onChange={(v: string) => {
						handleImageChange(v)
					}}
				/>
				{product.options.length > 0 &&
					<p className="italic text-gray-500">{'Tilvalg:'}</p>
				}
				{product.options.length === 0 && !isEditing &&
					<p className="italic text-gray-500">{'Ingen Tilvalg'}</p>
				}
				{product.options.length === 0 && isEditing &&
					<p className="italic text-gray-500">{'Tilføj Tilvalg:'}</p>
				}
				<Options
					selectedOptions={newProduct.options}
					editable={isEditing}
					onDeleteOption={(v: OptionType) => {
						handleDeleteOption(v)
					}}
					showOptions={() => {
						setShowOptions(true)
					}}
				/>
				<EditingControls
					isEditing={isEditing}
					setIsEditing={setIsEditing}
					handleUndoEdit={handleUndoEdit}
					handleCompleteEdit={handleCompleteEdit}
					setShowDeleteConfirmation={setShowDeleteConfirmation}
				/>
				{showDeleteConfirmation &&
					<ConfirmDeletion
						itemName={product.name}
						onClose={() => {
							setShowDeleteConfirmation(false)
						}}
						onSubmit={(confirm: boolean) => {
							setShowDeleteConfirmation(false)
							handleDeleteProduct(confirm)
						}}
					/>
				}
				{showOptions &&
					<OptionsWindow
						productName={newProduct.name}
						options={options}
						productOptions={newProduct.options}
						onAddOption={(v: OptionType) => {
							handleAddOption(v)
						}}
						onDeleteOption={(v: OptionType) => {
							handleDeleteOption(v)
						}}
						onClose={() => {
							setShowOptions(false)
						}}
					/>
				}
			</div>
		</div>
	)
}

export default Product
