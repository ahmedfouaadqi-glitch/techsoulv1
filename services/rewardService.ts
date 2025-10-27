import { SpiritReward } from '../types';
import { callGeminiApi } from './geminiService';
import { awardSpecificBadgeById } from './achievementService';
import { getItem, setItem } from './storageService';

const REWARD_KEY = 'dailySpiritRewardStatus';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface RewardStatus {
    lastClaimed: number;
}

export const canClaimReward = (): boolean => {
    const status = getItem<RewardStatus | null>(REWARD_KEY, null);
    if (!status) {
        return true;
    }
    return Date.now() - status.lastClaimed > ONE_DAY_MS;
};

const getRewardPrompt = (type: SpiritReward['type']): string => {
    switch (type) {
        case 'recipe':
            return "**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت طاهٍ مبدع في تطبيق 'الروح التقنية'. قدم وصفة صحية حصرية وسريعة واحدة فقط ومناسبة لليوم. اجعلها فريدة ومثيرة للاهتمام وقدمها بتنسيق Markdown واضح.";
        case 'tip':
            return "**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت خبير في نمط الحياة في تطبيق 'الروح التقنية'. قدم نصيحة واحدة فقط، غير متوقعة ومفيدة لتحسين اليوم. كن موجزاً ومباشراً.";
        case 'challenge':
            return "**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت مدرب لياقة محفز في تطبيق 'الروح التقنية'. ابتكر تحدياً سريعاً وممتعاً لمدة يوم واحد فقط يمكن لأي شخص القيام به.";
        case 'quote':
            return "**مهمتك: الرد باللغة العربية الفصحى فقط.** أنت فيلسوف وحكيم في تطبيق 'الروح التقنية'. قدم اقتباساً ملهماً وقوياً واحداً فقط لبدء اليوم بطاقة إيجابية.";
        default:
            return '';
    }
};

export const claimReward = async (): Promise<SpiritReward> => {
    if (!canClaimReward()) {
        throw new Error("Reward already claimed today.");
    }

    const rewardTypes: SpiritReward['type'][] = ['recipe', 'tip', 'challenge', 'quote', 'badge'];
    const randomType = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];

    let reward: SpiritReward;

    if (randomType === 'badge') {
        // Award the "Treasure Hunter" badge if it's the first time
        const firstTimeKey = 'hasOpenedSpiritBox';
        if (!getItem(firstTimeKey, null)) {
             awardSpecificBadgeById('treasure_hunter');
             setItem(firstTimeKey, 'true');
             reward = {
                 type: 'badge',
                 title: 'إنجاز جديد!',
                 icon: '🏆',
                 content: "لقد حصلت على شارة 'صائد الكنوز' لفتحك صندوق الروح لأول مرة! تفقد صفحة الإنجازات لرؤيتها."
             };
        } else {
            // If badge is chosen again, but already awarded, default to a quote
             const content = await callGeminiApi(getRewardPrompt('quote'));
             reward = { type: 'quote', title: 'اقتباس اليوم', icon: '✨', content };
        }
    } else {
        const prompt = getRewardPrompt(randomType);
        const content = await callGeminiApi(prompt);
        
        switch(randomType) {
            case 'recipe':
                reward = { type: 'recipe', title: 'وصفة اليوم الحصرية', icon: '🍲', content };
                break;
            case 'tip':
                reward = { type: 'tip', title: 'نصيحة من الروح', icon: '💡', content };
                break;
            case 'challenge':
                reward = { type: 'challenge', title: 'تحدي اليوم السريع', icon: '⚡', content };
                break;
            case 'quote':
                reward = { type: 'quote', title: 'اقتباس اليوم', icon: '✨', content };
                break;
            default: // Should not happen
                reward = { type: 'tip', title: 'نصيحة من الروح', icon: '💡', content: 'تذكر أن تشرب الماء!' };
        }
    }
    
    // Save the claim status
    const newStatus: RewardStatus = { lastClaimed: Date.now() };
    setItem(REWARD_KEY, newStatus);

    return reward;
};
