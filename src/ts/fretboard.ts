import { select as D3Select } from 'd3-selection';
import { noteColor } from 'cromatica';

import { Instrument } from './instruments';
import { noteAtPosition, noteIndex, noteLabel } from './notes';


type Dimension = {
    [key: string]: number;
};

type Group = {
    [key: string]: any;
};


function drawCircle(parent: any, cx: number, cy: number, radius: number,
    fill: string='#cccccc', stroke?: string, stroke_width?: number, title?: string) {

    const circle = parent.append('svg:circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .style('fill', fill);

    if (stroke) circle.style('stroke', stroke);
    if (stroke_width) circle.style('stroke-width', stroke_width);
    if (title) circle.attr('title', title);
}


export class Fretboard {
    private svg: any
    private dim: Dimension = {}
    private g: Group = {}

    constructor(private instrument: Instrument) {}


    private boardWidth(container: any, width?: number): number {
        if (container.empty()) {
            throw Error('Element not found');
        }
        if (typeof width === 'undefined') {
            const node = container.node() as HTMLElement;
            width = node.getBoundingClientRect().width * 0.95;
        }
        const min_width = 26 * (this.instrument.fret_count + 1);
        return Math.max(min_width, width);
    }


    draw(selector: string, width?: number): void {
        const parent = D3Select(selector);
        width = this.boardWidth(parent);

        // Calculate fret and string distances based on container width
        const fret_distance = width / (this.instrument.fret_count + 1);
        const string_distance = fret_distance * 0.65;

        // Calculate paddings and margins based on fret and string distances
        const margin_horizontal = fret_distance * 0.8;
        const margin_vertical = string_distance * 0.5;
        const height = string_distance * this.instrument.tuning.length + margin_vertical;

        // Setup SVG element
        this.svg = parent.append('svg').attr('class', 'fretboard');
        this.svg.attr('width', width).attr('height', height);

        // Set object properties, that are accessed in other methods
        this.dim = {
            fret_distance: fret_distance,
            string_distance: string_distance,
            note_radius: fret_distance * 0.23,
            fret_marker_radius: fret_distance * 0.069
        }

        // Initialize groups as object properties.
        const transform = `translate(${margin_horizontal}, ${margin_vertical})`;
        for (let name of ['frets', 'fret_markers', 'strings', 'notes']) {
            this.g[name] = this.svg.append('g').attr('class', name).attr('transform', transform);
        }

        this.drawFrets();
        this.drawFretMarkers(height - margin_vertical);
        this.drawStrings(width - margin_horizontal * 1.2);
    }


    private drawFrets() {
        const height = this.dim.string_distance * (this.instrument.tuning.length - 1);
        const width = this.dim.fret_distance * 0.06;
        const padding = height * 0.03;
        const y1 = -padding / 2;
        const y2 = height + padding;

        for (let i = 0; i <= this.instrument.fret_count; i++) {
            const offset = i * this.dim.fret_distance;

            // Make nut a little wider
            let stroke_width = width;
            if (0 == i) stroke_width *= 1.5;

            this.g.frets.append('svg:line')
                .attr('x1', offset)
                .attr('y1', y1)
                .attr('x2', offset)
                .attr('y2', y2)
                .style('stroke', '#222222')
                .style('stroke-width', stroke_width)
                .append('title').text(i);
        }
    }


    private drawFretMarkers(pos_bottom: number) {
        const cy = pos_bottom - this.dim.fret_marker_radius * 3;

        for (let i of this.instrument.fret_markers) {
            if (i > this.instrument.fret_count) {
                break;
            }
            let cx = i * this.dim.fret_distance - this.dim.fret_distance / 2;

            // draw a second marker for multiples of 12 (an octave)
            if (0 == i % 12) {
                const offset = this.dim.fret_marker_radius * 1.3;
                drawCircle(this.g.fret_markers, cx + offset, cy, this.dim.fret_marker_radius);
                // make sure the next circle is offset in the other direction
                cx -= offset;
            }
            drawCircle(this.g.fret_markers, cx, cy, this.dim.fret_marker_radius);
        }
    }


    private drawStrings(width: number) {
        const padding = this.dim.fret_distance * 0.01;
        const x1 = -padding / 2;
        const x2 = width + padding;

        for (let i = 0; i < this.instrument.tuning.length; i++) {
            const offset = i * this.dim.string_distance;
            this.g.strings.append('svg:line')
                .attr('x1', x1)
                .attr('y1', offset)
                .attr('x2', x2)
                .attr('y2', offset)
                .style('stroke', '#444444')
                .style('stroke-width', this.instrument.string_gauges[i] * this.dim.string_distance)
                .append('title').text(this.instrument.tuning[i]);
        }
    }


    /**
     * Draw given note at given string and fret indexes.
     */
    drawNoteAtPosition(note: string, string_idx: number, fret_idx: number) {
        const cy = string_idx * this.dim.string_distance;
        const label = noteLabel(note);

        // Adjust font size based on label length to better fit sharps and flats
        const reduce = 5 * (1 - 1 / label.length);
        const font_size = (this.dim.note_radius * 1.05) - reduce;
        const cx = fret_idx * this.dim.fret_distance - this.dim.fret_distance * 0.5;

        drawCircle(this.g.notes, cx, cy, this.dim.note_radius, noteColor(note), '#999999', this.dim.note_radius * 0.1, note);

        this.g.notes.append('svg:text')
            .attr('x', cx)
            .attr('y', cy)
            .attr('dy', '0.38em')
            .attr('fill', '#000000')
            .style('text-anchor', `middle`)
            .style('font-size', `${font_size}px`)
            .style('font-family', 'Roboto,Ubuntu,Helvetica,Arial,sans-serif')
            .text(label);
    }


    /**
     * Draw notes as circles on the fretboard. If no notes are passed as input, all notes will be drawn.
     */
    drawNotes(notes?: Array<string>) {
        for (let string_idx = 0; string_idx < this.instrument.tuning.length; string_idx++) {
            const root_idx = noteIndex(this.instrument.tuning[string_idx]);

            for (let fret_idx = 0; fret_idx <= this.instrument.fret_count; fret_idx++) {
                const note = noteAtPosition(root_idx, fret_idx, notes);
                if (!note) continue;

                this.drawNoteAtPosition(note, string_idx, fret_idx);
            }
        }
    }
}
