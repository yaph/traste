export let chromatic_scale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export let enharmonic_notes = {
    'A': 'G##',
    'A#': 'Bb',
    'Ab': 'G#',
    'B': 'Cb',
    'B#': 'C',
    'Bb': 'A#',
    'C': 'B#',
    'C#': 'Db',
    'D': 'C##',
    'D#': 'Eb',
    'Db': 'C#',
    'E#': 'F',
    'Eb': 'D#',
    'F': 'E#',
    'F#': 'Gb',
    'G': 'F##',
    'G#': 'Ab',
    'Gb': 'F#'
};

/**
 * Return index position of note in chromatic scale.
 * If a flat note is passed, the position of the enharmonic sharp is returned.
 *
 * @param {string} name - name of the note
 * @returns {number} chromatic_scale array index
 */
export function noteIndex(name) {
    return name.endsWith('b') ? chromatic_scale.indexOf(enharmonic_notes[name]) : chromatic_scale.indexOf(name);
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