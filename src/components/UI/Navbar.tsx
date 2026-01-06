"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./Button";
import { LogOut, User, Mail, PenSquare, ChevronDown } from "lucide-react";

export const Navbar = () => {
    const { user, loading, signOut } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="text-2xl font-serif font-bold text-gray-900">
                        Letter Maker
                    </Link>

                    <div className="flex items-center gap-6">
                        <Link href="/mailbox" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors">
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline">Mailbox</span>
                        </Link>

                        <Link href="/create" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors">
                            <PenSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Create Letter</span>
                        </Link>

                        {loading ? (
                            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                        ) : user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm text-gray-500">Signed in as</p>
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                signOut();
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <Button variant="secondary">Login</Button>
                                </Link>
                                <Link href="/register">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">Register</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
