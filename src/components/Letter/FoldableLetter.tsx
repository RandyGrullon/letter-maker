"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LetterContent, LetterStyle } from "@/types";
import { LetterFace } from "./LetterFace";
import { cn } from "@/lib/utils";

interface FoldableLetterProps {
    content: LetterContent;
    style: LetterStyle;
    isPreview?: boolean;
    isOpen?: boolean;
    isFlipped?: boolean;
    onToggle?: (isOpen: boolean) => void;
}

export const FoldableLetter: React.FC<FoldableLetterProps> = ({
    content,
    style,
    isPreview = false,
    isOpen: externalIsOpen,
    isFlipped = false,
    onToggle,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    const isControlled = externalIsOpen !== undefined;
    const isOpen = isControlled ? externalIsOpen : internalIsOpen;

    const toggleOpen = () => {
        const newState = !isOpen;
        if (isControlled) {
            onToggle?.(newState);
        } else {
            setInternalIsOpen(newState);
        }
    };

    return (
        <div className="relative w-full max-w-4xl aspect-[3/2] perspective-1000 mx-auto my-8">
            <motion.div
                className={cn(
                    "relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer",
                )}
                onClick={toggleOpen}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Right Panel (Static) */}
                <div className="absolute right-0 top-0 w-1/2 h-full">
                    {/* Inside Right (Front of Right Panel) */}
                    <LetterFace
                        image={undefined} // Usually text goes here
                        text={content.rightText}
                        signature={content.signature}
                        fontFamily={style.fontFamily}
                        fontSize={style.fontSize}
                        signatureFontSize={style.signatureFontSize}
                        className="bg-cream-100 border-l border-gray-200"
                    />
                    {/* Back Cover (Back of Right Panel) */}
                    <LetterFace
                        isBack
                        className="bg-gray-100"
                    />
                </div>

                {/* Left Panel (Foldable) */}
                <motion.div
                    className="absolute left-0 top-0 w-1/2 h-full transform-style-3d origin-right"
                    initial={{ rotateY: 0 }}
                    animate={{ rotateY: isOpen ? 0 : 180 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{ transformOrigin: "100% 50%" }}
                >
                    {/* Inside Left (Front of Left Panel) */}
                    <LetterFace
                        image={content.leftImage}
                        zoom={content.leftImageZoom}
                        className="bg-white border-r border-gray-200"
                    />

                    {/* Front Cover (Back of Left Panel - visible when closed/rotated 180) */}
                    <LetterFace
                        isBack
                        image={content.frontImage}
                        zoom={content.frontImageZoom}
                        className="bg-blue-50"
                    />
                </motion.div>
            </motion.div>

            {/* Hint */}
            <div className="absolute -bottom-12 left-0 w-full text-center text-gray-500 text-sm">
                {isOpen ? "Click to close" : "Click to open"}
            </div>
        </div>
    );
};
