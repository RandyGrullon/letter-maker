import { db } from "./firebase";
import { collection, addDoc, doc, getDoc, serverTimestamp, getDocs, orderBy, query, updateDoc, setDoc } from "firebase/firestore";
import { Letter, User } from "@/types";
import { auth } from "./firebase";

const COLLECTION_NAME = "letters-to-zoe";
const USERS_COLLECTION = "users";

export const saveLetter = async (letter: Omit<Letter, "id" | "createdAt" | "isRead">): Promise<string> => {
    try {
        const currentUser = auth.currentUser;
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...letter,
            senderId: currentUser?.uid || null,
            createdAt: serverTimestamp(),
            isRead: false,
        });
        return docRef.id;
    } catch (error) {
        console.error("Error saving letter:", error);
        throw error;
    }
};

export const updateLetter = async (id: string, updates: Partial<Omit<Letter, "id" | "createdAt">>): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, updates);
    } catch (error) {
        console.error("Error updating letter:", error);
        throw error;
    }
};

export const updateLetterTitle = async (id: string, title: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            "content.title": title
        });
    } catch (error) {
        console.error("Error updating letter title:", error);
        throw error;
    }
};

export const getLetter = async (id: string): Promise<Letter | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Letter;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting letter:", error);
        throw error;
    }
};

export const getAllLetters = async (): Promise<Letter[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
    } catch (error) {
        console.error("Error getting all letters:", error);
        return [];
    }
};

export const markAsRead = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, { isRead: true });
    } catch (error) {
        console.error("Error marking letter as read:", error);
    }
};

export const createUserProfile = async (
    userId: string,
    firstName: string,
    lastName: string,
    email: string
): Promise<void> => {
    try {
        const userDoc = doc(db, USERS_COLLECTION, userId);
        await setDoc(userDoc, {
            firstName,
            lastName,
            email,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        throw error;
    }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
        const userDoc = doc(db, USERS_COLLECTION, userId);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() } as User;
        }
        return null;
    } catch (error) {
        console.error("Error getting user profile:", error);
        return null;
    }
};

export const assignLetterToRecipient = async (
    letterId: string,
    userId: string,
    firstName: string,
    lastName: string,
    email: string
): Promise<void> => {
    try {
        const letterRef = doc(db, COLLECTION_NAME, letterId);
        await updateDoc(letterRef, {
            recipientId: userId,
            recipientName: `${firstName} ${lastName}`,
            recipientEmail: email,
        });
    } catch (error) {
        console.error("Error assigning letter to recipient:", error);
        throw error;
    }
};

export const searchUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);

        const userDoc = querySnapshot.docs.find(doc => doc.data().email === email);

        if (userDoc) {
            return { id: userDoc.id, ...userDoc.data() } as User;
        }
        return null;
    } catch (error) {
        console.error("Error searching user by email:", error);
        return null;
    }
};

export const deleteLetter = async (letterId: string, userId: string, isSender: boolean): Promise<void> => {
    try {
        const letterRef = doc(db, COLLECTION_NAME, letterId);
        
        if (isSender) {
            // If sender deletes, mark as deleted completely
            await updateDoc(letterRef, {
                deleted: true
            });
        } else {
            // If recipient deletes, add to hiddenFor array
            const letterSnap = await getDoc(letterRef);
            if (letterSnap.exists()) {
                const letter = letterSnap.data() as Letter;
                const hiddenFor = letter.hiddenFor || [];
                if (!hiddenFor.includes(userId)) {
                    await updateDoc(letterRef, {
                        hiddenFor: [...hiddenFor, userId]
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error deleting letter:", error);
        throw error;
    }
};
