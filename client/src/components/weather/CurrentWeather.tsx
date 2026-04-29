import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WeatherResponse } from "../../types/weather";
import { HeroCard } from "../weather/HeroCard";
import { StatsGrid } from "../weather/StatsGrid";
import { SunCycleCard } from "../weather/SunCycleCard";
import { StaggerStack } from "../ui/StaggerStack";
import { SectionTitle } from "./SectionTitle";
export const CurrentWeather = memo(function CurrentWeather({ current, isSaved, onToggleFavorite, }: {
    current: WeatherResponse | null;
    isSaved: boolean;
    onToggleFavorite: () => void;
}) {
    if (!current)
        return null;
    return (<>
      <AnimatePresence mode="wait">
        <motion.div key={`weather-${current.name}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          <HeroCard weather={current} onSaveFavorite={onToggleFavorite} canSave isSaved={isSaved}/>
        </motion.div>
      </AnimatePresence>

      <StaggerStack replayKey={current.name} delayBetween={0.05} initialDelay={0.1}>
        <section className="px-4 mt-12">
          <SectionTitle kicker="Conditions" title="Current details"/>
          <StatsGrid weather={current}/>
        </section>

        <section className="px-4 mt-12">
          <SectionTitle kicker="Sun" title="Sunrise & sunset"/>
          <SunCycleCard weather={current}/>
        </section>
      </StaggerStack>
    </>);
});
