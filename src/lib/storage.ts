import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (file: File, path: string): Promise<string> => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};

export const uploadBase64 = async (base64String: string, path: string): Promise<string> => {
    try {
        // Convert base64 to Blob
        const response = await fetch(base64String);
        const blob = await response.blob();
        const file = new File([blob], "image.png", { type: blob.type });

        return uploadImage(file, path);
    } catch (error) {
        console.error("Error uploading base64:", error);
        throw error;
    }
};
