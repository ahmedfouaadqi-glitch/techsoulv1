import { ProactiveInsight, UserProfile, DiaryEntry } from '../types';
import { getDiaryEntries } from './diaryService';
import { callGeminiProApi } from './geminiService';
import { getItem, setItem } from './storageService';

const INSIGHT_KEY = 'proactiveInsight';
const MIN_TIME_BETWEEN_INSIGHTS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DAYS_TO_ANALYZE = 3;

export const getInsight = (): ProactiveInsight | null => {
    return getItem<ProactiveInsight | null>(INSIGHT_KEY, null);
};

export const dismissInsight = (id: string): void => {
    const insight = getInsight();
    if (insight && insight.id === id) {
        insight.isDismissed = true;
        setItem(INSIGHT_KEY, insight);
    }
};

export const shouldGenerateNewInsight = async (userProfile: UserProfile | null): Promise<boolean> => {
    if (!userProfile) return false;

    const insight = getInsight();
    if (insight && (Date.now() - insight.timestamp < MIN_TIME_BETWEEN_INSIGHTS)) {
        return false;
    }

    // Check if there are enough diary entries in the last few days to warrant an analysis
    let totalEntries = 0;
    for (let i = 0; i < DAYS_TO_ANALYZE; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        totalEntries += getDiaryEntries(date).length;
    }
    
    // We need at least 3 entries in the last 3 days to generate a meaningful insight
    return totalEntries >= 3;
};

export const generateInsight = async (userProfile: UserProfile | null): Promise<string | null> => {
    if (!userProfile) return null;

    try {
        const allEntries: { date: string, entries: DiaryEntry[] }[] = [];
        for (let i = 0; i < DAYS_TO_ANALYZE; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const entriesForDate = getDiaryEntries(date);
            if (entriesForDate.length > 0) allEntries.push({ date: date.toLocaleDateString('ar-EG'), entries: entriesForDate });
        }

        const formattedData = allEntries.map(day => `**${day.date}:**\n` + day.entries.map(e => `- ${e.title}: ${e.details}`).join('\n')).join('\n\n');
        
        const prompt = `**مهمتك: الرد باللغة العربية الفصحى فقط، كرسالة واحدة قصيرة وموجزة.** أنت "همسة الروح" في تطبيق صحتك/كي، مهمتك هي تحليل بيانات المستخدم بهدوء وتقديم ملاحظة استباقية واحدة، ذكية، ولطيفة.
        - **خاطب المستخدم باسمه:** ${userProfile.name}.
        - **حلل البيانات:** انظر إلى بيانات اليوميات من الأيام الـ ${DAYS_TO_ANALYZE} الماضية.
        - **ابحث عن نمط:** ابحث عن علاقة واحدة مثيرة للاهتمام، أو نمط إيجابي لتشجيعه، أو فرصة صغيرة للتحسين. لا تكن سلبياً.
        - **كن موجزاً جداً:** قدم ملاحظتك في جملتين على الأكثر. يجب أن تكون كنصيحة سريعة أو ملاحظة ودودة.
        - **مثال جيد:** "مرحباً يا ${userProfile.name}، لاحظت أنك تسجل 'صداع' في الأيام التي لا تشرب فيها كمية كافية من الماء. ما رأيك في بدء تحدي شرب الماء هذا الأسبوع؟"
        - **مثال جيد آخر:** "يا ${userProfile.name}، عمل رائع في تسجيل وجباتك بانتظام! أرى أنك تركز على البروتين، وهذا ممتاز."

        **بيانات المستخدم:**
        - **الهدف الرئيسي:** ${userProfile.mainGoal}
        - **المهنة:** ${userProfile.profession}
        - **إدخالات اليوميات الأخيرة:**\n${formattedData}`;

        const message = await callGeminiProApi(prompt);

        if (message && message.trim()) {
            const newInsight: ProactiveInsight = {
                id: `insight-${Date.now()}`,
                timestamp: Date.now(),
                message: message.trim(),
                isDismissed: false,
            };
            setItem(INSIGHT_KEY, newInsight);
            return newInsight.message;
        }

        return null;

    } catch (error) {
        console.error("Failed to generate proactive insight:", error);
        return null;
    }
};
