// Helper types
export interface Time {
	hour: number
	minute: number
}

export interface OrderWindow {
	from: Time
	to: Time
}

// Product types
export interface ProductType {
	_id: string
	name: string
	price: number
	orderWindow: OrderWindow
	options: OptionType[]
	imageURL?: string
	createdAt: string
	updatedAt: string
}

export interface PostProductType {
	name: string
	price: number
	orderWindow: OrderWindow
	options: Array<OptionType['_id']>
	imageURL?: string
}

export interface PatchProductType {
	name?: string
	price?: number
	orderWindow?: OrderWindow
	options?: Array<OptionType['_id']>
	imageURL?: string
}

// Option types
export interface OptionType {
	_id: string
	name: string
	price: number
	imageURL?: string
	createdAt: string
	updatedAt: string
}

export interface PostOptionType {
	name: string
	price: number
	imageURL?: string
}

export interface PatchOptionType {
	name?: string
	price?: number
	imageURL?: string
}

// Activity types
export interface ActivityType {
	_id: string
	roomId: RoomType | null
	name: string
	createdAt: string
	updatedAt: string
}

export interface PostActivityType {
	roomId?: RoomType['_id'] | null
	name: string
}

export interface PatchActivityType {
	roomId?: RoomType['_id'] | null
	name?: string
}

export interface ActivityTypeNonPopulated {
	_id: string
	roomId: RoomType['_id'] | null
	name: string
}

// Room types
export interface RoomType {
	_id: string
	name: string
	description: string
	createdAt: string
	updatedAt: string
}

export interface PostRoomType {
	name: string
	description: string
}

export interface PatchRoomType {
	name?: string
	description?: string
}

// Order types
export interface OrderType {
	_id: string
	products: Array<{ _id: ProductType['_id'], name: string, quantity: number }>
	options: Array<{ _id: OptionType['_id'], name: string, quantity: number }>
	activityId: ActivityType['_id']
	status: 'pending' | 'confirmed' | 'delivered'
	createdAt: string
	updatedAt: string
}

export interface PostOrderType {
	products: Array<{ id: ProductType['_id'], quantity: number }>
	options?: Array<{ id: OptionType['_id'], quantity: number }>
	activityId: ActivityType['_id']
	kioskId: KioskType['_id']
	checkoutMethod: 'sumUp' | 'cash' | 'mobilePay'
}

export interface PatchOrderType {
	orderIds: Array<OrderType['_id']>
	status: 'pending' | 'confirmed' | 'delivered'
}

// Reader types
export interface ReaderType {
	_id: string
	readerTag: string
	createdAt: string
	updatedAt: string
}

export interface PostReaderType {
	readerTag?: string
	pairingCode: string
}

export interface PatchReaderType {
	readerTag?: string | null
	pairingCode?: string
}

// Admin types
export interface AdminType {
	_id: string
	name: string
	createdAt: string
	updatedAt: string
}

export interface PostAdminType {
	name: string
	password: string
}

export interface PatchAdminType {
	name?: string
	password?: string
}

// Kiosk types
export interface KioskType {
	_id: string
	name: string
	kioskTag: string
	readerId: ReaderType | null
	activities: ActivityType[]
	createdAt: string
	updatedAt: string
}

export interface PostKioskType {
	name: string
	kioskTag?: string
	password: string
	readerId?: ReaderType['_id']
	activities: Array<ActivityType['_id']>
}

export interface PatchKioskType {
	name?: string
	kioskTag?: string | null
	password?: string
	readerId?: ReaderType['_id'] | null
	activities?: Array<ActivityType['_id']>
}

export interface KioskTypeNonPopulated {
	_id: string
	name: string
	kioskTag: string
	readerId: ReaderType['_id'] | null
	activities: ActivityTypeNonPopulated[]
}

// Session types
export interface SessionType {
	_id: string // Used for deletion and key in list
	sessionExpires: string | null // Used to determine if session is expired if stayLoggedIn is true (Uses rolling expiration) (ISO string)
	stayLoggedIn: boolean // Used to determine if session is persistent
	type: 'admin' | 'kiosk' | 'unknown' // Used to infer user information
	userId: AdminType['_id'] | KioskType['_id'] | null // Used to infer user information
	ipAddress: string // Ip address of the user
	loginTime: string // Time of login (ISO string)
	lastActivity: string // Time of last activity (ISO string)
	userAgent: string // Agent information
	isCurrentSession: boolean // Used to determine if session is current
}
