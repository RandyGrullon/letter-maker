"use client";

import React, { useEffect, useState } from "react";
import { getAllLetters } from "@/lib/db";
import { Letter } from "@/types";
import Link from "next/link";
import { Mail, MailOpen, Edit, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type TabType = 'sent' | 'received';

export default function MailboxPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('sent');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            getAllLetters()
                .then(setLetters)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] pt-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Filter letters based on active tab
    const sentLetters = letters.filter(letter => letter.senderId === user?.uid);
    const receivedLetters = letters.filter(letter => letter.recipientId === user?.uid);

    const displayedLetters = activeTab === 'sent' ? sentLetters : receivedLetters;

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 lg:p-16 pt-24">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
                        My Mailbox
                    </h1>
                    <p className="text-gray-500 text-lg">Your collection of digital letters</p>
                </header>

                {/* Tabs */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-white rounded-lg p-1 shadow-md">
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'sent'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Sent ({sentLetters.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'received'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Received ({receivedLetters.length})
                        </button>
                    </div>
                </div>

                {displayedLetters.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Mail className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-serif font-medium text-gray-700 mb-2">
                            {activeTab === 'sent' ? 'No sent letters yet' : 'No received letters yet'}
                        </h2>
                        <p className="text-gray-500">
                            {activeTab === 'sent'
                                ? 'Create your first letter to get started!'
                                : 'Wait for someone to send you a letter'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedLetters.map((letter, index) => (
                            <motion.div
                                key={letter.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
                                    {/* Letter Preview */}
                                    <div className="aspect-[4/3] bg-gradient-to-br from-indigo-50 to-purple-50 p-6 flex items-center justify-center">
                                        {letter.isRead ? (
                                            <MailOpen className="w-16 h-16 text-indigo-400" />
                                        ) : (
                                            <Mail className="w-16 h-16 text-indigo-600" />
                                        )}
                                    </div>

                                    {/* Letter Info */}
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <h3 className="font-serif text-xl font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                {letter.isRead ? 'Read Letter' : 'New Letter'}
                                            </h3>
                                            {activeTab === 'sent' && letter.recipientName && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    To: {letter.recipientName}
                                                </p>
                                            )}
                                            {activeTab === 'received' && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    From: Someone special
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/letter/${letter.id}`} className="flex-1">
                                                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </Link>
                                            {activeTab === 'sent' && (
                                                <Link href={`/edit/${letter.id}`}>
                                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                </Link>
                                            )}
                                        </div>

                                        {letter.createdAt && (
                                            <p className="text-xs text-gray-400 mt-4">
                                                {new Date(letter.createdAt?.seconds * 1000).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
