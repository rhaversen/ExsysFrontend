import { type ProductType, type ActivityType, type KioskType, type ConfigsType } from '@/types/backendDataTypes'

import { isCurrentTimeInOrderWindow, isKioskDeactivated } from './timeUtils'

export function filterAvailableProducts (products: ProductType[]): ProductType[] {
	return products.filter(p => p.isActive && isCurrentTimeInOrderWindow(p.orderWindow))
}

export function filterAvailableActivities (
	activities: ActivityType[],
	kiosk: KioskType | null,
	availableProducts: ProductType[]
): ActivityType[] {
	if (!kiosk) { return [] }
	return activities
		.filter(activity => kiosk.enabledActivities?.includes(activity._id))
		.filter(activity => {
			const activityProducts = availableProducts.filter(
				product => !activity.disabledProducts.includes(product._id)
			)
			return activityProducts.length > 0
		})
		.sort((a, b) => a.name.localeCompare(b.name))
}

export function isKioskCurrentlyClosed (
	kiosk: KioskType | null,
	config: ConfigsType | null,
	availableProducts: ProductType[]
): boolean {
	if (!kiosk || !config) { return true }

	const kioskIsDeactivated = isKioskDeactivated(kiosk)
	const dayEnabled = !config.configs.disabledWeekdays.includes(new Date().getDay())

	return kioskIsDeactivated || availableProducts.length === 0 || !dayEnabled
}
