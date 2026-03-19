"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ListTree, Menu, X } from 'lucide-react'

const NavBar = () => {

    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const navLinks = [
        { href: '/category', label: 'Catégories', icon: ListTree }
    ]

    const renderLinks = (baseClass: string) => {
        return (
            <>
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    const activeClass = isActive ? "btn-error" : "btn-ghost"
                    return (
                        <Link
                            href={href}
                            key={href}
                            onClick={() => setIsOpen(false)} // 🔥 ferme menu mobile
                            className={`${baseClass} ${activeClass} btn-xs flex gap-1 items-center`}
                        >
                            <Icon className='w-3 h-3' />
                            {label}
                        </Link>
                    )
                })}
            </>
        )
    }

    return (
        <>
            <div className='bg-base-100 py-1 px-4 md:px-12 sticky top-0 z-50 border-b border-base-300'>
                <div className='flex justify-between items-center max-w-7xl mx-auto'>

                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src='/logo.png'
                            alt='Logo'
                            width={200}
                            height={200}
                            priority
                            className="w-8 h-8 md:w-12 md:h-12"
                        />
                        <span className="text-base md:text-xl font-bold text-info">
                            HV♠c-stoCk
                        </span>
                    </Link>

                    {/* BOUTON MENU MOBILE */}
                    <button
                        className='btn w-fit sm:hidden'
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Menu className='w-4 h-4' />
                    </button>

                    {/* MENU DESKTOP */}
                    <div className='hidden space-x-1 sm:flex items-center btn-sm'>
                        {renderLinks("btn")}
                    </div>

                </div>
            </div>

            {/* MENU MOBILE */}
            {isOpen && (
                <div className={`absolute top-0 w-full bg-base-100 h-screen flex flex-col gap-2 p-4
                trabsition-all duration-300 sm:hidden z-50 ${isOpen ? "left-0" : "-left-full"}`}>
                    <button
                        className='btn w-fit sm:hidden'
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <X className='w-4 h-4' />
                    </button>
                    <div className="flex flex-col gap-2">
                        {renderLinks("btn")}
                    </div>
                    
                </div>
            )}
    
            <div className="h-2"></div>
        </>
    )
}

export default NavBar