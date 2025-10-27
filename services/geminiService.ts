import { GoogleGenAI, GenerateContentResponse, Part, Modality, Content, Type, GenerateVideosOperation } from "@google/genai";
import { ChatMessage, DiaryEntry, GroundingChunk, VisualFoodAnalysis, StyleAdvice, SpiritMessageType, UserProfile } from '../types';
import { getDiaryEntries } from "./diaryService";

// Initialize the Gemini AI client using the API_KEY environment variable.
// This key should be set in the hosting platform's environment variables.
// FIX: Use `process.env.API_KEY` as per the coding guidelines to resolve the TypeScript error.
const apiKey = process.env.API_KEY;
if (!apiKey) {
    // FIX: Update error message to reflect the correct environment variable.
    throw new Error("API_KEY is not defined. Please set it in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey });


const handleGeminiError = (error: any): string => {
    console.error("Gemini API Error:", error);
    let message = "فشل الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
    if (error.message) {
        if (error.message.includes('API key not valid')) {
            message = "مفتاح API غير صالح. يرجى التأكد من صحة المفتاح المقدم وإعادة المحاولة.";
        } else if (error.message.includes('429')) {
             message = "تم تجاوز حد الطلبات. يرجى المحاولة مرة أخرى لاحقًا.";
        } else if (error.message.includes('SAFETY')) {
            message = "تم حظر الطلب بسبب سياسات الأمان.";
        } else if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
            message = "حدث خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت.";
        } else {
            message = error.message;
        }
    }
    return message;
};

/**
 * A general-purpose function for fast tasks using 'gemini-2.5-flash'.
 */
export const callGeminiApi = async (prompt: string, images?: { mimeType: string; data: string }[]): Promise<string> => {
    try {
        const parts: Part[] = [{ text: prompt }];
        if (images && images.length > 0) {
            images.forEach(image => parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } }));
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
        });
        return response.text;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

/**
 * A specialized function for complex tasks using 'gemini-2.5-pro' with thinking mode.
 */
export const callGeminiProApi = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

/**
 * Calls Gemini API for structured JSON output.
 */
export const callGeminiJsonApi = async (prompt: string, schema: any, useProModel: boolean = false): Promise<any> => {
    try {
        const model = useProModel ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
        const config: any = {
            responseMimeType: 'application/json',
            responseSchema: schema,
        };
        if (useProModel) {
            config.thinkingConfig = { thinkingBudget: 32768 };
        }
        const response = await ai.models.generateContent({ model, contents: prompt, config });
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJsonText);
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

const visualFoodSchema = {
    type: Type.OBJECT,
    properties: {
        foodName: { type: Type.STRING, description: "اسم الطعام الذي تم التعرف عليه." },
        estimatedWeight: { type: Type.NUMBER, description: "الوزن المقدر للطعام بالجرام." },
        calories: { type: Type.NUMBER, description: "السعرات الحرارية المقدرة." },
        protein: { type: Type.NUMBER, description: "جرامات البروتين المقدرة." },
        carbohydrates: { type: Type.NUMBER, description: "جرامات الكربوهيدرات المقدرة." },
        fats: { type: Type.NUMBER, description: "جرامات الدهون المقدرة." },
        advice: { type: Type.STRING, description: "نصيحة صحية موجزة حول هذا الطعام." },
    },
    required: ["foodName", "estimatedWeight", "calories", "protein", "carbohydrates", "fats", "advice"],
};

export const callGeminiVisualJsonApi = async (prompt: string, image: { mimeType: string; data: string }): Promise<VisualFoodAnalysis> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: visualFoodSchema,
            },
        });
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJsonText) as VisualFoodAnalysis;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
}

