export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}

export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: OptionType[]
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

export interface OrderType {
	_id: string
	products: Array<{ ProductId: ProductType['_id'], quantity: number }>
	options: Array<{ OptionId: OptionType['_id'], quantity: number }>
	room: RoomType
	status: 'pending' | 'confirmed' | 'delivered'
}
