import React from 'react'
import Product from '@/components/order/Product'

type ProductProps = {
	_id: string;
	name: string;
	description: string;
	price: number;
};

const Products = ({
	products,
	quantities,
	availabilities,
	onQuantityChange,
}: {
	products: ProductProps[];
	quantities: Record<string, number>;
	availabilities: Record<string, boolean>;
	onQuantityChange: (key: string, newQuantity: number) => void;
}) => {
	return (
		<div>
			{products.map((product) => (
				<Product
					key={product._id}
					id={product._id}
					initialQuantity={quantities[product._id]}
					name={product.name}
					description={product.description}
					price={product.price}
					onQuantityChange={onQuantityChange}
					available={availabilities[product._id]}
				/>
			))}
		</div>
	)
}

export default Products
