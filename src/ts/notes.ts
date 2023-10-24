import { Note as TonalNote } from '@tonaljs/tonal';

let chromatic_scale = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];


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
 * Return index position of note in chromatic scale.
 * If a flat note is passed, the position of the enharmonic sharp is returned.
 *
 * @param name - name of the note
 * @returns chromatic_scale array index
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
 * @param name - name of the note
 * @returns note label
 */
export function noteLabel(name: string): string {
    return name.replace(/b/g, '♭').replace(/#/g, '♯');
}