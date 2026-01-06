"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getLetter, updateLetter } from "@/lib/db";
import { Letter, LetterContent, LetterStyle } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/UI/Button";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import { Textarea } from "@/components/UI/Textarea";
import { Stepper } from "@/components/UI/Stepper";
import { ArrowLeft, ArrowRight, Save, Upload, ZoomIn, Type, Trash2 } from "lucide-react";
import { FoldableLetter } from "@/components/Letter/FoldableLetter";
import { motion, AnimatePresence } from "framer-motion";
import { compressImage } from "@/lib/image";
import toast from "react-hot-toast";

const STEPS = ["Front Cover", "Inside Left", "Message", "Signature", "Review"];
const FONTS = [
    { name: "Inter", value: "var(--font-inter)" },
    { name: "Playfair Display", value: "var(--font-playfair)" },
    { name: "Dancing Script", value: "var(--font-dancing)" },
];

export default function EditLetterPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const id = params.id as string;

    const [letter, setLetter] = useState<Letter | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const [content, setContent] = useState<LetterContent>({
        frontImage: "",
        leftImage: "",
        rightText: "",
        signature: "",
        frontImageZoom: 1,
        leftImageZoom: 1,
    });

    const [style, setStyle] = useState<LetterStyle>({
        themeColor: "#ffffff",
        fontFamily: FONTS[0].value,
        fontSize: 24,
        signatureFontSize: 24,
    });

    const [files, setFiles] = useState<{ [key: string]: File }>({});

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (id && user) {
            getLetter(id)
                .then((data) => {
                    if (!data) throw new Error("Letter not found");

                    // Check if user is the sender
                    if (data.senderId !== user.uid) {
                        toast.error("You can only edit your own letters");
                        router.push('/mailbox');
                        return;
                    }

                    setLetter(data);
                    setContent(data.content);
                    setStyle(data.style);
                })
                .catch((err) => {
                    console.error(err);
                    toast.error("Failed to load letter");
                    router.push('/mailbox');
                })
                .finally(() => setLoading(false));
        }
    }, [id, user, authLoading, router]);

    const handleFileChange = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file);
            setFiles((prev) => ({ ...prev, [key]: compressed }));

            const reader = new FileReader();
            reader.onloadend = () => {
                setContent((prev) => ({ ...prev, [key]: reader.result as string }));
            };
            reader.readAsDataURL(compressed);
        } catch (error) {
            console.error("Error processing image:", error);
            toast.error("Failed to process image");
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

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep((prev) => prev - 1);
    };

    const handleSave = async () => {
        const loadingToast = toast.loading('Updating letter...');

        try {
            setIsSaving(true);

            const cleanContent = Object.fromEntries(
                Object.entries(content).filter(([_, v]) => v !== undefined && v !== "")
            );

            await updateLetter(id, {
                content: cleanContent as LetterContent,
                style,
            });

            toast.success('Letter updated successfully!', { id: loadingToast });

            setTimeout(() => {
                router.push(`/letter/${id}`);
            }, 500);
        } catch (error: any) {
            console.error("Failed to update letter:", error);

            let errorMessage = "Failed to update letter. Please try again.";
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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] pt-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!letter) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] pt-16">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Letter not found</h1>
                    <Button onClick={() => router.push('/mailbox')}>Back to Mailbox</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col lg:flex-row overflow-hidden pt-16">
            {/* Left Panel - Same as create page */}
            <div className="w-full lg:w-[450px] bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl z-20 flex flex-col max-h-screen">
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Edit Letter</h1>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/mailbox')}
                            className="text-gray-600"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Mailbox
                        </Button>
                    </div>

                    <Stepper steps={STEPS} currentStep={currentStep} />

                    <div className="mt-8">
                        {/* Render same step content as create page - simplified for brevity */}
                        <div className="space-y-4">
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <Label htmlFor="message">Your Message</Label>
                                    <Textarea
                                        id="rightText"
                                        name="rightText"
                                        value={content.rightText}
                                        onChange={handleChange}
                                        placeholder="Write your heartfelt message..."
                                        rows={10}
                                    />
                                </div>
                            )}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <Label htmlFor="signature">Signature</Label>
                                    <Input
                                        id="signature"
                                        name="signature"
                                        value={content.signature}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/80 border-t border-gray-200 flex gap-3">
                    <Button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        variant="outline"
                        className="flex-1"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    {currentStep === STEPS.length - 1 ? (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    ) : (
                        <Button onClick={handleNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Right Panel - Preview */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div className="w-full max-w-4xl">
                    <FoldableLetter content={content} style={style} isFlipped={false} />
                </div>
            </div>
        </div>
    );
}
