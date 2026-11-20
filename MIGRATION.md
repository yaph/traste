# traste 2.x migration notes

This source update preserves the existing `Fretboard` constructor, `drawNoteAtPosition()`,
`drawNotes()`, and `clearNotes()` method signatures. It intentionally changes the
meaning of `drawNotes()` to make repeated drawing predictable.

## Note drawing semantics

`drawNotes(notes?)` now **replaces** the visible note set. `addNotes(notes?)` is the
new additive method:

```ts
fretboard.drawNotes(['C', 'E', 'G']); // Replace the displayed notes.
fretboard.addNotes(['D', 'F', 'A']); // Add to the displayed notes.
fretboard.clearNotes();              // Remove all displayed notes.
```

A note is unique by its physical position (`string`, `fret`), not by pitch. Thus,
the same pitch can appear at multiple string/fret positions. Calling
`drawNoteAtPosition()` again for an occupied position updates that position
instead of appending another SVG note.

## Other behavior changes

- Flat note names with octave suffixes (for example, `Bb2`) are normalized by
  pitch class for fret calculations.
- Instrument tunings must include valid octave-qualified notes so MIDI event
  values can be calculated correctly. `string_gauges` must have one positive
  finite value per string. Invalid fret counts and fret markers are rejected.
- A fret marker beyond the configured fret count is ignored, regardless of its
  position in the marker array.
- When the constructor's `width` argument is omitted, the fretboard observes
  its container and redraws when the container width changes (where
  `ResizeObserver` is available). Pass a width to keep a fixed initial width.
- `resize(width?)` redraws the board while preserving displayed notes.
  Supplying a width disables automatic observation until `resize()` is called
  without an argument. `destroy()` disconnects observation and removes the SVG.
- Note controls can be activated with Enter or Space and expose an accessible
  label, button role, and keyboard focus.

## Additional exports

`Instrument`, `validateInstrument`, `TrasteNoteEventDetail`, and the note helper
functions are exported from the package entry point. Existing exports remain.

The uploaded source archive did not include a package manifest, so its package
version cannot be updated here. These changes are intended for a breaking 2.x
release because of the `drawNotes()` behavior change.
