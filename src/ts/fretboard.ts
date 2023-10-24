import { select as D3Select } from 'd3-selection';
import { noteColor } from 'cromatica';

import { Instrument } from './instruments';
import { noteAtPosition, noteIndex, noteLabel } from './notes';


type Dimension = {
    [key: string]: number;
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
    private transform: string = 'translate(0, 0)'
    private dim: Dimension = {}

    constructor(private instrument: Instrument) {}

    // Shorthand for adding group to SVG
    g(name: string): any {
        return this.svg.append('g').attr('class', name).attr('transform', this.transform);
    }


    boardWidth(width?: number): number {
        if (typeof width === 'undefined') {
            const node = this.svg.node() as HTMLElement;
            if (node && node.parentElement) {
                width = node.parentElement.getBoundingClientRect().width * 0.95;
            } else {
                throw Error('Element not found');
            }
        }
        // Adjust width so the fretboard works for different screen sizes and fret counts
        const min_width = 26 * (this.instrument.fret_count + 1);
        return Math.max(min_width, width);
    }


    draw(selector: string, width?: number): void {
        const svg = D3Select(selector);
        svg.selectAll('*').remove();

        width = this.boardWidth(width);

        // Calculate fret and string distances based on container width
        const fret_distance = width / (this.instrument.fret_count + 1);
        const string_distance = fret_distance * 0.65;

        // Calculate paddings and margins based on fret and string distances
        const margin_horizontal = fret_distance * 0.8;
        const margin_vertical = string_distance * 0.5;
        const height = string_distance * this.instrument.tuning.length + margin_vertical;

        svg.attr('width', width).attr('height', height);

        // Set object properties, that are accessed in other methods
        this.svg = svg;
        this.transform = `translate(${margin_horizontal}, ${margin_vertical})`;
        this.dim = {
            fret_distance: fret_distance,
            string_distance: string_distance
        }

        this.drawFrets(string_distance * (this.instrument.tuning.length - 1));
        this.drawFretMarkers(height - margin_vertical);
        this.drawStrings(width - margin_horizontal * 1.2);
    }


    drawFrets(height: number) {
        const g_frets = this.g('frets');

        const width = this.dim.fret_distance * 0.06;
        const padding = height * 0.03;
        const y1 = -padding / 2;
        const y2 = height + padding;

        for (let i = 0; i <= this.instrument.fret_count; i++) {
            const offset = i * this.dim.fret_distance;

            // Make nut a little wider
            let stroke_width = width;
            if (0 == i) stroke_width *= 1.5;

            g_frets.append('svg:line')
                .attr('x1', offset)
                .attr('y1', y1)
                .attr('x2', offset)
                .attr('y2', y2)
                .style('stroke', '#222222')
                .style('stroke-width', stroke_width)
                .append('title').text(i);
        }
    }


    drawFretMarkers(pos_bottom: number) {
        const g_fret_markers = this.g('fret-markers');

        const radius = this.dim.fret_distance * 0.069;
        const cy = pos_bottom - radius * 3;

        for (let i of this.instrument.fret_markers) {
            if (i > this.instrument.fret_count) {
                break;
            }
            let cx = i * this.dim.fret_distance - this.dim.fret_distance / 2;

            // draw a second marker for multiples of 12 (an octave)
            if (0 == i % 12) {
                const offset = radius * 1.3;
                drawCircle(g_fret_markers, cx + offset, cy, radius);
                // make sure the next circle is offset in the other direction
                cx -= offset;
            }
            drawCircle(g_fret_markers, cx, cy, radius);
        }
    }


    drawStrings(width: number) {
        const g_strings = this.g('strings');

        const padding = this.dim.fret_distance * 0.01;
        const x1 = -padding / 2;
        const x2 = width + padding;

        for (let i = 0; i < this.instrument.tuning.length; i++) {
            const offset = i * this.dim.string_distance;
            g_strings.append('svg:line')
                .attr('x1', x1)
                .attr('y1', offset)
                .attr('x2', x2)
                .attr('y2', offset)
                .style('stroke', '#444444')
                .style('stroke-width', this.instrument.string_gauges[i] * this.dim.string_distance)
                .append('title').text(this.instrument.tuning[i]);
        }
    }


    drawNotes(notes?: Array<string>) {
        const g_notes = this.g('notes');
        const radius = this.dim.fret_distance * 0.23;

        for (let string_idx = 0; string_idx < this.instrument.tuning.length; string_idx++) {
            const root_idx = noteIndex(this.instrument.tuning[string_idx]);
            const cy = string_idx * this.dim.string_distance;

            for (let fret_idx = 0; fret_idx <= this.instrument.fret_count; fret_idx++) {
                const note = noteAtPosition(root_idx, fret_idx, notes);
                if (!note) continue;

                const label = noteLabel(note);

                // Adjust font size based on label length to better fit sharps and flats
                const reduce = 5 * (1 - 1 / label.length);
                const font_size = (radius * 1.05) - reduce;
                const cx = fret_idx * this.dim.fret_distance - this.dim.fret_distance * 0.5;

                drawCircle(g_notes, cx, cy, radius, noteColor(note), '#999999', radius * 0.1, note);

                g_notes.append('svg:text')
                    .attr('x', cx)
                    .attr('y', cy)
                    .attr('dy', '0.38em')
                    .attr('fill', '#000000')
                    .style('text-anchor', `middle`)
                    .style('font-size', `${font_size}px`)
                    .style('font-family', 'Roboto,Ubuntu,Helvetica,Arial,sans-serif')
                    .text(label);
            }
        }
    }
}
