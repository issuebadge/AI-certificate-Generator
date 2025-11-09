
import { GoogleGenAI, Type } from "@google/genai";
import { CertificateElement } from '../types';

export const generateCertificateTemplate = async (prompt: string, width: number, height: number): Promise<CertificateElement> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const certificateSchema = {
        type: Type.OBJECT,
        properties: {
            backgroundColor: { type: Type.STRING, description: "Background color of the certificate, e.g., '#FFFFFF'." },
            borderColor: { type: Type.STRING, description: "Border color, e.g., '#C0C0C0'." },
            borderStyle: { type: Type.STRING, description: "The style of the border. Can be 'classic', 'double', 'minimal', or 'none'." },
            elements: {
                type: Type.ARRAY,
                description: "An array of elements on the certificate.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING, description: "A unique identifier, generated with crypto.randomUUID()." },
                        type: { type: Type.STRING, description: "Type of element, can be 'text', 'image', or 'shape'." },
                        x: { type: Type.NUMBER, description: "X coordinate from top-left." },
                        y: { type: Type.NUMBER, description: "Y coordinate from top-left." },
                        width: { type: Type.NUMBER, description: "Width of the element." },
                        height: { type: Type.NUMBER, description: "Height of the element." },
                        rotation: { type: Type.NUMBER, description: "Rotation in degrees." },
                        content: { type: Type.STRING, description: "Text content (for type 'text')." },
                        fontFamily: { type: Type.STRING, description: "Font family, e.g., 'Merriweather'." },
                        fontSize: { type: Type.NUMBER, description: "Font size in pixels." },
                        fontWeight: { type: Type.STRING, description: "Font weight, e.g., 'normal' or 'bold'." },
                        fontStyle: { type: Type.STRING, description: "Font style, e.g., 'normal' or 'italic'." },
                        textDecoration: { type: Type.STRING, description: "Text decoration, e.g., 'none' or 'underline'." },
                        color: { type: Type.STRING, description: "Text color hex code." },
                        textAlign: { type: Type.STRING, description: "Text alignment: 'left', 'center', 'right', or 'justify'." },
                        letterSpacing: { type: Type.NUMBER, description: "Letter spacing in pixels." },
                        lineHeight: { type: Type.NUMBER, description: "Line height as a multiplier, e.g., 1.5." },
                        src: { type: Type.STRING, description: "Image source URL (for type 'image'). Use placeholders like 'placeholder:logo' or 'placeholder:seal'." },
                        shapeType: { type: Type.STRING, description: "Shape type, e.g., 'line'." },
                        stroke: { type: Type.STRING, description: "Stroke color for shapes." },
                        strokeWidth: { type: Type.NUMBER, description: "Stroke width for shapes." }
                    },
                    required: ["id", "type", "x", "y", "width", "height", "rotation"]
                }
            }
        },
        required: ["backgroundColor", "borderColor", "borderStyle", "elements"]
    };

    const fullPrompt = `Generate a JSON structure for a certificate template for "${prompt}". The certificate is size ${width}x${height} pixels. Populate all text fields with appropriate placeholder content. For images, use placeholders like 'placeholder:logo' or 'placeholder:seal'. Ensure all elements have a unique ID using crypto.randomUUID(). Stick strictly to the provided JSON schema. Choose an appropriate borderStyle.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: certificateSchema,
            },
        });

        const jsonString = response.text.trim();
        const generatedData = JSON.parse(jsonString);
        
        // Post-process to replace placeholders and add UUIDs
        generatedData.elements.forEach((el: any) => {
            el.id = crypto.randomUUID();
             // Add defaults for new properties if AI doesn't provide them
            if (el.type === 'text') {
                el.fontStyle = el.fontStyle || 'normal';
                el.textDecoration = el.textDecoration || 'none';
                el.letterSpacing = el.letterSpacing || 0;
                el.lineHeight = el.lineHeight || 1.2;
            }
            if (el.type === 'image' && el.src) {
                if (el.src.includes('logo')) {
                    el.src = 'https://picsum.photos/seed/logo/100';
                } else if (el.src.includes('seal')) {
                     el.src = 'https://picsum.photos/seed/seal/120';
                }
            }
        });

        return generatedData as CertificateElement;

    } catch (error) {
        console.error("Error generating certificate template:", error);
        throw new Error("Failed to generate certificate from AI.");
    }
};
