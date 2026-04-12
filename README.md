# traste

> A library for rendering guitar and ukulele fretboard diagrams as SVG elements.

![Ukulele Fretboard](img/ukulele-fretboard.png 'UkeAlong.com Ukulele Fretboard')

## Install

```sh
npm install traste
```

## Usage

Create a `Fretboard` instance with an instrument, call `draw()` to render it into a container element, then call one of the note-drawing methods.

```js
// Draw all notes on a ukulele fretboard
const uke = new traste.Fretboard(traste.ukulele);
uke.draw('#fretboard');
uke.drawNotes();

// Draw only the notes of an Eb major chord
uke.draw('#fretboard-eb');
uke.drawNotes(['Eb', 'G', 'Bb']);

// Draw individual notes at specific string and fret positions
uke.draw('#fretboard-positions');
uke.drawNoteAtPosition('Eb', 2, 3);
uke.drawNoteAtPosition('G', 1, 3);
```

The `draw(selector, width?)` method appends an SVG element to the container matched by `selector`. Width defaults to 95% of the container's width.

### Instruments

Two instruments are included: `traste.guitar` and `traste.ukulele`. Both are plain objects implementing the `Instrument` interface, so you can define custom instruments:

```ts
import { Instrument } from 'traste';

const bass: Instrument = {
    tuning: ['G2', 'D2', 'A1', 'E1'],
    string_gauges: [0.045, 0.065, 0.085, 0.105],
    fret_count: 20,
    fret_markers: [3, 5, 7, 9, 12, 15, 17, 19]
};
```

### API

| Method | Description |
|---|---|
| `draw(selector, width?)` | Render the fretboard SVG into the matched element |
| `drawNotes(notes?)` | Draw all notes, or only those in the given array |
| `drawNoteAtPosition(note, string, fret)` | Draw a single note at a specific string and fret index |

## Demo

- [Chord Detector for Ukulele](https://ukealong.com/tool/chord-detector/)
- [Scales Explorer for Ukulele](https://ukealong.com/tool/scales/)

## License

[MIT](LICENSE) © [Ramiro Gómez](https://ramiro.org/)
