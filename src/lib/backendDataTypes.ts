export interface CartType {
	products: Record<ProductType['_id'], number>
	options: Record<OptionType['_id'], number>
}

export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: string[]
	imageURL?: string
}

export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
}

export interface RoomType {
	_id: string
	name: string
	description: string
}

export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}
