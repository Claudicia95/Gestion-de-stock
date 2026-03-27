"use client"

import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { deductStockWithTransaction, readProducts } from '../actions'
import Wrapper from '../components/Wrapper'
import ProductComponent from '../components/ProductComponent'
import EmptyState from '../components/EmptyState'
import ProductImage from '../components/ProductImage'
import { Trash } from 'lucide-react'
import { toast } from 'react-toastify'
import { OrderItem, Product } from '../type'

const Page = () => {

    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress as string

    const [products, setProducts] = useState<Product[]>([])
    const [order, setOrder] = useState<OrderItem[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

    const fetchProducts = async () => {
        try {
            if (email) {
                const products = await readProducts(email)
                if (products) {
                    setProducts(products)
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (email) fetchProducts()
    }, [email])

    const filteredAvailableProducts = products
        .filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((product) => !selectedProductIds.includes(product.id))
        .slice(0, 10)

    const handleAddToCart = (product: Product) => {
        setOrder((prevOrder) => {
            const existingProduct = prevOrder.find((item) => item.productId === product.id)

            let updatedOrder

            if (existingProduct) {
                updatedOrder = prevOrder.map((item) =>
                    item.productId === product.id
                        ? {
                            ...item,
                            quantity: Math.min(item.quantity + 1, product.quantity)
                        }
                        : item
                )
            } else {
                updatedOrder = [
                    ...prevOrder,
                    {
                        productId: product.id,
                        quantity: 1,
                        unit: product.unit,
                        imageUrl: product.imageUrl,
                        name: product.name,
                        availableQuantity: product.quantity,
                    }
                ]
            }

            setSelectedProductIds((prev) =>
                prev.includes(product.id) ? prev : [...prev, product.id]
            )

            return updatedOrder
        })
    }

    const handleQuantityChange = (productId: string, quantity: number) => {
        setOrder((prevOrder) =>
            prevOrder.map((item) =>
                item.productId === productId ? { ...item, quantity } : item
            )
        )
    }

    const handleRemoveFromCart = (productId: string) => {
        setOrder((prevOrder) => {
            const updated = prevOrder.filter((item) => item.productId !== productId)

            setSelectedProductIds((prev) =>
                prev.filter((id) => id !== productId)
            )

            return updated
        })
    }

    const handleSubmit = async () => {
        try {
            if (order.length === 0) {
                toast.error("Veuillez ajouter des produits à la commande.")
                return
            }

            const response = await deductStockWithTransaction(order, email)

            if (response?.success) {
                toast.success("Don confirmé avec succès !")
                setOrder([])
                setSelectedProductIds([])
                fetchProducts()
            } else {
                toast.error(`${response?.message}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 🔥 TOTAL PRODUITS
    const totalItems = order.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <Wrapper>
            <div className='flex flex-col md:flex-row gap-6'>

                {/* PRODUITS */}
                <div className='md:w-1/3 bg-base-200 p-4 rounded-2xl shadow-md'>
                    <input
                        type="text"
                        placeholder='🔍 Rechercher un produit...'
                        className='input input-bordered w-full mb-4 focus:outline-none focus:ring-2 focus:ring-primary'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <div className='space-y-3 max-h-[100px] overflow-y-auto pr-2'>
                        {filteredAvailableProducts.length > 0 ? (
                            filteredAvailableProducts.map((product) => (
                                <div key={product.id} className='hover:scale-[1.02] transition'>
                                    <ProductComponent
                                        add={true}
                                        product={product}
                                        handleAddToCart={handleAddToCart}
                                    />
                                </div>
                            ))
                        ) : (
                            <EmptyState
                                message='Aucun produit disponible'
                                IconComponent='PackageSearch'
                            />
                        )}
                    </div>
                </div>

                {/* PANIER */}
                <div className='md:w-2/3 bg-base-100 p-5 rounded-2xl shadow-md'>

                    {order.length > 0 ? (
                        <>
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className='text-xl font-semibold'>🛒 Panier</h2>
                                <span className='badge badge-primary'>
                                    {totalItems} articles
                                </span>
                            </div>

                            <div className='overflow-x-auto'>
                                <table className='table w-full'>
                                    <thead className='bg-base-200'>
                                        <tr>
                                            <th>Image</th>
                                            <th>Nom</th>
                                            <th>Quantité</th>
                                            <th>Unité</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {order.map((item) => (
                                            <tr key={item.productId} className='hover'>
                                                <td>
                                                    <ProductImage
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        heightClass='h-12'
                                                        widthClass='w-12'
                                                    />
                                                </td>

                                                <td className='font-medium'>
                                                    {item.name}
                                                </td>

                                                <td>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        min="1"
                                                        max={item.availableQuantity}
                                                        className='input input-bordered w-20 text-center'
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                item.productId,
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td className='capitalize'>
                                                    {item.unit}
                                                </td>

                                                <td>
                                                    <button
                                                        className='btn btn-sm btn-error btn-outline hover:scale-105 transition'
                                                        onClick={() =>
                                                            handleRemoveFromCart(item.productId)
                                                        }
                                                    >
                                                        <Trash className='w-4 h-4' />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className='flex justify-between items-center mt-6'>
                                <span className='text-lg font-semibold'>
                                    Total articles : {totalItems}
                                </span>

                                <button
                                    onClick={handleSubmit}
                                    className='btn btn-primary px-6 hover:scale-105 transition'
                                >
                                    ✅ Confirmer le Don
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className='flex justify-center items-center h-[300px]'>
                            <EmptyState
                                message='Aucun produit dans le panier'
                                IconComponent='HandHeart'
                            />
                        </div>
                    )}
                </div>
            </div>
        </Wrapper>
    )
}

export default Page