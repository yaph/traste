export interface Instrument {
    tuning: string[];
    string_gauges: number[];
    fret_count: number;
    fret_markers: number[];
}


export const guitar: Instrument = {
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    string_gauges: [0.01, 0.013, 0.017, 0.026, 0.036, 0.046],
    fret_count: 15,
    fret_markers: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
}


export const ukulele: Instrument = {
    tuning: ['A4', 'E4', 'C4', 'G4'],
    string_gauges: [0.024, 0.031, 0.037, 0.026],
    fret_count: 12,
    fret_markers: [5, 7, 10, 12, 15, 17, 19]
}
