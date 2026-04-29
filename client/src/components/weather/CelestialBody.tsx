type Props = {
    isDay?: 0 | 1;
};

export function CelestialBody({ isDay }: Props) {
    if (isDay === 1) {
        return (
            <div
                className="pointer-events-none absolute z-0 rounded-full bg-yellow-300 shadow-[0_0_90px_rgba(250,204,21,0.9)] w-[clamp(120px,18vw,160px)] h-[clamp(120px,18vw,160px)] top-[clamp(56px,10vh,96px)] left-[clamp(20px,6vw,96px)]"
            />
        );
    }
    if (isDay === 0) {
        return (
            <div
                className="pointer-events-none absolute z-0 rounded-full bg-slate-100 shadow-[0_0_90px_rgba(199,210,254,0.85)] w-[clamp(108px,16vw,144px)] h-[clamp(108px,16vw,144px)] top-[clamp(56px,10vh,96px)] left-[clamp(20px,6vw,96px)]"
            />
        );
    }
    return null;
}