export const styleAdviceSchema = {
  type: Type.OBJECT,
  properties: {
    makeup: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "عنوان جذاب لإطلالة المكياج المقترحة." },
        colors: { type: Type.STRING, description: "لوحة الألوان المقترحة (ظلال عيون، أحمر شفاه، إلخ)." },
        technique: { type: Type.STRING, description: "شرح موجز لتقنية المكياج التي تكمل الملابس." }
      },
      required: ['title', 'colors', 'technique']
    },
    accessories: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "عنوان لاقتراحات الاكسسوارات." },
        jewelry: { type: Type.STRING, description: "اقتراح للمجوهرات (قلادة, أقراط)." },
        bag: { type: Type.STRING, description: "اقتراح للحقيبة المناسبة." },
        shoes: { type: Type.STRING, description: "اقتراح للحذاء المناسب." }
      },
      required: ['title', 'jewelry', 'bag', 'shoes']
    },
    hair: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "عنوان لاقتراح تسريحة الشعر." },
        style: { type: Type.STRING, description: "وصف لتسريحة الشعر المقترحة." },
        tip: { type: Type.STRING, description: "نصيحة سريعة للعناية بالشعر أو لتثبيت التسريحة." }
      },
       required: ['title', 'style', 'tip']
    }
  },
  required: ['makeup', 'accessories', 'hair']
};

export const getStyleAdvice = async (prompt: string, image: { mimeType: string; data: string }): Promise<StyleAdvice> => {
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: styleAdviceSchema,
            },
        });
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJsonText) as StyleAdvice;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
}

/**
 * Handles conversational chat, optimized for speed with 'gemini-2.5-flash-lite' for follow-ups.
 */
export const callGeminiChatApi = async (messages: ChatMessage[], systemInstruction: string, isFollowUp: boolean = false): Promise<string> => {
    try {
        const model = isFollowUp ? 'gemini-flash-lite-latest' : 'gemini-2.5-flash';
        const filteredMessages = messages.filter(m => m.role !== 'model' || m.content.includes('اسالني عن اي شيء يخطر ببالك') === false);
        const contents: Content[] = filteredMessages.map(msg => ({
            role: msg.role,
            parts: msg.imageUrl ? [
                { inlineData: { mimeType: msg.imageUrl.match(/data:(.*);base64,/)?.[1] || 'image/jpeg', data: msg.imageUrl.split(',')[1] } },
                { text: msg.content }
            ] : [{ text: msg.content }]
        }));

        const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction: `${systemInstruction} الرجاء الرد دائماً باللغة العربية الفصحى.` },
        });
        return response.text;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

/**
 * Generates an image using Imagen 4.0 with aspect ratio options.
 */
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' = '1:1'): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });
        if (response.generatedImages?.[0]?.image?.imageBytes) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("لم يتم العثور على بيانات الصورة في الاستجابة.");
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

/**
 * Analyzes diary entries using the powerful 'gemini-2.5-pro' for deeper insights.
 */
export const analyzeDiaryEntries = async (): Promise<string> => {
    const allEntries: { date: string, entries: DiaryEntry[] }[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const entriesForDate = getDiaryEntries(date);
        if (entriesForDate.length > 0) allEntries.push({ date: date.toLocaleDateString('ar-EG'), entries: entriesForDate });
    }
    if (allEntries.length === 0) return "لا توجد بيانات كافية في يومياتك خلال الأسبوع الماضي لتقديم تحليل. حاول تسجيل أنشطتك اليومية بانتظام!";
    
    const formattedData = allEntries.map(day => `**${day.date}:**\n` + day.entries.map(e => `- ${e.title}: ${e.details}`).join('\n')).join('\n\n');
    const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت مستشار صحي استباقي وذكي. حلل بيانات اليوميات التالية للمستخدم على مدار الأسبوع الماضي بعمق. قدم رؤى واضحة حول الأنماط الإيجابية والسلبية، وقدم نصيحتين عمليتين ومخصصتين لتحسين صحته بناءً على البيانات المقدمة فقط.\n\n**بيانات الأسبوع:**\n${formattedData}`;
    
    return await callGeminiProApi(prompt); // Use the Pro model for deep analysis
};

export const generateMorningBriefing = async (userName: string | null): Promise<string> => {
    const name = userName || "يا صديقي";
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const entries = getDiaryEntries(yesterday);
        if (entries.length === 0) return `**صباح الخير ${name}!** يوم جديد هو فرصة جديدة. لم تسجل أي أنشطة بالأمس، ما رأيك أن تبدأ اليوم بتسجيل وجبة فطور صحية أو نشاط بسيط؟ أتمنى لك يوماً رائعاً!`;
        
        const formattedData = entries.map(e => `- ${e.title}: ${e.details}`).join('\n');
        const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط وبشكل شخصي وموجز جداً.** أنت "رفيق الحياة الاستباقي" في تطبيق صحتك/كي. حلل بيانات يوم أمس من يوميات المستخدم "${name}"، وقدم له موجز صباحي ذكي ومحفز. يجب أن يكون الموجز قصيراً وشخصياً. - ابدأ بـ "**صباح الخير ${name}!**". - علّق على شيء إيجابي واحد من يوم أمس (إن وجد). - قدم نصيحة واحدة صغيرة ومؤثرة لليوم بناءً على نشاطه الأخير. - كن ودوداً ومشجعاً. لا تتجاوز 3 جمل. **بيانات يوم أمس:**\n${formattedData}`;
        return await callGeminiApi(prompt);
    } catch (error) {
        console.error("Error generating morning briefing:", error);
        return `**صباح الخير ${name}!** أتمنى لك يوماً مليئاً بالصحة والنشاط. تذكر أن كل خطوة صغيرة هي إنجاز بحد ذاتها.`;
    }
};

