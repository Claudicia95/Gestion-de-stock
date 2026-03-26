"use client";

import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { deductStockWithTransaction, readProducts } from "../actions";
import Wrapper from "../components/Wrapper";
import ProductComponent from "../components/ProductComponent";
import EmptyState from "../components/EmptyState";
import ProductImage from "../components/ProductImage";
import { Trash, Heart, Search } from "lucide-react";
import { toast } from "react-toastify";
import { OrderItem, Product } from "../type";

// Fonction utilitaire pour gérer les erreurs
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Une erreur est survenue";
};

const Page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      if (email) {
        const products = await readProducts(email);
        if (products) {
          setProducts(products);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des produits", error);
      toast.error("Erreur lors du chargement des produits");
    }
  };

  useEffect(() => {
    if (email) fetchProducts();
  }, [email]);

  const filteredAvailableProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) => !selectedProductIds.includes(product.id))
    .slice(0, 10);

  const handleAddToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} n'est plus disponible`);
      return;
    }

    setOrder((prevOrder) => {
      const existingProduct = prevOrder.find(
        (item) => item.productId === product.id
      );
      let updatedOrder;

      if (existingProduct) {
        updatedOrder = prevOrder.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.quantity),
              }
            : item
        );
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
          },
        ];
      }

      setSelectedProductIds((prevSelected) =>
        prevSelected.includes(product.id)
          ? prevSelected
          : [...prevSelected, product.id]
      );
      return updatedOrder;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setOrder((prevOrder) =>
      prevOrder.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setOrder((prevOrder) => {
      const updatedOrder = prevOrder.filter(
        (item) => item.productId !== productId
      );
      setSelectedProductIds((prevSelectedProductIds) =>
        prevSelectedProductIds.filter((id) => id !== productId)
      );
      return updatedOrder;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (order.length === 0) {
      toast.error("Veuillez ajouter des produits à la commande.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await deductStockWithTransaction(order, email);

      if (response?.success) {
        toast.success("Don confirmé avec succès !");
        setOrder([]);
        setSelectedProductIds([]);
        fetchProducts();
      } else {
        const errorMessage = response?.message || "Erreur lors de la confirmation du don";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Erreur lors de la confirmation", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-center items-start min-h-screen py-8 px-4">
        <div className="w-full max-w-7xl">
          {/* Breadcrumb */}
          <div className="text-xs text-base-content/40 font-medium tracking-widest uppercase mb-4">
            Don &rsaquo; Nouvelle commande
          </div>

          <h1 className="text-2xl font-bold mb-8">Faire un don</h1>

          <div className="flex md:flex-row flex-col-reverse gap-6">
            {/* Section produits disponibles */}
            <div className="md:w-1/3 space-y-4">
              {/* Barre de recherche */}
              <div className="form-control">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/40" />
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    className="input input-bordered w-full pl-9 focus:input-accent transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Liste des produits */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {filteredAvailableProducts.length > 0 ? (
                  filteredAvailableProducts.map((product, index) => (
                    <ProductComponent
                      key={product.id || index}
                      add={true}
                      product={product}
                      handleAddToCart={handleAddToCart}
                    />
                  ))
                ) : (
                  <EmptyState
                    message={
                      searchQuery
                        ? "Aucun produit ne correspond à votre recherche"
                        : "Aucun produit disponible"
                    }
                    IconComponent="PackageSearch"
                  />
                )}
              </div>
            </div>

            {/* Panneau de la commande */}
            <div className="md:w-2/3">
              <div className="border-2 border-base-content/10 rounded-3xl bg-base-100 overflow-hidden">
                <div className="p-4 border-b border-base-content/10 bg-base-200/30">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Heart className="h-5 w-5 text-accent" />
                    Votre commande
                  </h2>
                  <p className="text-xs text-base-content/40 mt-1">
                    {order.length} produit{order.length > 1 ? "s" : ""} sélectionné
                    {order.length > 1 ? "s" : ""}
                  </p>
                </div>

                {order.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr className="border-b border-base-content/10">
                            <th className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                              Image
                            </th>
                            <th className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                              Nom
                            </th>
                            <th className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                              Quantité
                            </th>
                            <th className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                              Unité
                            </th>
                            <th className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                              Action
                            </th>
                           </tr>
                        </thead>
                        <tbody>
                          {order.map((item) => (
                            <tr
                              key={item.productId}
                              className="border-b border-base-content/5 hover:bg-base-200/30 transition-colors"
                            >
                              <td>
                                <div className="flex justify-center">
                                  <ProductImage
                                    src={item.imageUrl}
                                    alt={item.name}
                                    heightClass="h-12"
                                    widthClass="w-12"
                                  />
                                </div>
                              </td>
                              <td className="font-medium">{item.name}</td>
                              <td>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min="1"
                                  max={item.availableQuantity}
                                  className="input input-bordered input-sm w-24 focus:input-accent transition-all"
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.productId,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>
                              <td className="capitalize text-base-content/60">
                                {item.unit}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                                  onClick={() => handleRemoveFromCart(item.productId)}
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 border-t border-base-content/10 bg-base-200/30">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-base-content/60">
                          Total produits
                        </span>
                        <span className="text-lg font-semibold">
                          {order.reduce((sum, item) => sum + item.quantity, 0)} unités
                        </span>
                      </div>
                      <button
                        onClick={handleSubmit}
                        className="btn btn-accent w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Confirmation en cours...
                          </>
                        ) : (
                          "Confirmer le don"
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-12">
                    <EmptyState
                      message="Aucun produit dans le panier"
                      IconComponent="HandHeart"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;