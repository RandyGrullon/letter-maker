export interface LetterContent {
    frontImage?: string;
    frontImageZoom?: number;
    leftImage?: string;
    leftImageZoom?: number;
    rightText?: string;
    signature?: string;
    backImage?: string; // Kept for type compatibility, though unused in UI
}

export interface LetterStyle {
    themeColor: string;
    fontFamily: string;
    fontSize: number;
    signatureFontSize: number;
}

export interface Letter {
    id?: string;
    content: LetterContent;
    style: LetterStyle;
    createdAt?: any; // Firestore Timestamp
    isRead?: boolean;
    senderId?: string;
    recipientId?: string;
    recipientName?: string;
    recipientEmail?: string;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: any;
}
