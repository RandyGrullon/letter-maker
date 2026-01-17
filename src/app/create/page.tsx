"use client";

import React, { useState, useEffect } from "react";
import { FoldableLetter } from "@/components/Letter/FoldableLetter";
import { LetterContent, LetterStyle } from "@/types";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import { Textarea } from "@/components/UI/Textarea";
import { Stepper } from "@/components/UI/Stepper";
import { saveLetter, searchUserByEmail, assignLetterToRecipient } from "@/lib/db";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Upload, ZoomIn, Type, Trash2, X, Search, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/image";
import toast from "react-hot-toast";
import { User } from "@/types";
import Link from "next/link";

const STEPS = ["Front Cover", "Inside Left", "Message", "Signature", "Review", "Send To"];

const FONTS = [
    { name: "Dancing Script", value: "Dancing Script" },
    { name: "Playfair Display", value: "Playfair Display" },
    { name: "Inter", value: "Inter" },
    { name: "Caveat", value: "Caveat" }, // Assuming we might add more
];

export default function CreatePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [files, setFiles] = useState<Record<string, File>>({});
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    // Recipient search
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientUser, setRecipientUser] = useState<User | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [content, setContent] = useState<LetterContent>({
        rightText: "",
        signature: "",
        frontImageZoom: 1,
        leftImageZoom: 1,
    });

    const [style, setStyle] = useState<LetterStyle>({
        themeColor: "#ffffff",
        fontFamily: "Dancing Script",
        fontSize: 24,
        signatureFontSize: 24,
    });

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedContent = localStorage.getItem("letter_content");
        const savedStyle = localStorage.getItem("letter_style");
        if (savedContent) setContent(JSON.parse(savedContent));
        if (savedStyle) setStyle(JSON.parse(savedStyle));
    }, []);

    // Save to LocalStorage on change
    useEffect(() => {
        localStorage.setItem("letter_content", JSON.stringify(content));
    }, [content]);

    useEffect(() => {
        localStorage.setItem("letter_style", JSON.stringify(style));
    }, [style]);

    // Auto-animate preview based on step
    useEffect(() => {
        if (currentStep === 0) {
            setIsPreviewOpen(false);
            setIsFlipped(false);
        } else {
            setIsPreviewOpen(true);
            setIsFlipped(false);
        }
    }, [currentStep]);

    const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];

            try {
                // Compress image if it's larger than 1MB
                if (file.size > 1024 * 1024) {
                    file = await compressImage(file);
                }
            } catch (error) {
                console.error("Error compressing image:", error);
                // Continue with original file if compression fails
            }

            setFiles((prev) => ({ ...prev, [key]: file }));

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setContent((prev) => ({ ...prev, [key]: event.target?.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContent((prev) => ({ ...prev, [name]: value }));
    };

    const handleRemoveImage = (key: string) => {
        setContent((prev) => ({ ...prev, [key]: undefined }));
        setFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[key];
            return newFiles;
        });
    };

    const handleZoomChange = (key: 'frontImageZoom' | 'leftImageZoom', value: number) => {
        setContent(prev => ({ ...prev, [key]: value }));
    };

    const handleStyleChange = (key: keyof LetterStyle, value: any) => {
        setStyle(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    };

    const handleSearchRecipient = async () => {
        if (!recipientEmail.trim()) {
            toast.error("Please enter an email");
            return;
        }

        setIsSearching(true);
        try {
            const user = await searchUserByEmail(recipientEmail.trim());
            if (user) {
                setRecipientUser(user);
                toast.success(`User found: ${user.firstName} ${user.lastName}`);
            } else {
                setRecipientUser(null);
                toast.error("User not found. They need to register first.");
            }
        } catch (error) {
            console.error("Error searching user:", error);
            toast.error("Failed to search user");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        const loadingToast = toast.loading('Saving your letter...');

        try {
            setIsSaving(true);

            // Clean undefined and empty values
            const cleanContent = Object.fromEntries(
                Object.entries(content).filter(([_, v]) => v !== undefined && v !== "")
            );

            // Save to DB with Base64 images directly (no upload needed)
            const letterId = await saveLetter({
                content: cleanContent as LetterContent,
                style,
            });

            // Assign to recipient if selected
            if (recipientUser) {
                await assignLetterToRecipient(
                    letterId,
                    recipientUser.id,
                    recipientUser.firstName,
                    recipientUser.lastName,
                    recipientUser.email
                );
                toast.success(`Letter sent to ${recipientUser.firstName}!`, { id: loadingToast });
            } else {
                toast.success('Letter saved successfully!', { id: loadingToast });
            }

            // Clear local storage after successful save
            localStorage.removeItem("letter_content");
            localStorage.removeItem("letter_style");

            setTimeout(() => {
                router.push(`/letter/${letterId}`);
            }, 500);
        } catch (error: any) {
            console.error("Failed to save letter:", error);

            let errorMessage = "Failed to save letter. Please try again.";
            if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage, {
                id: loadingToast,
                duration: 6000
            });
        } finally {
            setIsSaving(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Front Cover
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Front Cover</h2>
                            <p className="text-gray-500">Choose an image for the front of your folded letter.</p>
                        </div>

                        {!content.frontImage ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                                <input
                                    type="file"
                                    id="frontImage"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange("frontImage", e)}
                                />
                                <Label htmlFor="frontImage" className="cursor-pointer flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <span className="text-indigo-600 font-medium">Click to upload image</span>
                                    <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                                </Label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={content.frontImage}
                                        alt="Front cover"
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemoveImage('frontImage')}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm text-gray-600">
                                        <ZoomIn className="w-4 h-4" /> Image Zoom: {content.frontImageZoom}x
                                    </Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.1"
                                        value={content.frontImageZoom || 1}
                                        onChange={(e) => handleZoomChange('frontImageZoom', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 1: // Inside Left
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Inside Left</h2>
                            <p className="text-gray-500">Add a photo or memory to the inside left panel.</p>
                        </div>

                        {!content.leftImage ? (
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                                <input
                                    type="file"
                                    id="leftImage"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange("leftImage", e)}
                                />
                                <Label htmlFor="leftImage" className="cursor-pointer flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <span className="text-indigo-600 font-medium">Click to upload image</span>
                                    <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                                </Label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                        src={content.leftImage}
                                        alt="Inside left"
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        onClick={() => handleRemoveImage('leftImage')}
                                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-sm text-gray-600">
                                        <ZoomIn className="w-4 h-4" /> Image Zoom: {content.leftImageZoom}x
                                    </Label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.1"
                                        value={content.leftImageZoom || 1}
                                        onChange={(e) => handleZoomChange('leftImageZoom', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 2: // Message
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Your Message</h2>
                            <p className="text-gray-500">Write your heartfelt message.</p>
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="letterTitle" className="text-sm font-medium text-gray-700">
                                Letter Title (optional)
                            </Label>
                            <Input
                                id="letterTitle"
                                name="title"
                                value={content.title || ""}
                                onChange={handleChange}
                                placeholder="e.g., Happy Birthday, Thank You, Love Letter..."
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500">This will be used for the PDF filename</p>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <div className="flex-1 space-y-2">
                                <Label className="text-xs text-gray-500">Font Family</Label>
                                <select
                                    value={style.fontFamily}
                                    onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-md text-sm"
                                >
                                    {FONTS.map(f => (
                                        <option key={f.value} value={f.value}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label className="text-xs text-gray-500">Font Size: {style.fontSize}px</Label>
                                <input
                                    type="range"
                                    min="12"
                                    max="48"
                                    step="1"
                                    value={style.fontSize}
                                    onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <Textarea
                            name="rightText"
                            value={content.rightText}
                            onChange={handleChange}
                            placeholder="Dear..."
                            className="h-64 text-2xl leading-relaxed p-6 bg-white shadow-sm text-justify resize-none"
                            style={{ fontFamily: style.fontFamily, fontSize: `${style.fontSize}px` }}
                        />
                    </div>
                );
            case 3: // Signature
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Sign Off</h2>
                            <p className="text-gray-500">Add your personal signature.</p>
                        </div>

                        <div className="space-y-2 mb-4">
                            <Label className="text-xs text-gray-500">Signature Size: {style.signatureFontSize}px</Label>
                            <input
                                type="range"
                                min="12"
                                max="64"
                                step="1"
                                value={style.signatureFontSize || 24}
                                onChange={(e) => handleStyleChange('signatureFontSize', parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <Input
                            name="signature"
                            value={content.signature}
                            onChange={handleChange}
                            placeholder="With love, ..."
                            className="text-2xl h-16 text-center"
                            style={{ fontFamily: style.fontFamily, fontSize: `${style.signatureFontSize}px` }}
                        />
                    </div>
                );
            case 4: // Review
                return (
                    <div className="space-y-6 text-center">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Ready to Share?</h2>
                            <p className="text-gray-500">Review your letter on the right. If it looks good, move to next step!</p>
                        </div>
                        <p className="text-sm text-gray-500">
                            You can click the letter preview to fold and unfold it manually.
                        </p>
                    </div>
                );
            case 5: // Send To
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-serif font-bold text-gray-900">Send to Someone</h2>
                            <p className="text-gray-500">Search for a registered user by email to send this letter</p>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="recipientEmail">Recipient's Email</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="recipientEmail"
                                    type="email"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    placeholder="recipient@example.com"
                                    disabled={isSearching}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearchRecipient();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSearchRecipient}
                                    disabled={isSearching || !recipientEmail.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    {isSearching ? "Searching..." : "Search"}
                                </Button>
                            </div>

                            {recipientUser && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-lg">
                                            {recipientUser.firstName[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {recipientUser.firstName} {recipientUser.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">{recipientUser.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500 text-center">
                                    Or skip this step to save the letter without sending it yet
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col lg:flex-row overflow-hidden pt-16">
            {/* Left Panel - Controls */}
            <div className="w-full lg:w-[450px] bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl z-20 flex flex-col max-h-screen">

                <div className="flex-1 overflow-y-auto p-8">
                    <Stepper steps={STEPS} currentStep={currentStep} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-8 border-t border-gray-100 bg-white/50 space-y-4">
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="flex-1"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>

                        {currentStep === STEPS.length - 1 ? (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isSaving ? "Saving..." : recipientUser ? "Save & Send" : "Save Letter"}
                                {recipientUser ? <Send className="w-4 h-4 ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                            </Button>
                        ) : (
                            <Button onClick={handleNext} className="flex-1">
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 relative bg-gray-50/50 flex items-center justify-center p-8 lg:p-12 perspective-2000 overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-50/60 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 w-full max-w-5xl transition-all duration-700 ease-in-out">
                    <FoldableLetter
                        content={content}
                        style={style}
                        isPreview
                        isOpen={isPreviewOpen}
                        isFlipped={isFlipped}
                        onToggle={setIsPreviewOpen}
                    />
                </div>
            </div>
        </div>
    );
}