export const getSpiritMessageFromGemini = async (messageType: SpiritMessageType, userProfile: UserProfile, context?: string): Promise<string> => {
    let prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط وبجملة واحدة قصيرة وموجزة جداً.** أنت "همسة الروح" في تطبيق 'الروح التقنية'. لديك معلومات عن المستخدم الحالي، استخدمها بذكاء لجعل رسالتك شخصية جداً ومناسبة له.

**قواعد صارمة جداً (يجب الالتزام بها):**
- **ممنوع منعاً باتاً** ذكر اسم "أحمد معروف"، "أحمد المؤسس"، "المؤسس"، "الروح التقنية"، أو أي اسم أو معلومة تعريفية عن التطبيق أو صانعه.
- **يجب أن تكون الرسالة موجهة للمستخدم فقط** ومبنية على معلوماته الشخصية (اسمه، مهنته، هدفه).
- **لا تذكر أنك ذكاء اصطناعي.**

**معلومات المستخدم:**
- **الاسم:** ${userProfile.name}
- **العمر:** ${userProfile.age}
- **الوزن:** ${userProfile.weight} كجم
- **المهنة:** ${userProfile.profession}
- **الهدف الرئيسي:** ${userProfile.mainGoal}

الآن، بناءً على نوع الرسالة المطلوبة، قم بإنشاء محتوى فريد:`;

    switch(messageType) {
        case 'tip':
            prompt += `\n**نوع الرسالة: نصيحة (tip).** قدم نصيحة واحدة فقط، ملهمة وعملية ومناسبة لهذا اليوم، مع الأخذ في الاعتبار هدف المستخدم ومهنته.`;
            break;
        case 'joke':
            prompt += `\n**نوع الرسالة: نكتة (joke).** قدم نكتة قصيرة ومرحة قد تكون مرتبطة بمهنة المستخدم أو اهتماماته لتبدأ يومه بابتسامة.`;
            break;
        case 'hint':
            if (context && context.startsWith('نصيحة متقدمة')) {
                 prompt += `\n**نوع الرسالة: تلميح متقدم (hint).** ${context}. قدم نصيحة احترافية ومتقدمة حول هذه الميزة، وحاول ربطها بملف المستخدم إن أمكن.`;
            } else {
                prompt += `\n**نوع الرسالة: تلميح (hint).** قدم تلميحاً ذكياً ومفيداً حول الميزة التالية لمساعدة المستخدم على اكتشافها: "${context}". اجعل التلميح شخصياً ومثيراً للفضول.`;
            }
            break;
        case 'quote':
            prompt += `\n**نوع الرسالة: اقتباس (quote).** قدم اقتباساً ملهماً وقصيراً واحداً فقط، وحاول ربطه بهدف المستخدم الرئيسي: "${userProfile.mainGoal}".`;
            break;
        default:
            return "كل يوم هو فرصة جديدة. استثمرها بحكمة.";
    }

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text;
    } catch (error) {
        console.error(`Error generating spirit message of type ${messageType}:`, error);
        return "كل يوم هو فرصة جديدة لتحقيق أهدافك. استثمرها بحكمة.";
    }
};

export const suggestMovieBasedOnDiary = async (): Promise<string> => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const entries = getDiaryEntries(yesterday);
        if (entries.length === 0) return "اسم الفيلم: Forrest Gump\n\nلا توجد بيانات كافية في يومياتك لاقتراح فيلم مخصص. لكن بناءً على أنك تبدأ يوماً جديداً، أقترح عليك فيلم 'Forrest Gump'. إنه فيلم ملهم ومؤثر عن رحلة رجل بسيط القلب عبر أحداث تاريخية عظيمة، يعلمنا أن الحياة مثل علبة الشوكولاتة، لا تعرف أبداً ما ستحصل عليه. مشاهدة ممتعة!";
        
        const formattedData = entries.map(e => `- ${e.title}: ${e.details}`).join('\n');
        const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت خبير سينمائي ومحلل نفسي. بناءً على يوميات المستخدم بالأمس، اقترح فيلماً واحداً يناسب مزاجه أو أنشطته. إذا كانت اليوميات تشير إلى نشاط وحيوية (مثل 'نشاط بدني')، اقترح فيلماً حماسياً أو فيلم أكشن. إذا كانت تشير إلى الاسترخاء أو ملاحظات هادئة، اقترح فيلماً درامياً هادئاً أو كوميدياً خفيفاً. - قدم ملخصاً للفيلم وسبب اقتراحك له بناءً على اليوميات. - **مهم جداً:** في بداية ردك، اكتب السطر التالي تماماً وبدون أي إضافات قبله: "اسم الفيلم: [اسم الفيلم هنا]". **يوميات الأمس:**\n${formattedData}`;
        return await callGeminiApi(prompt);
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const callGeminiSearchApi = async (query: string, useMaps: boolean, location?: { latitude: number; longitude: number; }): Promise<{ text: string, groundingChunks: GroundingChunk[] }> => {
    try {
        const tools: any[] = useMaps ? [{ googleMaps: {} }, { googleSearch: {} }] : [{ googleSearch: {} }];
        const toolConfig = useMaps && location ? { retrievalConfig: { latLng: location } } : {};
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: query,
            config: { tools, toolConfig, systemInstruction: 'أنت مساعد بحث مفيد. لخص النتائج باللغة العربية الفصحى.' },
        });
        
        const text = response.text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const groundingChunks: GroundingChunk[] = chunks.map((c: any) => c).filter(Boolean);

        return { text, groundingChunks };
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const textToSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const editImage = async (prompt: string, image: { mimeType: string, data: string }): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [ { inlineData: { mimeType: image.mimeType, data: image.data } }, { text: prompt } ] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data) return part.inlineData.data;
        }
        throw new Error("لم يتم العثور على صورة في الاستجابة.");
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const analyzeVideoFrame = async (prompt: string, image: { mimeType: string, data: string }): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use Pro for better video frame analysis
            contents: { parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] },
        });
        return response.text;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const generateVideo = async (prompt: string, image?: { mimeType: string; data: string }, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<GenerateVideosOperation> => {
    try {
        // FIX: Create a new GoogleGenAI instance for video generation to use the latest API key as per guidelines for Veo models.
        const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const operation = await videoAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: image ? { imageBytes: image.data, mimeType: image.mimeType } : undefined,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio },
        });
        return operation;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const getVideosOperation = async (operation: GenerateVideosOperation): Promise<GenerateVideosOperation> => {
    try {
        // FIX: Create a new GoogleGenAI instance for video operations to use the latest API key as per guidelines for Veo models.
        const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return await videoAi.operations.getVideosOperation({ operation });
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};

export const transcribeAudio = async (audio: { mimeType: string, data: string }): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ inlineData: { mimeType: audio.mimeType, data: audio.data } }] },
        });
        return response.text;
    } catch (error) {
        throw new Error(handleGeminiError(error));
    }
};
