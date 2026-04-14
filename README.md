# traste

> A library for rendering guitar and ukulele fretboard diagrams as SVG elements.

![Ukulele Fretboard](img/ukulele-fretboard.png 'UkeAlong.com Ukulele Fretboard')

## Install

```sh
npm install traste
```

## Usage

Create a `Fretboard` instance with an instrument and a selector. The fretboard is rendered immediately on construction. Call `drawNotes()` or `drawNoteAtPosition()` to add notes.

```js
const uke1 = new traste.Fretboard(traste.ukulele, '#fretboard');
uke1.drawNotes();

const uke2 = new traste.Fretboard(traste.ukulele, '#fretboard-eb');
uke2.drawNotes(['Eb', 'G', 'Bb']);

const uke3 = new traste.Fretboard(traste.ukulele, '#fretboard-positions');
uke3.drawNoteAtPosition('Eb', 2, 3);
uke3.drawNoteAtPosition('G', 1, 3);
```

Width defaults to 95% of the container's width and can be passed as an optional third argument to the constructor.

### Instruments

Three instruments are included: `traste.bass`, `traste.guitar` and `traste.ukulele`. They are plain objects implementing the `Instrument` interface, so you can define custom instruments:

```ts
import { Instrument } from 'traste';

const ukulele_low_g: Instrument = {
    tuning: ['A4', 'E4', 'C4', 'G3'],
    string_gauges: [0.024, 0.031, 0.037, 0.041],
    fret_count: 12,
    fret_markers: [5, 7, 10, 12]
};
```

### API

| Method | Description |
|---|---|
| `constructor(instrument, selector, width?)` | Render the fretboard SVG into the matched element |
| `drawNotes(notes?)` | Draw all notes, or only those in the given array |
| `drawNoteAtPosition(note, string, fret)` | Draw a single note at a specific string and fret index |
| `clearNotes()` | Remove all drawn notes from the fretboard |

## Demo

- [Chord Detector for Ukulele](https://ukealong.com/tool/chord-detector/)
- [Scales Explorer for Ukulele](https://ukealong.com/tool/scales/)

## License

[MIT](LICENSE) © [Ramiro Gómez](https://ramiro.org/)
