import { select as D3Select } from 'd3-selection';
import { noteColor } from 'cromatica';
import { midi as midiNote } from '@tonaljs/note';

import { validateInstrument } from './instruments';
import type { Instrument } from './instruments';
import { noteAtPosition, noteIndex, noteLabel } from './notes';


type Dimension = {
    fret_distance: number;
    string_distance: number;
    note_radius: number;
    fret_marker_radius: number;
};

type GroupName = 'frets' | 'fret_markers' | 'strings' | 'notes';
type NotePositionKey = `${number}:${number}`;

/**
 * The small subset of the D3 selection API used by this class. Keeping the
 * element type generic gives the implementation useful DOM typing without
 * coupling the public API to a particular d3-selection major version.
 */
interface SvgSelection<TElement extends Element> {
    append<K extends keyof SVGElementTagNameMap>(
        name: K | `svg:${K}`
    ): SvgSelection<SVGElementTagNameMap[K]>;
    attr(name: string, value: string | number | boolean | null): SvgSelection<TElement>;
    style(name: string, value: string | number | null): SvgSelection<TElement>;
    text(value: string | number): SvgSelection<TElement>;
    on(name: string, listener: (event: Event) => void): SvgSelection<TElement>;
    selectAll(selector: string): SvgSelection<Element>;
    remove(): SvgSelection<TElement>;
    empty(): boolean;
    node(): TElement | null;
}


export interface TrasteNoteEventDetail {
    note: string;
    midi: number;
    string: number;
    fret: number;
}


function asSelection<TElement extends Element>(element: TElement): SvgSelection<TElement> {
    return D3Select(element) as unknown as SvgSelection<TElement>;
}


