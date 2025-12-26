import { useContext } from 'react';
import { FeatureContext } from '@/providers/feature-provider';

export function useFeatures() {
    const context = useContext(FeatureContext);

    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeatureProvider');
    }

    return context;
}
