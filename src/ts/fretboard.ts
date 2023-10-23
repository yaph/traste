import { select as D3Select } from 'd3-selection';

import { Instrument } from './instruments';
import { noteAtPosition, noteColor, noteIndex, noteLabel } from './notes';


interface UI {
    fret_distance: number;
    string_distance: number;
}


function boardWidth(svg: any, fret_count: number, width?: number): number {
    if (typeof width === 'undefined') {
        const node = svg.node() as HTMLElement;
        if (node && node.parentElement) {
            width = node.parentElement.getBoundingClientRect().width * 0.95;
        } else {
            width = -1;
        }
    }
    // Readjust width so the fretboard works for different screen sizes and fret counts
    const min_width = 26 * (fret_count + 1);
    return Math.max(min_width, width);
}


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


function drawFrets(g_frets: any, instrument: Instrument, fret_distance: number,
    fret_height: number, fret_width: number, string_distance: number) {

    const padding = string_distance * 0.1;
    const y1 = -padding / 2;
    const y2 = fret_height + padding;

    for (let i = 0; i <= instrument.fret_count; i++) {
        const offset = i * fret_distance;

        // make nut a little wider
        let stroke_width = fret_width;
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


function drawFretMarkers(g_fret_markers: any, instrument: Instrument, fret_distance: number, pos_bottom: number) {
    const radius = fret_distance * 0.069;
    const cy = pos_bottom - radius * 3;

    for (let i of instrument.fret_markers) {
        if (i > instrument.fret_count) {
            break;
        }
        let cx = i * fret_distance - fret_distance / 2;

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


function drawStrings(g_strings: any, instrument: Instrument, string_distance: number, string_width: number, fret_padding: number) {

    const x1 = -fret_padding / 2;
    const x2 = string_width + fret_padding;

    for (let i = 0; i < instrument.tuning.length; i++) {
        const offset = i * string_distance;
        g_strings.append('svg:line')
            .attr('x1', x1)
            .attr('y1', offset)
            .attr('x2', x2)
            .attr('y2', offset)
            .style('stroke', '#444444')
            .style('stroke-width', instrument.string_gauges[i] * string_distance)
            .append('title').text(instrument.tuning[i]);
    }
}


export class Fretboard {
    private svg: any
    private transform: string = 'translate(0, 0)'
    private ui: UI = {fret_distance: 20, string_distance: 20}

    constructor(private instrument: Instrument) {}

    draw(selector: string, width?: number): void {
        const svg = D3Select(selector);
        svg.selectAll('*').remove();

        width = boardWidth(svg, this.instrument.fret_count, width);
        if (width == -1) {
            console.log(`No element found using selector: ${selector}`);
            return;
        }

        // Calculate fret and string distances based on container width
        const fret_distance = width / (this.instrument.fret_count + 1);
        const string_distance = fret_distance * 0.65;

        // Calculate paddings and margins based on fret and string distances
        const fret_padding = fret_distance * 0.01;
        const margin_horizontal = fret_distance * 0.8;
        const margin_vertical = string_distance * 0.5;

        const height = string_distance * this.instrument.tuning.length + margin_vertical;
        const string_width = width - margin_horizontal * 1.2;
        const fret_height = string_distance * (this.instrument.tuning.length - 1);
        const fret_width = fret_distance * 0.06;

        // Setup SVG and draw fretboard components
        svg.attr('width', width).attr('height', height);
        const transform = `translate(${margin_horizontal}, ${margin_vertical})`;

        const g_frets = svg.append('g').attr('class', 'frets').attr('transform', transform);
        drawFrets(g_frets, this.instrument, fret_distance, fret_height, fret_width, string_distance);

        const g_fret_markers = svg.append('g').attr('class', 'fret-markers').attr('transform', transform);
        drawFretMarkers(g_fret_markers, this.instrument, fret_distance, height - margin_vertical);

        const g_strings = svg.append('g').attr('class', 'strings').attr('transform', transform);
        drawStrings(g_strings, this.instrument, string_distance, string_width, fret_padding);

        // Set object properties, that are accessed in other methods
        this.svg = svg;
        this.transform = transform;
        this.ui = {
            fret_distance: fret_distance,
            string_distance: string_distance
        }
    }

    drawNotes(notes?: Array<string>) {
        const g_notes = this.svg.append('g').attr('class', 'notes').attr('transform', this.transform);
        const radius = this.ui.fret_distance * 0.23;

        for (let string_idx = 0; string_idx < this.instrument.tuning.length; string_idx++) {
            const root_idx = noteIndex(this.instrument.tuning[string_idx]);
            const cy = string_idx * this.ui.string_distance;

            for (let fret_idx = 0; fret_idx <= this.instrument.fret_count; fret_idx++) {
                const note = noteAtPosition(root_idx, fret_idx, notes);
                if (!note) continue;

                const label = noteLabel(note);

                // Adjust font size based on label length to better fit sharps and flats.
                const reduce = 5 * (1 - 1 / label.length);
                const font_size = (radius * 1.05) - reduce;
                const cx = fret_idx * this.ui.fret_distance - this.ui.fret_distance * 0.5;

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
