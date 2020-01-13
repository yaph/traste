let chromatic_scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let enharmonic_notes = {
    'A': ['G##', 'Bbb'],
    'A#': ['Bb'],
    'Ab': ['G#', 'Cbb'],
    'B': ['Cb'],
    'B#': ['C'],
    'Bb': ['A#'],
    'C': ['B#', 'Dbb'],
    'C#': ['Db'],
    'D': ['C##', 'Ebb'],
    'D#': ['Eb'],
    'Db': ['C#'],
    'E': ['Fb'],
    'E#': ['F', 'Gbb'],
    'Eb': ['D#'],
    'F': ['E#', 'Gbb'],
    'F#': ['Gb', 'E##'],
    'G': ['F##', 'Abb'],
    'G#': ['Ab', 'Cbb'],
    'Gb': ['F#']
};
let note_colors = [
    "#fb8072",
    "#fccde5",
    "#fdb462",
    "#ffed6f",
    "#ffffb3",
    "#b3de69",
    "#ccebc5",
    "#80b1d3",
    "#bc80bd",
    "#8dd3c7",
    "#bebada",
    "#d9d9d9"
];

/**
 * Return note name for position relative to root note index in chromatic scale.
 *
 * If a list of notes is given, the determined note must be included.
 *
 * @param {number} root_index - root note index in chromatic scale
 * @param {number} position - the number of frets away from the open string.
 * @param {Object[]} [notes] - optional list of notes that must include the determined note.
 */
export function noteAtPosition(root_index, position, notes=[]) {
    let note_index = (root_index + position) % chromatic_scale.length;
    let note = chromatic_scale[note_index];
    if (notes && !notes.includes(note)) {
        for (let enharmonic of enharmonic_notes[note]) {
            if (notes.includes(enharmonic)) {
                return enharmonic;
            }
        }
        return;
    }
    return note;
}

/**
 * Return a list of colors, one for each note in the given notes list.
 *
 * Different sets of colors are returned based on the number of notes.
 *
 * @param {Object[]} notes - list of notes
 */
export function noteColors(notes) {
    switch (notes.length) {
        case 3: // assume a triad
            return [note_colors[0], note_colors[4], note_colors[7]];
        case 4: // assume a seventh chord
            return [note_colors[0], note_colors[4], note_colors[7], note_colors[11]];
        case 5: // assume a ninth chord
            return [note_colors[0], note_colors[4], note_colors[7], note_colors[11], note_colors[2]];
        case 7: // assume a diatonic major scale
            return [note_colors[0], note_colors[2], note_colors[4], note_colors[5], note_colors[7], note_colors[9], note_colors[11]];
        default:
            return note_colors.slice(0, notes.length);
    }
}

/**
 * Return index position of note in chromatic scale.
 * If a flat note is passed, the position of the enharmonic sharp is returned.
 *
 * @param {string} name - name of the note
 * @returns {number} chromatic_scale array index
 */
export function noteIndex(name) {
    if (chromatic_scale.includes(name)) {
        return chromatic_scale.indexOf(name);
    }
    for (let enharmonic of enharmonic_notes[name]) {
        if (chromatic_scale.includes(enharmonic)) {
            return chromatic_scale.indexOf(enharmonic);
        }
    }
}

/**
 * Return note label for display.
 *
 * @param {string} name - name of the note
 * @returns {string} note label
 */
export function noteLabel(name) {
    return name.replace(/b/g, '♭').replace(/#/g, '♯');
}