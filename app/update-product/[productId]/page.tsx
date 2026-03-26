"use client";

import { readProductById, updateProduct } from "@/app/actions";
import ProductImage from "@/app/components/ProductImage";
import Wrapper from "@/app/components/Wrapper";
import { FormDataType, Product } from "@/app/type";
import { Category } from "@prisma/client";
import { useUser } from "@clerk/nextjs";
import { FileImage } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Page = ({ params }: { params: Promise<{ productId: string }> }) => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    id: "",
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    categoryName: "",
    categoryId: "",
    unit: "",
  });

  const fetchProduct = async () => {
    try {
      const { productId } = await params;
      if (email) {
        const fetchedProduct = await readProductById(productId, email);
        if (fetchedProduct) {
          setProduct(fetchedProduct);
          setFormData({
            id: fetchedProduct.id,
            name: fetchedProduct.name,
            description: fetchedProduct.description,
            price: fetchedProduct.price,
            imageUrl: fetchedProduct.imageUrl,
            categoryName: fetchedProduct.categoryName,
            categoryId: fetchedProduct.categoryId || "",
            unit: fetchedProduct.unit || "",
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du produit", error);
      toast.error("Erreur lors du chargement du produit");
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [email]);

  // Cleanup des URLs object
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    // Validation du fichier
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast.error(
          "Format de fichier non supporté. Veuillez choisir une image.",
        );
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        // 5MB
        toast.error("Fichier trop volumineux (maximum 5MB)");
        return;
      }

      // Cleanup de l'ancienne preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Gestion de l'image uniquement si un nouveau fichier est sélectionné
      if (file) {
        // Suppression de l'ancienne image si elle existe
        if (formData.imageUrl) {
          const resDelete = await fetch("/api/upload", {
            method: "DELETE",
            body: JSON.stringify({ path: formData.imageUrl }),
            headers: { "Content-Type": "application/json" },
          });
          const dataDelete = await resDelete.json();
          if (!dataDelete.success) {
            throw new Error(
              "Erreur lors de la suppression de l'ancienne image.",
            );
          }
        }

        // Upload de la nouvelle image
        const imageData = new FormData();
        imageData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: imageData,
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error("Erreur lors de l'upload de l'image.");
        }

        formData.imageUrl = data.path;
      }

      await updateProduct(formData, email);
      toast.success("Produit mis à jour avec succès !");
      router.push("/products");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || "Une erreur est survenue lors de la mise à jour.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-center items-start min-h-screen py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Breadcrumb */}
          <div className="text-xs text-base-content/40 font-medium tracking-widest uppercase mb-4">
            Catalogue &rsaquo; Produits &rsaquo; Modifier
          </div>

          <h1 className="text-2xl font-bold mb-8">Modifier le produit</h1>

          {product ? (
            <section className="flex md:flex-row flex-col gap-6">
              {/* Formulaire */}
              <form className="flex-1 space-y-4" onSubmit={handleSubmit}>
                {/* Nom du produit */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                      Nom du produit
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="ex. Tomates cerises bio"
                    className="input input-bordered w-full focus:input-accent transition-all"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                      Description
                    </span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Décrivez le produit…"
                    className="textarea textarea-bordered w-full focus:textarea-accent transition-all"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Prix + Unité en grille */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                        Prix
                      </span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      placeholder="0.00"
                      className="input input-bordered w-full focus:input-accent transition-all"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                        Unité
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:select-accent transition-all"
                      value={formData.unit}
                      onChange={handleChange}
                      name="unit"
                      required
                    >
                      <option value="">Sélectionner</option>
                      <option value="g">Gramme</option>
                      <option value="kg">Kilogramme</option>
                      <option value="l">Litre</option>
                      <option value="m">Mètre</option>
                      <option value="cm">Centimètre</option>
                      <option value="h">Heure</option>
                      <option value="pcs">Pièces</option>
                    </select>
                  </div>
                </div>

                {/* Catégorie (lecture seule) */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                      Catégorie
                    </span>
                  </label>
                  <input
                    type="text"
                    name="categoryName"
                    className="input input-bordered w-full bg-base-200 cursor-not-allowed"
                    value={formData.categoryName}
                    disabled
                  />
                  <p className="text-xs text-base-content/40 mt-1">
                    La catégorie ne peut pas être modifiée
                  </p>
                </div>

                {/* Upload d'image stylisé */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">
                      Nouvelle image
                    </span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-base-content/20 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                    <FileImage
                      strokeWidth={1.5}
                      className="h-5 w-5 text-base-content/40 group-hover:text-accent transition-colors"
                    />
                    <span className="text-sm text-base-content/50 group-hover:text-accent transition-colors">
                      {file ? file.name : "Changer l'image…"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-base-content/40 mt-1">
                    Laissez vide pour conserver l'image actuelle
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-accent flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Mise à jour...
                      </>
                    ) : (
                      "Mettre à jour"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/products")}
                    className="btn btn-outline"
                  >
                    Annuler
                  </button>
                </div>
              </form>

              {/* Panneau aperçu */}
              <div className="md:w-[260px] flex flex-col gap-4">
                {/* Image actuelle */}
                <div className="border-2 border-accent/30 rounded-3xl p-5 flex flex-col gap-3 bg-base-200/40">
                  <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider text-center">
                    Image actuelle
                  </p>
                  {formData.imageUrl && formData.imageUrl !== "" ? (
                    <div className="flex justify-center">
                      <ProductImage
                        src={formData.imageUrl}
                        alt={product.name}
                        heightClass="h-32"
                        widthClass="w-32"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileImage
                        strokeWidth={1}
                        className="h-10 w-10 text-base-content/30"
                      />
                      <span className="text-xs text-base-content/30">
                        Aucune image
                      </span>
                    </div>
                  )}
                </div>

                {/* Zone preview nouvelle image */}
                <div className="border-2 border-accent/30 rounded-3xl p-5 flex justify-center items-center min-h-[200px] bg-base-200/40">
                  {previewUrl ? (
                    <ProductImage
                      src={previewUrl}
                      alt="preview"
                      heightClass="h-40"
                      widthClass="w-40"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileImage
                        strokeWidth={1}
                        className="h-10 w-10 text-base-content/30"
                      />
                      <span className="text-xs text-base-content/30">
                        Aperçu nouvelle image
                      </span>
                    </div>
                  )}
                </div>

                {/* Mini résumé */}
                <div className="border border-base-content/10 rounded-2xl p-4 bg-base-100 space-y-2">
                  <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">
                    Résumé
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/50">Nom</span>
                    <span className="font-medium truncate max-w-[120px] text-right">
                      {formData.name || (
                        <span className="text-base-content/20">—</span>
                      )}
                    </span>
                  </div>
                  <div className="divider my-0 opacity-30" />
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/50">Prix</span>
                    <span className="font-medium">
                      {formData.price ? (
                        `${formData.price}${formData.unit ? ` / ${formData.unit}` : ""}`
                      ) : (
                        <span className="text-base-content/20">—</span>
                      )}
                    </span>
                  </div>
                  <div className="divider my-0 opacity-30" />
                  <div className="flex justify-between text-sm">
                    <span className="text-base-content/50">Catégorie</span>
                    <span className="font-medium">
                      {formData.categoryName || (
                        <span className="text-base-content/20">—</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="flex justify-center items-center py-20">
              <span className="loading loading-spinner text-accent loading-lg"></span>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;
