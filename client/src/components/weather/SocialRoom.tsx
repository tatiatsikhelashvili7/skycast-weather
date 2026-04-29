import { memo } from "react";
import { SlideUpOnScroll } from "../ui/ScrollLinked";
import { FriendsRoomSection } from "./FriendsRoomSection";
import { SectionTitle } from "./SectionTitle";
import type { WeatherResponse } from "../../types/weather";
export const SocialRoom = memo(function SocialRoom({ current, }: {
    current: WeatherResponse | null;
}) {
    if (!current)
        return null;
    return (<SlideUpOnScroll stiffness={0.8}>
      <section className="px-4 mt-12">
        <SectionTitle kicker="Together" title="Watch the weather with friends"/>
        <FriendsRoomSection current={current}/>
      </section>
    </SlideUpOnScroll>);
});
