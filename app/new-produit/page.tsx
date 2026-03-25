"use client";

import React, { useEffect, useState } from "react";
import Wrapper from "../components/Wrapper";
import { useUser } from "@clerk/nextjs";
import { FormDataType } from "../type";
import { Category } from "@prisma/client";
import { createProduct, readCategories } from "../actions";
import { FileImage } from "lucide-react";
import ProductImage from "../components/ProductImage";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const Page = () => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress as string;
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    unit: "",
    imageUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (email) {
          const data = await readCategories(email);
          if (data) setCategories(data);
        }
      } catch (error) {
        console.error("Erreur lors du changement des catégories", error);
      }
    };
    fetchCategories();
  }, [email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner une image.");
      return;
    }
    try {
      const imageData = new FormData();
      imageData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: imageData,
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error("Erreur lors de l'upload de l'image.");
      } else {
        formData.imageUrl = data.path;
        await createProduct(formData, email);
        toast.success("Produit crée avec succès.");
        router.push("/products");
      }
    } catch (error) {
      console.log(error);
      toast.error("Il y a une erreur.");
    }
  };

  return (
    <Wrapper>
      <div className="flex justify-center items-start min-h-screen py-8 px-4">
        <div className="w-full max-w-3xl">

          {/* Breadcrumb */}
          <div className="text-xs text-base-content/40 font-medium tracking-widest uppercase mb-4">
            Catalogue &rsaquo; Produits &rsaquo; Nouveau
          </div>

          <h1 className="text-2xl font-bold mb-8">Créer un produit</h1>

          <section className="flex md:flex-row flex-col gap-6">

            {/* Formulaire */}
            <div className="flex-1 space-y-4">

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Nom du produit</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="ex. Tomates cerises bio"
                  className="input input-bordered w-full focus:input-accent transition-all"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Description</span>
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
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Prix</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    className="input input-bordered w-full focus:input-accent transition-all"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Unité</span>
                  </label>
                  <select
                    className="select select-bordered w-full focus:select-accent transition-all"
                    value={formData.unit}
                    onChange={handleChange}
                    name="unit"
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

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Catégorie</span>
                </label>
                <select
                  className="select select-bordered w-full focus:select-accent transition-all"
                  value={formData.categoryId}
                  onChange={handleChange}
                  name="categoryId"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload stylisé */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-xs font-medium text-base-content/60 uppercase tracking-wider">Image du produit</span>
                </label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-base-content/20 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all group">
                  <FileImage strokeWidth={1.5} className="h-5 w-5 text-base-content/40 group-hover:text-accent transition-colors" />
                  <span className="text-sm text-base-content/50 group-hover:text-accent transition-colors">
                    {file ? file.name : "Choisir un fichier…"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <button
                onClick={handleSubmit}
                className="btn btn-accent w-full mt-2"
              >
                Créer le produit
              </button>
            </div>

            {/* Panneau aperçu */}
            <div className="md:w-[260px] flex flex-col gap-4">

              {/* Zone preview image */}
              <div className="border-2 border-accent/30 rounded-3xl p-5 flex justify-center items-center min-h-[200px] bg-base-200/40">
                {previewUrl && previewUrl !== "" ? (
                  <ProductImage
                    src={previewUrl}
                    alt="preview"
                    heightClass="h-40"
                    widthClass="w-40"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 wiggle-animation">
                    <FileImage strokeWidth={1} className="h-10 w-10 text-error" />
                    <span className="text-xs text-base-content/30">Aucune image</span>
                  </div>
                )}
              </div>

              {/* Mini résumé */}
              <div className="border border-base-content/10 rounded-2xl p-4 bg-base-100 space-y-2">
                <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mb-3">Résumé</p>
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/50">Nom</span>
                  <span className="font-medium truncate max-w-[120px] text-right">
                    {formData.name || <span className="text-base-content/20">—</span>}
                  </span>
                </div>
                <div className="divider my-0 opacity-30" />
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/50">Prix</span>
                  <span className="font-medium">
                    {formData.price ? `${formData.price}` : <span className="text-base-content/20">—</span>}
                  </span>
                </div>
                <div className="divider my-0 opacity-30" />
                <div className="flex justify-between text-sm">
                  <span className="text-base-content/50">Unité</span>
                  <span className="font-medium">
                    {formData.unit || <span className="text-base-content/20">—</span>}
                  </span>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>
    </Wrapper>
  );
};

export default Page;