"use client";

import BannerBar from "@/components/banner-bar";
import PromoSlider from "@/components/promo-slider";
import { useFeatures } from "@/hooks/useFeatures";

export function BookingBanners({ slides }: { slides?: any[] }) {
    const { isFeatureEnabled } = useFeatures();
    if (!isFeatureEnabled("BANNERS")) return null;
    return (
        <>
            <BannerBar />
            <PromoSlider initialSlides={slides} />
        </>
    );
}
