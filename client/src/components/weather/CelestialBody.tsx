type Props = {
    isDay?: 0 | 1;
};

export function CelestialBody({ isDay }: Props) {
    if (isDay === 1) {
        return (
            <div
                className="pointer-events-none w-40 h-40 bg-yellow-300 rounded-full shadow-[0_0_90px_rgba(250,204,21,0.9)] absolute top-24 left-24 z-0"
            />
        );
    }
    if (isDay === 0) {
        return (
            <div
                className="pointer-events-none w-36 h-36 bg-slate-100 rounded-full shadow-[0_0_90px_rgba(199,210,254,0.85)] absolute top-24 left-24 z-0"
            />
        );
    }
    return null;
}
