import React from 'react'
import Product from '@/components/order/Product'

type ProductProps = {
	_id: string;
	name: string;
	description: string;
	price: number;
};

type ProductsProps = {
	products: ProductProps[];
	quantities: Record<string, number>;
	onQuantityChange: (key: string, newQuantity: number) => void;
};

const Products: React.FC<ProductsProps> = ({
	products,
	quantities,
	onQuantityChange,
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
				/>
			))}
		</div>
	)
}

export default Products
