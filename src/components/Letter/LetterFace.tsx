import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LetterFaceProps {
    className?: string;
    children?: React.ReactNode;
    image?: string;
    zoom?: number;
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    signatureFontSize?: number;
    signature?: string;
    isBack?: boolean;
}

export const LetterFace: React.FC<LetterFaceProps> = ({
    className,
    children,
    image,
    zoom = 1,
    text,
    fontFamily = "Dancing Script",
    fontSize = 24,
    signatureFontSize = 24,
    signature,
    isBack = false,
}) => {
    const textRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!text || !textRef.current) return;

        const element = textRef.current;
        // If fontSize is provided, use it as base. Otherwise default logic.
        // But the user wants a picker, so we should respect the picker.
        // However, the auto-resize logic was requested earlier.
        // If the user picks a font size, should we still auto-resize?
        // Maybe "auto-shrink" if it overflows, but start at the picked size.

        let size = fontSize;
        element.style.fontSize = `${size}px`;
        element.style.fontFamily = fontFamily;
        element.style.lineHeight = '1.6';

        // Reduce size until it fits, but only if it overflows
        while (element.scrollHeight > element.clientHeight && size > 10) {
            size -= 0.5;
            element.style.fontSize = `${size}px`;
        }
    }, [text, signature, fontSize, fontFamily]);

    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full bg-white shadow-sm overflow-hidden flex flex-col",
                "backface-hidden paper-texture",
                className
            )}
            style={{
                backfaceVisibility: 'hidden',
                transform: isBack ? 'rotateY(180deg)' : 'none',
            }}
        >
            {image ? (
                <div className="relative w-full h-full overflow-hidden">
                    <div
                        className="relative w-full h-full transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <Image
                            src={image}
                            alt="Letter content"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            ) : (
                <div className="p-8 flex flex-col h-full">
                    {text && (
                        <div
                            ref={textRef}
                            className="flex-grow whitespace-pre-wrap text-gray-800 text-justify overflow-hidden"
                            style={{ fontFamily: fontFamily }}
                        >
                            {text}
                        </div>
                    )}
                    {signature && (
                        <div
                            className="mt-8 text-right text-gray-600 flex-shrink-0"
                            style={{ fontFamily: fontFamily, fontSize: `${signatureFontSize}px` }}
                        >
                            {signature}
                        </div>
                    )}
                    {children}
                </div>
            )}
        </div>
    );
};
