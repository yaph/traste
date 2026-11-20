import { get, enharmonic } from '@tonaljs/note';

const chromatic_scale = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

/**
 * Resolve a note name to the spelling used by the chromatic scale.
 * Octaves are deliberately ignored: pitch-class operations must work for
 * both `Bb` and `Bb2`.
 */
function normalizedPitchClass(name: string): string | null {
    const note = get(name);
    if (!note.letter) return null;

    if (chromatic_scale.includes(note.pc)) return note.pc;

    const alternative = enharmonic(note.pc);
    return chromatic_scale.includes(alternative) ? alternative : null;
}


/**
 * Return note name for a position relative to root note index in chromatic scale.
 *
 * If a list of notes is given, the determined note must be included. The
 * spelling from `notes` is preserved, including flat spellings and octaves.
 *
 * @param root_index - root note index in chromatic scale
 * @param position - the number of frets away from the open string
 * @param notes - optional list of notes that must include the determined note
 */
export function noteAtPosition(root_index: number, position: number, notes?: string[]): string | null {
    if (!Number.isInteger(root_index) || !Number.isInteger(position)) {
        throw new RangeError('Note indexes and fret positions must be integers.');
    }

    const note_index = ((root_index + position) % chromatic_scale.length + chromatic_scale.length)
        % chromatic_scale.length;
    const note = chromatic_scale[note_index];

    if (notes) {
        for (const name of notes) {
            if (normalizedPitchClass(name) === note) return name;
        }
        return null;
    }

    return note;
}


/**
 * Return index position of a note in the A-based chromatic scale.
 * If a flat note is passed, the position of its enharmonic sharp is returned.
 * Any octave suffix is ignored.
 *
 * @param name - name of the note, optionally including an octave
 * @returns chromatic_scale array index
 */
export function noteIndex(name: string): number {
    const pitchClass = normalizedPitchClass(name);
    const index = pitchClass === null ? -1 : chromatic_scale.indexOf(pitchClass);

    if (index === -1) {
        throw Error(`Note unknown: ${name}`);
    }

    return index;
}


/**
 * Return note label for display.
 *
 * @param name - name of the note
 * @returns note label
 */
export function noteLabel(name: string): string {
    return name.replace(/b/g, '♭').replace(/#/g, '♯');
}
