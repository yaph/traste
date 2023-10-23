import { select as D3Select } from 'd3-selection';

import { Instrument } from './instruments';


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


export class Fretboard {
    //private svg: any

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
        const note_radius = fret_distance * 0.23;

        // Calculate paddings and margins based on fret and string distances
        const string_padding = string_distance * 0.1;
        const fret_padding = fret_distance * 0.01;
        const margin_horizontal = fret_distance * 0.8;
        const margin_vertical = string_distance * 0.5;

        const height = string_distance * this.instrument.tuning.length + margin_vertical;
        const string_width = width - margin_horizontal * 1.2;
        const fret_height = string_distance * (this.instrument.tuning.length - 1);
        const fret_width = fret_distance * 0.06;
        const fret_marker_radius = note_radius * 0.3;

        // Setup SVG
        svg.attr('width', width).attr('height', height);
        const transform = `translate(${margin_horizontal}, ${margin_vertical})`;

        const g_frets = svg.append('g').attr('class', 'frets').attr('transform', transform);
        const g_fret_markers = svg.append('g').attr('class', 'fret-markers').attr('transform', transform);
        const g_strings = svg.append('g').attr('class', 'strings').attr('transform', transform);
        const g_notes = svg.append('g').attr('class', 'notes').attr('transform', transform);

        // draw frets
        const y1 = -string_padding / 2;
        const y2 = fret_height + string_padding;
        for (let i = 0; i <= this.instrument.fret_count; i++) {
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

        // draw fret markers
        const cy = height - margin_vertical - fret_marker_radius * 3;
        for (let i of this.instrument.fret_markers) {
            if (i > this.instrument.fret_count) {
                break;
            }
            let cx = i * fret_distance - fret_distance / 2;

            // draw a second marker for multiples of 12 (an octave)
            if (0 == i % 12) {
                const offset = fret_marker_radius * 1.3;
                drawCircle(g_fret_markers, cx + offset, cy, fret_marker_radius);
                // make sure the next circle is offset in the other direction
                cx -= offset;
            }
            drawCircle(g_fret_markers, cx, cy, fret_marker_radius);
        }

        // draw strings
        const x1 = -fret_padding / 2;
        const x2 = string_width + fret_padding;
        for (let i = 0; i < this.instrument.tuning.length; i++) {
            const root = this.instrument.tuning[i];
            const offset = i * string_distance;
            g_strings.append('svg:line')
                .attr('x1', x1)
                .attr('y1', offset)
                .attr('x2', x2)
                .attr('y2', offset)
                .style('stroke', '#444444')
                .style('stroke-width', this.instrument.string_gauges[i] * string_distance)
                .append('title').text(root);
        }
    }
}
