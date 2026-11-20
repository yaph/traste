import { midi as midiNote } from '@tonaljs/note';
import { noteIndex } from './notes';

export interface Instrument {
    /** Open-string notes, ordered from the first/top string to the last/bottom string. */
    tuning: string[];
    /** Positive string thickness values; one value is required for each string. */
    string_gauges: number[];
    /** Number of frets shown, excluding the open-string position. */
    fret_count: number;
    /** Fret positions at which markers are drawn. Values beyond fret_count are ignored. */
    fret_markers: number[];
}

/**
 * Validate an instrument configuration before it is used to draw a fretboard.
 * Throws a descriptive error instead of allowing malformed SVG or MIDI data.
 */
export function validateInstrument(instrument: Instrument): void {
    if (!instrument || typeof instrument !== 'object') {
        throw new TypeError('Invalid instrument: expected an instrument configuration object.');
    }

    if (!Array.isArray(instrument.tuning) || instrument.tuning.length === 0) {
        throw new TypeError('Invalid instrument: tuning must contain at least one string note.');
    }

    if (!Array.isArray(instrument.string_gauges)
        || instrument.string_gauges.length !== instrument.tuning.length) {
        throw new RangeError('Invalid instrument: string_gauges must contain exactly one value per tuning entry.');
    }

    if (!Number.isInteger(instrument.fret_count) || instrument.fret_count < 0) {
        throw new RangeError('Invalid instrument: fret_count must be a non-negative integer.');
    }

    if (!Array.isArray(instrument.fret_markers)) {
        throw new TypeError('Invalid instrument: fret_markers must be an array.');
    }

    instrument.tuning.forEach((name, index) => {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new TypeError(`Invalid instrument: tuning[${index}] must be a note name with an octave.`);
        }

        try {
            // Validate pitch-class spelling independently of MIDI parsing.
            noteIndex(name);
        } catch {
            throw new Error(`Invalid instrument: tuning[${index}] ("${name}") is not a recognized note.`);
        }

        const openMidi = midiNote(name);
        if (openMidi === null || !Number.isInteger(openMidi) || openMidi < 0 || openMidi > 127) {
            throw new RangeError(
                `Invalid instrument: tuning[${index}] ("${name}") must resolve to a MIDI note between 0 and 127.`
            );
        }

        if (openMidi + instrument.fret_count > 127) {
            throw new RangeError(
                `Invalid instrument: tuning[${index}] ("${name}") exceeds MIDI note 127 within the configured fret range.`
            );
        }
    });

    instrument.string_gauges.forEach((gauge, index) => {
        if (typeof gauge !== 'number' || !Number.isFinite(gauge) || gauge <= 0) {
            throw new RangeError(`Invalid instrument: string_gauges[${index}] must be a positive finite number.`);
        }
    });

    instrument.fret_markers.forEach((fret, index) => {
        if (!Number.isInteger(fret) || fret < 1) {
            throw new RangeError(`Invalid instrument: fret_markers[${index}] must be a positive integer.`);
        }
    });
}


export const bass: Instrument = {
    tuning: ['G2', 'D2', 'A1', 'E1'],
    string_gauges: [0.045, 0.065, 0.085, 0.105],
    fret_count: 12,
    fret_markers: [3, 5, 7, 9, 12, 15, 17, 19]
};

export const guitar: Instrument = {
    tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
    string_gauges: [0.01, 0.013, 0.017, 0.026, 0.036, 0.046],
    fret_count: 12,
    fret_markers: [3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
};

export const ukulele: Instrument = {
    tuning: ['A4', 'E4', 'C4', 'G4'],
    string_gauges: [0.024, 0.031, 0.037, 0.026],
    fret_count: 12,
    fret_markers: [5, 7, 10, 12, 15, 17, 19]
};