function drawCircle(
    parent: SvgSelection<SVGGElement>,
    cx: number,
    cy: number,
    radius: number,
    fill = '#cccccc',
    stroke?: string,
    stroke_width?: number,
    title?: string
): SvgSelection<SVGCircleElement> {
    const circle = parent.append('svg:circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .style('fill', fill);

    if (stroke) circle.style('stroke', stroke);
    if (typeof stroke_width === 'number') circle.style('stroke-width', stroke_width);
    if (title) circle.append('svg:title').text(title);

    return circle;
}


/**
 * Draws an interactive SVG fretboard.
 *
 * `drawNotes()` replaces the currently displayed notes. Use `addNotes()` to
 * add to the current display. Notes are unique by physical position (string
 * and fret), so the same pitch may still appear at several positions.
 */
export class Fretboard {
    private readonly instrument: Instrument;
    private readonly container: Element;
    private svg?: SvgSelection<SVGSVGElement>;
    private dim: Dimension = {
        fret_distance: 0,
        string_distance: 0,
        note_radius: 0,
        fret_marker_radius: 0
    };
    private groups!: Record<GroupName, SvgSelection<SVGGElement>>;
    private noteGroups = new Map<NotePositionKey, SvgSelection<SVGGElement>>();
    private notesByPosition = new Map<NotePositionKey, string>();
    private resizeObserver?: ResizeObserver;
    private renderedWidth = 0;
    private destroyed = false;

    /**
     * @param instrument - validated tuning and fretboard geometry
     * @param selector - CSS selector for the container element
     * @param width - optional fixed width; when omitted, the board responds to container resizing
     */
    constructor(instrument: Instrument, selector: string, width?: number) {
        validateInstrument(instrument);

        // Copy arrays so later mutations to the caller's configuration cannot
        // silently change the geometry or note calculations of this board.
        this.instrument = {
            tuning: [...instrument.tuning],
            string_gauges: [...instrument.string_gauges],
            fret_count: instrument.fret_count,
            fret_markers: [...instrument.fret_markers]
        };

        const container = D3Select(selector) as unknown as SvgSelection<Element>;
        if (container.empty()) {
            throw Error(`Element not found: ${selector}`);
        }

        const node = container.node();
        if (!node) {
            throw Error(`Element not found: ${selector}`);
        }
        this.container = node as Element;

        this.render(width);
        if (typeof width === 'undefined') this.observeContainer();
    }


    private boardWidth(requestedWidth?: number): number {
        const width = typeof requestedWidth === 'undefined'
            ? this.container.getBoundingClientRect().width * 0.95
            : requestedWidth;

        if (!Number.isFinite(width) || width < 0) {
            throw new RangeError('Fretboard width must be a finite, non-negative number.');
        }

        const min_width = 26 * (this.instrument.fret_count + 1);
        return Math.max(min_width, width);
    }


    private render(requestedWidth?: number): void {
        const width = this.boardWidth(requestedWidth);

        // Replacing only this instance's SVG avoids removing unrelated content
        // that may share the container.
        this.svg?.remove();
        this.noteGroups.clear();

        const fret_distance = width / (this.instrument.fret_count + 1);
        const string_distance = fret_distance * 0.65;
        const margin_horizontal = fret_distance * 0.8;
        const margin_vertical = string_distance * 0.5;
        const height = string_distance * this.instrument.tuning.length + margin_vertical;

        this.svg = asSelection(this.container).append('svg')
            .attr('class', 'fretboard')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);

        this.dim = {
            fret_distance,
            string_distance,
            note_radius: fret_distance * 0.23,
            fret_marker_radius: fret_distance * 0.069
        };

        const transform = `translate(${margin_horizontal}, ${margin_vertical})`;
        this.groups = {
            frets: this.svg.append('g').attr('class', 'frets').attr('transform', transform),
            fret_markers: this.svg.append('g').attr('class', 'fret_markers').attr('transform', transform),
            strings: this.svg.append('g').attr('class', 'strings').attr('transform', transform),
            notes: this.svg.append('g').attr('class', 'notes').attr('transform', transform)
        };

        this.drawFrets();
        this.drawFretMarkers(height - margin_vertical);
        this.drawStrings(width - margin_horizontal * 1.2);

        this.renderedWidth = width;
        for (const [key, note] of this.notesByPosition) {
            const [stringIndex, fretIndex] = key.split(':').map(Number);
            this.renderNoteAtPosition(note, stringIndex, fretIndex);
        }
    }


    private observeContainer(): void {
        if (typeof ResizeObserver === 'undefined' || this.resizeObserver) return;

        this.resizeObserver = new ResizeObserver(() => {
            const nextWidth = this.boardWidth();
            if (Math.abs(nextWidth - this.renderedWidth) > 0.5) {
                this.render(nextWidth);
            }
        });
        this.resizeObserver.observe(this.container);
    }


    private assertActive(): void {
        if (this.destroyed) {
            throw new Error('This fretboard has been destroyed and can no longer be used.');
        }
    }


    private stopObservingContainer(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
    }


    private drawFrets(): void {
        const height = this.dim.string_distance * (this.instrument.tuning.length - 1);
        const width = this.dim.fret_distance * 0.06;
        const padding = height * 0.03;
        const y1 = -padding / 2;
        const y2 = height + padding;

        for (let i = 0; i <= this.instrument.fret_count; i++) {
            const offset = i * this.dim.fret_distance;
            let stroke_width = width;

            // Make the nut a little wider.
            if (i === 0) stroke_width *= 1.5;

            this.groups.frets.append('svg:line')
                .attr('x1', offset)
                .attr('y1', y1)
                .attr('x2', offset)
                .attr('y2', y2)
                .style('stroke', '#222222')
                .style('stroke-width', stroke_width)
                .append('svg:title')
                .text(i);
        }
    }


    private drawFretMarkers(pos_bottom: number): void {
        const cy = pos_bottom - this.dim.fret_marker_radius * 3;

        for (const fret of this.instrument.fret_markers) {
            // Marker arrays may include positions for longer versions of the
            // same instrument; skip out-of-range markers without assuming sort order.
            if (fret > this.instrument.fret_count) continue;

            let cx = fret * this.dim.fret_distance - this.dim.fret_distance / 2;

            // Draw a second marker for multiples of 12 (an octave).
            if (fret % 12 === 0) {
                const offset = this.dim.fret_marker_radius * 1.3;
                drawCircle(this.groups.fret_markers, cx + offset, cy, this.dim.fret_marker_radius);
                cx -= offset;
            }
            drawCircle(this.groups.fret_markers, cx, cy, this.dim.fret_marker_radius);
        }
    }


    private drawStrings(width: number): void {
        const padding = this.dim.fret_distance * 0.01;
        const x1 = -padding / 2;
        const x2 = width + padding;

        for (let i = 0; i < this.instrument.tuning.length; i++) {
            const offset = i * this.dim.string_distance;
            this.groups.strings.append('svg:line')
                .attr('x1', x1)
                .attr('y1', offset)
                .attr('x2', x2)
                .attr('y2', offset)
                .style('stroke', '#444444')
                .style('stroke-width', this.instrument.string_gauges[i] * this.dim.string_distance)
                .append('svg:title')
                .text(this.instrument.tuning[i]);
        }
    }


    private positionKey(string_idx: number, fret_idx: number): NotePositionKey {
        return `${string_idx}:${fret_idx}`;
    }


    private assertPosition(string_idx: number, fret_idx: number): void {
        if (!Number.isInteger(string_idx)
            || string_idx < 0
            || string_idx >= this.instrument.tuning.length) {
            throw new RangeError(`String index must be an integer between 0 and ${this.instrument.tuning.length - 1}.`);
        }

        if (!Number.isInteger(fret_idx) || fret_idx < 0 || fret_idx > this.instrument.fret_count) {
            throw new RangeError(`Fret index must be an integer between 0 and ${this.instrument.fret_count}.`);
        }
    }


    private renderNoteAtPosition(note: string, string_idx: number, fret_idx: number): void {
        const key = this.positionKey(string_idx, fret_idx);
        this.noteGroups.get(key)?.remove();

        const cy = string_idx * this.dim.string_distance;
        const label = noteLabel(note);
        const reduce = 5 * (1 - 1 / label.length);
        const font_size = Math.max(6, (this.dim.note_radius * 1.05) - reduce);
        const cx = fret_idx * this.dim.fret_distance - this.dim.fret_distance * 0.5;
        const openMidi = midiNote(this.instrument.tuning[string_idx]);

        // The instrument is validated at construction, but keep this guard at
        // the calculation boundary so MIDI event data can never silently fall back to zero.
        if (openMidi === null || !Number.isInteger(openMidi)) {
            throw new Error(`Cannot calculate MIDI value for tuning note: ${this.instrument.tuning[string_idx]}`);
        }
        const midi_value = openMidi + fret_idx;
        if (midi_value < 0 || midi_value > 127) {
            throw new RangeError(`MIDI value ${midi_value} is outside the supported range 0–127.`);
        }

        const group = this.groups.notes.append('g')
            .attr('class', 'note')
            .attr('data-string', string_idx)
            .attr('data-fret', fret_idx)
            .attr('role', 'button')
            .attr('tabindex', 0)
            .attr(
                'aria-label',
                `${note}, string ${string_idx + 1}, ${fret_idx === 0 ? 'open string' : `fret ${fret_idx}`}`
            );

        drawCircle(
            group,
            cx,
            cy,
            this.dim.note_radius,
            noteColor(note),
            '#999999',
            this.dim.note_radius * 0.1,
            note
        );

        group.append('svg:text')
            .attr('x', cx)
            .attr('y', cy)
            .attr('dy', '0.38em')
            .attr('fill', '#000000')
            .style('text-anchor', 'middle')
            .style('font-size', `${font_size}px`)
            .style('font-family', 'Roboto,Ubuntu,Helvetica,Arial,sans-serif')
            .text(label);

        const emit = (target: EventTarget | null): void => {
            if (!(target instanceof Element)) return;
            target.dispatchEvent(new CustomEvent<TrasteNoteEventDetail>('traste:note', {
                detail: { note, midi: midi_value, string: string_idx, fret: fret_idx },
                bubbles: true
            }));
        };

        group.on('click', (event: Event) => emit(event.target));
        group.on('keydown', (event: Event) => {
            const keyboardEvent = event as KeyboardEvent;
            if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
            keyboardEvent.preventDefault();
            emit(event.currentTarget);
        });

        this.noteGroups.set(key, group);
    }


    /**
     * Draw a note at a physical fretboard position.
     *
     * If that string/fret position already contains a note, it is updated in
     * place. The same pitch at another position remains a separate note.
     */
    drawNoteAtPosition(note: string, string_idx: number, fret_idx: number): void {
        this.assertActive();
        this.assertPosition(string_idx, fret_idx);
        noteIndex(note); // Validate the note spelling before passing it to the color helper.

        const key = this.positionKey(string_idx, fret_idx);
        this.notesByPosition.set(key, note);
        this.renderNoteAtPosition(note, string_idx, fret_idx);
    }


    /**
     * Add matching notes to the current display without clearing existing notes.
     *
     * Positions are unique: adding a note at an occupied string/fret pair
     * updates that position rather than appending another SVG note. When
     * `notes` is omitted, all notes across the configured fretboard are added.
     */
    addNotes(notes?: string[]): void {
        this.assertActive();
        if (notes) notes.forEach(noteIndex);

        for (let string_idx = 0; string_idx < this.instrument.tuning.length; string_idx++) {
            const root_idx = noteIndex(this.instrument.tuning[string_idx]);

            for (let fret_idx = 0; fret_idx <= this.instrument.fret_count; fret_idx++) {
                const note = noteAtPosition(root_idx, fret_idx, notes);
                if (note === null) continue;
                this.drawNoteAtPosition(note, string_idx, fret_idx);
            }
        }
    }


    /**
     * Replace the displayed note set. Calling this method repeatedly does not
     * accumulate duplicate SVG elements. Use `addNotes()` for additive drawing.
     * If no note list is supplied, every note position is displayed.
     */
    drawNotes(notes?: string[]): void {
        this.assertActive();
        if (notes) notes.forEach(noteIndex);
        this.clearNotes();
        this.addNotes(notes);
    }


    /** Remove all drawn notes from the fretboard. */
    clearNotes(): void {
        this.assertActive();
        this.groups.notes.selectAll('*').remove();
        this.noteGroups.clear();
        this.notesByPosition.clear();
    }


    /**
     * Recalculate and redraw the board while preserving displayed notes.
     *
     * When a width is supplied, automatic container observation is disabled
     * until `resize()` is called again without a width. Without an argument,
     * the current container width is measured and automatic observation resumes.
     */
    resize(width?: number): void {
        if (typeof width !== 'undefined') {
            this.stopObservingContainer();
            this.render(width);
            return;
        }

        this.render();
        this.observeContainer();
    }


    /** Disconnect automatic resizing and remove this instance's SVG. */
    destroy(): void {
        if (this.destroyed) return;
        this.stopObservingContainer();
        this.svg?.remove();
        this.svg = undefined;
        this.noteGroups.clear();
        this.notesByPosition.clear();
        this.destroyed = true;
    }
}
