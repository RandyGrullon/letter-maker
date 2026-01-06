"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FoldableLetter } from "@/components/Letter/FoldableLetter";
import { Letter } from "@/types";
import { getLetter, markAsRead, assignLetterToRecipient, getUserProfile } from "@/lib/db";
import { Button } from "@/components/UI/Button";
import { useAuth } from "@/lib/auth-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LetterPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const id = params.id as string;
    const [letter, setLetter] = useState<Letter | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!authLoading && !user) {
            router.push(`/login?redirect=/letter/${id}`);
            return;
        }

        if (id && user) {
            getLetter(id)
                .then(async (data) => {
                    if (!data) throw new Error("Letter not found");

                    setLetter(data);

                    // Auto-assign letter to recipient if not already assigned
                    if (!data.recipientId) {
                        const userProfile = await getUserProfile(user.uid);
                        if (userProfile) {
                            await assignLetterToRecipient(
                                id,
                                user.uid,
                                userProfile.firstName,
                                userProfile.lastName,
                                userProfile.email
                            );
                            // Update local state
                            setLetter({
                                ...data,
                                recipientId: user.uid,
                                recipientName: `${userProfile.firstName} ${userProfile.lastName}`,
                                recipientEmail: userProfile.email,
                            });
                        }
                    }

                    if (!data.isRead) {
                        markAsRead(id);
                    }
                })
                .catch((err) => {
                    console.error(err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id, user, authLoading, router]);

    const handleDownloadPDF = async () => {
        if (!letter) return;

        const loadingToast = toast.loading('Generating PDF (4 pages)...');

        try {
            // Create PDF
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm

            // Wait for styles to apply
            await new Promise(resolve => setTimeout(resolve, 300));

            // Create temporary container for rendering individual faces
            // A4 aspect ratio: 210mm x 297mm = 1:1.414
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '-9999px';
            tempContainer.style.left = '-9999px';
            tempContainer.style.width = '1200px';
            tempContainer.style.height = '1697px'; // A4 aspect ratio
            tempContainer.style.backgroundColor = '#ffffff';
            document.body.appendChild(tempContainer);

            const faces = [
                {
                    name: 'Front Cover',
                    render: () => {
                        tempContainer.innerHTML = '';
                        const faceDiv = document.createElement('div');
                        faceDiv.style.width = '100%';
                        faceDiv.style.height = '100%';
                        faceDiv.style.display = 'flex';
                        faceDiv.style.alignItems = 'center';
                        faceDiv.style.justifyContent = 'center';
                        faceDiv.style.overflow = 'hidden';
                        faceDiv.style.backgroundColor = '#eff6ff';
                        
                        if (letter.content.frontImage) {
                            const img = document.createElement('img');
                            img.src = letter.content.frontImage;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                            img.style.transform = `scale(${letter.content.frontImageZoom || 1})`;
                            faceDiv.appendChild(img);
                        } else {
                            const text = document.createElement('div');
                            text.textContent = 'Front Cover';
                            text.style.fontSize = '48px';
                            text.style.color = '#6366f1';
                            text.style.fontFamily = letter.style.fontFamily;
                            faceDiv.appendChild(text);
                        }
                        
                        tempContainer.appendChild(faceDiv);
                    }
                },
                {
                    name: 'Inside Left',
                    render: () => {
                        tempContainer.innerHTML = '';
                        const faceDiv = document.createElement('div');
                        faceDiv.style.width = '100%';
                        faceDiv.style.height = '100%';
                        faceDiv.style.display = 'flex';
                        faceDiv.style.alignItems = 'center';
                        faceDiv.style.justifyContent = 'center';
                        faceDiv.style.overflow = 'hidden';
                        faceDiv.style.backgroundColor = '#ffffff';
                        
                        if (letter.content.leftImage) {
                            const img = document.createElement('img');
                            img.src = letter.content.leftImage;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'cover';
                            img.style.transform = `scale(${letter.content.leftImageZoom || 1})`;
                            faceDiv.appendChild(img);
                        }
                        
                        tempContainer.appendChild(faceDiv);
                    }
                },
                {
                    name: 'Message',
                    render: () => {
                        tempContainer.innerHTML = '';
                        const faceDiv = document.createElement('div');
                        faceDiv.style.width = '100%';
                        faceDiv.style.height = '100%';
                        faceDiv.style.padding = '40px';
                        faceDiv.style.display = 'flex';
                        faceDiv.style.flexDirection = 'column';
                        faceDiv.style.backgroundColor = '#FDFBF7';
                        faceDiv.style.boxSizing = 'border-box';
                        faceDiv.style.overflow = 'hidden';
                        
                        if (letter.content.rightText) {
                            const textDiv = document.createElement('div');
                            textDiv.textContent = letter.content.rightText;
                            textDiv.style.whiteSpace = 'pre-wrap';
                            textDiv.style.fontSize = `${Math.min(letter.style.fontSize, 24)}px`;
                            textDiv.style.fontFamily = letter.style.fontFamily;
                            textDiv.style.color = '#1e293b';
                            textDiv.style.lineHeight = '1.6';
                            textDiv.style.flexGrow = '1';
                            textDiv.style.textAlign = 'justify';
                            textDiv.style.overflow = 'hidden';
                            textDiv.style.wordWrap = 'break-word';
                            faceDiv.appendChild(textDiv);
                        }
                        
                        if (letter.content.signature) {
                            const sigDiv = document.createElement('div');
                            sigDiv.textContent = letter.content.signature;
                            sigDiv.style.fontSize = `${Math.min(letter.style.signatureFontSize, 22)}px`;
                            sigDiv.style.fontFamily = letter.style.fontFamily;
                            sigDiv.style.color = '#475569';
                            sigDiv.style.textAlign = 'right';
                            sigDiv.style.marginTop = '24px';
                            sigDiv.style.flexShrink = '0';
                            faceDiv.appendChild(sigDiv);
                        }
                        
                        tempContainer.appendChild(faceDiv);
                    }
                },
                {
                    name: 'Back Cover',
                    render: () => {
                        tempContainer.innerHTML = '';
                        const faceDiv = document.createElement('div');
                        faceDiv.style.width = '100%';
                        faceDiv.style.height = '100%';
                        faceDiv.style.backgroundColor = '#f3f4f6';
                        faceDiv.style.display = 'flex';
                        faceDiv.style.alignItems = 'center';
                        faceDiv.style.justifyContent = 'center';
                        
                        const text = document.createElement('div');
                        text.textContent = '✨';
                        text.style.fontSize = '72px';
                        faceDiv.appendChild(text);
                        
                        tempContainer.appendChild(faceDiv);
                    }
                }
            ];

            // Process each face
            for (let i = 0; i < faces.length; i++) {
                const face = faces[i];
                
                // Render the face
                face.render();
                
                // Wait for images to load
                await new Promise(resolve => setTimeout(resolve, 500));

                // Capture as canvas
                const canvas = await html2canvas(tempContainer, {
                    useCORS: true,
                    allowTaint: true,
                    scale: 2,
                    backgroundColor: null,
                    logging: false,
                });

                // Convert to image
                const imgData = canvas.toDataURL("image/jpeg", 0.95);

                // Add new page if not first
                if (i > 0) {
                    pdf.addPage();
                }

                // Add image to PDF - full page, no margins
                pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            // Clean up
            document.body.removeChild(tempContainer);

            // Generate filename with date
            const date = new Date().toISOString().split('T')[0];
            const filename = `letter-${date}.pdf`;
            
            // Save PDF
            pdf.save(filename);

            toast.success(`PDF with 4 pages downloaded!`, { id: loadingToast });
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            toast.error(`Failed to generate PDF. Please try again.`, {
                id: loadingToast,
                duration: 4000
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!letter) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Letter not found</h1>
                    <p className="text-gray-600">The letter you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-100/40 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-50/60 rounded-full blur-3xl" />
            </div>

            <div className="z-10 w-full max-w-5xl flex flex-col items-center">
                <div className="mb-12 flex gap-4 flex-wrap justify-center">
                    <Button onClick={handleDownloadPDF} variant="outline" className="bg-white/50 backdrop-blur-sm hover:bg-white">
                        Download PDF
                    </Button>
                    <Button onClick={async () => {
                        if (navigator.share) {
                            try {
                                await navigator.share({
                                    title: 'A Letter for You',
                                    text: 'I wrote you a digital letter. Open it here:',
                                    url: window.location.href,
                                });
                            } catch (err) {
                                console.log('Error sharing:', err);
                            }
                        } else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success("Link copied to clipboard!");
                        }
                    }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        Share Letter
                    </Button>
                </div>

                <div id="letter-content" className="w-full">
                    <FoldableLetter
                        content={letter.content}
                        style={letter.style}
                        isFlipped={false}
                    />
                </div>

                <div className="mt-12 text-center space-y-4">
                    <p className="text-gray-400 text-sm font-serif italic">
                        Click letter to open/close
                    </p>

                    <Link href="/create">
                        <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                            Create Your Own Letter <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
