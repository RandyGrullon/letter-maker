"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FoldableLetter } from "@/components/Letter/FoldableLetter";
import { Letter } from "@/types";
import { getLetter, markAsRead, assignLetterToRecipient, getUserProfile } from "@/lib/db";
import { Button } from "@/components/UI/Button";
import { useAuth } from "@/lib/auth-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { LetterFace } from "@/components/Letter/LetterFace";

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

        const loadingToast = toast.loading('Generando tu carta en PDF de alta calidad...');

        try {
            // Create PDF with compression enabled
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true, // Enable compression to reduce file size
            });

            const pdfWidth = 210; // A4 width in mm
            const pdfHeight = 297; // A4 height in mm

            // Wait for all assets to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load Google Font if needed
            if (letter.style.fontFamily) {
                const link = document.createElement('link');
                link.href = `https://fonts.googleapis.com/css2?family=${letter.style.fontFamily.replace(/ /g, '+')}&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Create high-quality temporary container
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.top = '-99999px';
            tempContainer.style.left = '-99999px';
            tempContainer.style.width = '2100px'; // 10x scale for better quality
            tempContainer.style.height = '2970px'; // 10x scale maintaining A4 ratio
            tempContainer.style.backgroundColor = '#ffffff';
            (tempContainer.style as any).webkitFontSmoothing = 'antialiased';
            document.body.appendChild(tempContainer);

            // Define the 4 pages of the letter
            const pages = [
                {
                    title: 'Portada',
                    backgroundColor: '#eff6ff',
                    image: letter.content.frontImage,
                    zoom: letter.content.frontImageZoom,
                    showTitle: !letter.content.frontImage,
                },
                {
                    title: 'Interior Izquierdo',
                    backgroundColor: '#ffffff',
                    image: letter.content.leftImage,
                    zoom: letter.content.leftImageZoom,
                },
                {
                    title: 'Mensaje',
                    backgroundColor: '#FDFBF7',
                    text: letter.content.rightText,
                    signature: letter.content.signature,
                },
                {
                    title: 'Contraportada',
                    backgroundColor: '#f3f4f6',
                    decoration: '✨',
                }
            ];

            // Render each page
            for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
                const page = pages[pageIndex];
                tempContainer.innerHTML = '';

                // Create page container
                const pageDiv = document.createElement('div');
                pageDiv.style.width = '100%';
                pageDiv.style.height = '100%';
                pageDiv.style.backgroundColor = page.backgroundColor;
                pageDiv.style.position = 'relative';
                pageDiv.style.overflow = 'hidden';
                pageDiv.style.boxSizing = 'border-box';

                // Add shadow and texture for paper-like feel
                pageDiv.style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.03)';

                if (page.image) {
                    // Image page
                    const imgContainer = document.createElement('div');
                    imgContainer.style.width = '100%';
                    imgContainer.style.height = '100%';
                    imgContainer.style.display = 'flex';
                    imgContainer.style.alignItems = 'center';
                    imgContainer.style.justifyContent = 'center';
                    imgContainer.style.overflow = 'hidden';

                    const img = document.createElement('img');
                    img.crossOrigin = 'anonymous';
                    img.src = page.image;
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.transform = `scale(${page.zoom || 1})`;
                    img.style.imageRendering = 'high-quality';
                    
                    imgContainer.appendChild(img);
                    pageDiv.appendChild(imgContainer);

                    // Wait for image to load
                    await new Promise((resolve) => {
                        if (img.complete) {
                            resolve(true);
                        } else {
                            img.onload = () => resolve(true);
                            img.onerror = () => resolve(true);
                        }
                    });
                } else if (page.text) {
                    // Text page with auto-sizing typography
                    const contentDiv = document.createElement('div');
                    contentDiv.style.width = '100%';
                    contentDiv.style.height = '100%';
                    contentDiv.style.padding = '150px 120px';
                    contentDiv.style.boxSizing = 'border-box';
                    contentDiv.style.display = 'flex';
                    contentDiv.style.flexDirection = 'column';

                    // Main text container
                    const textDiv = document.createElement('div');
                    textDiv.textContent = page.text;
                    textDiv.style.fontFamily = letter.style.fontFamily || 'Georgia, serif';
                    textDiv.style.color = '#1e293b';
                    textDiv.style.whiteSpace = 'pre-wrap';
                    textDiv.style.wordWrap = 'break-word';
                    textDiv.style.textAlign = 'justify';
                    textDiv.style.flex = '1';
                    textDiv.style.overflow = 'hidden';
                    
                    // Calculate optimal font size based on text length - EVEN LARGER
                    const textLength = page.text.length;
                    
                    // Start with ultra-large fonts
                    let baseFontSize;
                    if (textLength < 100) {
                        baseFontSize = 190; // Very short text - massive font
                    } else if (textLength < 250) {
                        baseFontSize = 150; // Short text - huge font
                    } else if (textLength < 500) {
                        baseFontSize = 120; // Medium text - very large font
                    } else if (textLength < 800) {
                        baseFontSize = 95; // Long text - large font
                    } else if (textLength < 1200) {
                        baseFontSize = 80; // Very long text - medium font
                    } else {
                        baseFontSize = 70; // Extremely long text
                    }
                    
                    textDiv.style.fontSize = `${baseFontSize}px`;
                    textDiv.style.lineHeight = '1.75';
                    
                    contentDiv.appendChild(textDiv);

                    // Signature placeholder to calculate space
                    let sigDiv = null;
                    if (page.signature) {
                        sigDiv = document.createElement('div');
                        sigDiv.textContent = page.signature;
                        sigDiv.style.fontFamily = letter.style.fontFamily || 'Georgia, serif';
                        sigDiv.style.color = '#475569';
                        sigDiv.style.textAlign = 'right';
                        sigDiv.style.marginTop = '60px';
                        sigDiv.style.fontStyle = 'italic';
                        sigDiv.style.flexShrink = '0';
                        sigDiv.style.paddingTop = '40px';
                        sigDiv.style.borderTop = '3px solid rgba(0,0,0,0.15)';
                        sigDiv.style.fontSize = `${baseFontSize * 0.9}px`;
                        contentDiv.appendChild(sigDiv);
                    }

                    pageDiv.appendChild(contentDiv);
                    tempContainer.appendChild(pageDiv);

                    // Wait for initial render
                    await new Promise(resolve => setTimeout(resolve, 150));

                    // Auto-adjust font size to maximize space usage
                    let currentFontSize = baseFontSize;
                    const minFontSize = 55; // Keep it big
                    const maxFontSize = 240; // Allow even bigger text
                    
                    // Try to increase size if there's empty space (aim for 90% usage)
                    let iterations = 0;
                    while (textDiv.scrollHeight < textDiv.clientHeight * 0.9 && currentFontSize < maxFontSize && iterations < 60) {
                        currentFontSize += 4;
                        textDiv.style.fontSize = `${currentFontSize}px`;
                        if (sigDiv) sigDiv.style.fontSize = `${currentFontSize * 0.95}px`;
                        await new Promise(resolve => setTimeout(resolve, 5));
                        iterations++;
                    }
                    
                    // Decrease size if content overflows
                    iterations = 0;
                    while (textDiv.scrollHeight > textDiv.clientHeight && currentFontSize > minFontSize && iterations < 120) {
                        currentFontSize -= 1.5;
                        textDiv.style.fontSize = `${currentFontSize}px`;
                        if (sigDiv) sigDiv.style.fontSize = `${currentFontSize * 0.95}px`;
                        await new Promise(resolve => setTimeout(resolve, 5));
                        iterations++;
                    }

                    // Final adjustment to ensure no overflow
                    if (textDiv.scrollHeight > textDiv.clientHeight) {
                        while (textDiv.scrollHeight > textDiv.clientHeight && currentFontSize > minFontSize) {
                            currentFontSize -= 0.5;
                            textDiv.style.fontSize = `${currentFontSize}px`;
                            if (sigDiv) sigDiv.style.fontSize = `${currentFontSize * 0.95}px`;
                        }
                    }
                } else if (page.decoration) {
                    // Decorative page
                    const decorDiv = document.createElement('div');
                    decorDiv.style.width = '100%';
                    decorDiv.style.height = '100%';
                    decorDiv.style.display = 'flex';
                    decorDiv.style.alignItems = 'center';
                    decorDiv.style.justifyContent = 'center';
                    decorDiv.style.fontSize = '240px';
                    decorDiv.textContent = page.decoration;
                    pageDiv.appendChild(decorDiv);
                } else if (page.showTitle) {
                    // Title page without image
                    const titleDiv = document.createElement('div');
                    titleDiv.style.width = '100%';
                    titleDiv.style.height = '100%';
                    titleDiv.style.display = 'flex';
                    titleDiv.style.alignItems = 'center';
                    titleDiv.style.justifyContent = 'center';
                    titleDiv.style.fontSize = '120px';
                    titleDiv.style.fontFamily = letter.style.fontFamily || 'Georgia, serif';
                    titleDiv.style.color = '#6366f1';
                    titleDiv.style.fontWeight = 'bold';
                    titleDiv.textContent = 'Una Carta Para Ti';
                    pageDiv.appendChild(titleDiv);
                }

                tempContainer.appendChild(pageDiv);

                // Wait for rendering
                await new Promise(resolve => setTimeout(resolve, 400));

                // Capture with high quality but optimized
                const canvas = await html2canvas(tempContainer, {
                    useCORS: true,
                    allowTaint: false,
                    scale: 2, // Balanced resolution (reduced from 3 to 2)
                    backgroundColor: page.backgroundColor,
                    logging: false,
                    windowWidth: 2100,
                    windowHeight: 2970,
                    imageTimeout: 15000,
                });

                // Convert to optimized image (0.85 quality for good balance)
                const imgData = canvas.toDataURL("image/jpeg", 0.85); // Optimized quality

                // Add page
                if (pageIndex > 0) {
                    pdf.addPage();
                }

                // Add image to PDF filling the entire page with compression
                pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            // Cleanup
            document.body.removeChild(tempContainer);

            // Generate filename with letter title if available
            const date = new Date().toISOString().split('T')[0];
            const letterTitle = letter.content.title 
                ? letter.content.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() 
                : 'carta';
            const filename = `${letterTitle}-${date}.pdf`;
            
            // Save PDF
            pdf.save(filename);

            toast.success(`¡Tu carta se ha descargado con éxito! 💌`, { id: loadingToast });
        } catch (error: any) {
            console.error("Error generating PDF:", error);
            toast.error(`Error al generar el PDF. Por favor intenta de nuevo.`, {
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
                <div className="mb-8 self-start">
                    <Link href="/mailbox">
                        <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/50 backdrop-blur-sm">
                            <ArrowLeft className="w-4 h-4" />
                            Volver al mailbox
                        </Button>
                    </Link>
                </div>
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
