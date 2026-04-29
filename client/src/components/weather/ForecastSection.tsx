import { memo } from "react";
import { ForecastTabs } from "./ForecastTabs";
import { TimeSlider } from "./TimeSlider";
import { SectionTitle } from "./SectionTitle";
import type { ForecastResponse, WeatherResponse } from "../../types/weather";
export const ForecastSection = memo(function ForecastSection({ current, forecast, }: {
    current: WeatherResponse | null;
    forecast: ForecastResponse | null;
}) {
    if (!current)
        return null;
    return (<>
      {forecast && (<>
          <section className="px-4 mt-12">
            <SectionTitle kicker="Sky" title="How today unfolds" staticReveal/>
            <TimeSlider forecast={forecast} current={current}/>
          </section>

          <section className="px-4 mt-12">
            <SectionTitle kicker="Forecast" title="The days ahead" staticReveal/>
            <ForecastTabs forecast={forecast} currentTemp={current.main.temp}/>
          </section>
        </>)}
    </>);
});
