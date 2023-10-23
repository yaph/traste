import { Note as TonalNote } from '@tonaljs/tonal';

let chromatic_scale = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

// 7 qualitative colors from https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=7 for natural notes
// flats/sharps are assigned the color in between with using https://gka.github.io/palettes/
let note_colors = [
    '#8dd3c7',
    '#cae9be',
    '#ffffb3',
    '#bebada',
    '#e49ea5',
    '#fb8072',
    '#cc9ba2',
    '#80b1d3',
    '#fdb462',
    '#dbca65',
    '#b3de69',
    '#a5d89a'
];

/**
 * Return note name for position relative to root note index in chromatic scale.
 *
 * If a list of notes is given, the determined note must be included.
 *
 * @param root_index - root note index in chromatic scale
 * @param position - the number of frets away from the open string.
 * @param notes - optional list of notes that must include the determined note.
 */
export function noteAtPosition(root_index: number, position: number, notes?: Array<string>): string|null {
    const note_index = (root_index + position) % chromatic_scale.length;
    const note = chromatic_scale[note_index];

    if (notes) {
        if (notes.includes(note)) {
            return note;
        }
        for (let name of notes) {
            if (note == TonalNote.enharmonic(name)) {
                return name;
            }
        }
        return null;
    }
    return note;
}

/**
 * Return the color for the given note.
 *
 * @param {string} note - note name
 */
export function noteColor(note: string) {
    return note_colors[noteIndex(note)];
}


/**
 * Return index position of note in chromatic scale.
 * If a flat note is passed, the position of the enharmonic sharp is returned.
 *
 * @param {string} name - name of the note
 * @returns {number} chromatic_scale array index
 */
export function noteIndex(name: string): number {
    const note = TonalNote.get(name);
    if (note.letter) {
        if (chromatic_scale.includes(note.letter)) {
            return chromatic_scale.indexOf(note.letter);
        }
        const enharmonic = TonalNote.enharmonic(name);
        if (chromatic_scale.includes(enharmonic)) {
            return chromatic_scale.indexOf(enharmonic);
        }
    }
    throw Error(`Note unknown: ${name}`);
}


/**
 * Return note label for display.
 *
 * @param {string} name - name of the note
 * @returns {string} note label
 */
export function noteLabel(name: string): string {
    return name.replace(/b/g, '♭').replace(/#/g, '♯');
}