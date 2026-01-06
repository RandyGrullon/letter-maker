import React from "react";
import { LetterContent } from "@/types";
import { Input } from "@/components/UI/Input";
import { Label } from "@/components/UI/Label";
import { Textarea } from "@/components/UI/Textarea";

interface ConfigFormProps {
    content: LetterContent;
    onChange: (content: LetterContent) => void;
    onFileChange: (key: string, file: File) => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ content, onChange, onFileChange }) => {
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        onChange({ ...content, [name]: value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            onFileChange(name, file);

            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    onChange({ ...content, [name]: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Customize Letter</h2>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="frontImage">Front Cover Image</Label>
                    <Input
                        id="frontImage"
                        name="frontImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="leftImage">Inside Left Image</Label>
                    <Input
                        id="leftImage"
                        name="leftImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="rightText">Message</Label>
                    <Textarea
                        id="rightText"
                        name="rightText"
                        value={content.rightText || ""}
                        onChange={handleChange}
                        placeholder="Write your message here..."
                        className="mt-1 h-32 font-serif"
                    />
                </div>

                <div>
                    <Label htmlFor="signature">Signature</Label>
                    <Input
                        id="signature"
                        name="signature"
                        value={content.signature || ""}
                        onChange={handleChange}
                        placeholder="e.g. With love, Randy"
                        className="mt-1 font-script"
                    />
                </div>

                <div>
                    <Label htmlFor="backImage">Back Cover Image</Label>
                    <Input
                        id="backImage"
                        name="backImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-1"
                    />
                </div>
            </div>
        </div>
    );
};
