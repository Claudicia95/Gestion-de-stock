"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { HandHeart, LayoutDashboard, ListTree, Menu, PackagePlus, Receipt, ShoppingBasket, Warehouse, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { checkAndAdddAssociation } from "../actions";
import Stock from "./Stock";

const Navbar = () => {
  const { user } = useUser();

  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Tableau de Bord", icon: LayoutDashboard },
    { href: "/products", label: "Produits", icon: ShoppingBasket },
    { href: "/new-produit", label: "Nouveau produit", icon: PackagePlus },
    { href: "/category", label: "Catégories", icon: ListTree },
    { href: "/give", label: "Donner", icon: HandHeart },
    { href: "/transactions", label: "Transaction", icon: Receipt },
  ];
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress && user.fullName) {
      checkAndAdddAssociation(
        user?.primaryEmailAddress?.emailAddress,
        user.fullName,
      );
    }
  }, [user]);

  const renderLinks = (baseClass: string) => (
    <>
      {navLinks.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        const activeClass = isActive ? "btn-error" : "btn-ghost";
        return (
          <Link
            href={href}
            key={href}
            className={`${baseClass} ${activeClass} btn-sm flex gap-2 items-center`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
      <button className="btn btn-sm"
            onClick={() =>(document.getElementById("my_modal_stock") as HTMLDialogElement).showModal()}>
            <Warehouse className="w-4 h-4"/>
            Alimenter les stocks
      </button>
    </>
  );

  return (
    <div className="border-b border-base-300 px-5 md:px-[10%] py-4 relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="p-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                priority
                className="w-8 h-8 md:w-12 md:h-12"
              />
              <span className="text-base md:text-xl font-bold text-info">
                HV♠C Stock
              </span>
            </Link>
          </div>
        </div>

        <button
          className="btn w-fit sm:hidden btn-sm"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden space-x-2 sm:flex items-center">
          {renderLinks("btn")}
          <UserButton />
        </div>
      </div>

      <div
        className={`absolute top-0 w-full bg-base-100 h-screen flex flex-col gap-2 p-4 
                transition-all duration-300 sm:hidden z-50 ${menuOpen ? "left-0" : "-left-full"} `}
      >
        <div className="flex justify-between">
          <UserButton />
          <button
            className="btn w-fit sm:hidden btn-sm"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {renderLinks("btn")}
      </div>
      <Stock/>
    </div>
  );
};

export default Navbar;
