// Define defaults for stringed instruments.
export let instruments = {
    guitar: {
        tuning: ['E', 'B', 'G', 'D', 'A', 'E'],
        string_gauges: [0.01, 0.013, 0.017, 0.026, 0.036, 0.046],
        fret_count: 15,
        fret_markers: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
    },
    ukulele: {
        tuning: ['A', 'E', 'C', 'G'],
        string_gauges: [0.024, 0.031, 0.037, 0.026],
        fret_count: 12,
        fret_markers: [5, 7, 10, 12, 15, 17, 19]
    }
};