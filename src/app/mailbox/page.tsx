"use client";

import React, { useEffect, useState } from "react";
import { getAllLetters, updateLetterTitle, deleteLetter } from "@/lib/db";
import { Letter } from "@/types";
import Link from "next/link";
import { Mail, MailOpen, Edit, Eye, Pencil, X, ArrowLeft, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/UI/Input";
import { Button } from "@/components/UI/Button";
import toast from "react-hot-toast";
import Image from "next/image";

type TabType = 'sent' | 'received';

export default function MailboxPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [letters, setLetters] = useState<Letter[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('sent');
    const [initialTabSet, setInitialTabSet] = useState(false);
    const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [isSavingTitle, setIsSavingTitle] = useState(false);
    const [deletingLetterId, setDeletingLetterId] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            getAllLetters()
                .then((fetchedLetters) => {
                    setLetters(fetchedLetters);
                    
                    // Check if there are unread received letters
                    if (!initialTabSet) {
                        const unreadReceived = fetchedLetters.filter(letter => 
                            letter.recipientId === user.uid && 
                            !letter.isRead &&
                            !letter.deleted && 
                            !(letter.hiddenFor?.includes(user.uid))
                        );
                        
                        if (unreadReceived.length > 0) {
                            setActiveTab('received');
                        }
                        setInitialTabSet(true);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [user, authLoading, router, initialTabSet]);

    const handleEditTitle = (letter: Letter) => {
        setEditingLetter(letter);
        setNewTitle(letter.content.title || "");
    };

    const handleSaveTitle = async () => {
        if (!editingLetter || !editingLetter.id) return;

        setIsSavingTitle(true);
        try {
            await updateLetterTitle(editingLetter.id, newTitle);
            
            // Update local state
            setLetters(prevLetters =>
                prevLetters.map(letter =>
                    letter.id === editingLetter.id
                        ? { ...letter, content: { ...letter.content, title: newTitle } }
                        : letter
                )
            );

            toast.success("Título actualizado exitosamente");
            setEditingLetter(null);
        } catch (error) {
            toast.error("Error al actualizar el título");
            console.error(error);
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleDeleteLetter = async (letter: Letter) => {
        if (!letter.id || !user) return;

        const isSender = letter.senderId === user.uid;
        const confirmMessage = isSender 
            ? "¿Eliminar esta carta permanentemente? Esta acción no se puede deshacer."
            : "¿Eliminar esta carta de tu mailbox? El remitente aún podrá verla.";

        if (!window.confirm(confirmMessage)) return;

        setDeletingLetterId(letter.id);
        try {
            await deleteLetter(letter.id, user.uid, isSender);
            
            // Update local state - remove from view
            setLetters(prevLetters => prevLetters.filter(l => l.id !== letter.id));
            
            toast.success(isSender ? "Carta eliminada permanentemente" : "Carta eliminada de tu mailbox");
        } catch (error) {
            toast.error("Error al eliminar la carta");
            console.error(error);
        } finally {
            setDeletingLetterId(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] pt-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Filter letters based on active tab
    const sentLetters = letters.filter(letter => 
        letter.senderId === user?.uid && !letter.deleted
    );
    const receivedLetters = letters.filter(letter => 
        letter.recipientId === user?.uid && 
        !letter.deleted && 
        !(letter.hiddenFor?.includes(user?.uid || ''))
    );

    const unreadCount = receivedLetters.filter(letter => !letter.isRead).length;

    const displayedLetters = activeTab === 'sent' ? sentLetters : receivedLetters;

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 lg:p-16 pt-24">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <Link href="/">
                        <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al inicio
                        </Button>
                    </Link>
                </div>
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
                            className={`px-6 py-3 rounded-lg font-medium transition-all relative ${activeTab === 'received'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Received ({receivedLetters.length})
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
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
                                    <div className="aspect-[4/3] bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
                                        {letter.content.frontImage ? (
                                            <>
                                                <Image
                                                    src={letter.content.frontImage}
                                                    alt="Letter preview"
                                                    fill
                                                    className="object-cover"
                                                    style={{ transform: `scale(${letter.content.frontImageZoom || 1})` }}
                                                />
                                                {activeTab === 'received' && !letter.isRead && (
                                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                        NUEVO
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {letter.isRead ? (
                                                    <MailOpen className="w-16 h-16 text-indigo-400" />
                                                ) : (
                                                    <Mail className="w-16 h-16 text-indigo-600" />
                                                )}
                                                {activeTab === 'received' && !letter.isRead && (
                                                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                        NUEVO
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Letter Info */}
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-serif text-xl font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                                                            {letter.content.title || (letter.isRead ? 'Read Letter' : 'New Letter')}
                                                        </h3>
                                                        {activeTab === 'received' && !letter.isRead && (
                                                            <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                                                                No leído
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {activeTab === 'sent' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleEditTitle(letter);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar nombre"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
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
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeleteLetter(letter);
                                                }}
                                                disabled={deletingLetterId === letter.id}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                title="Eliminar carta"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
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

                {/* Edit Title Modal */}
                <AnimatePresence>
                    {editingLetter && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                            onClick={() => setEditingLetter(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-serif font-bold text-gray-900">
                                        Editar Nombre de Carta
                                    </h3>
                                    <button
                                        onClick={() => setEditingLetter(null)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Título de la Carta
                                        </label>
                                        <Input
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            placeholder="e.g., Happy Birthday, Thank You..."
                                            className="w-full"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSaveTitle();
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => setEditingLetter(null)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleSaveTitle}
                                            disabled={isSavingTitle}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {isSavingTitle ? "Guardando..." : "Guardar"}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
