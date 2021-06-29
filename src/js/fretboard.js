import {select as D3Select} from 'd3-selection';
import {noteAtPosition, noteIndex, noteLabel} from './notes';


function drawCircle(parent, cx, cy, radius, fill='#cccccc', stroke=null, stroke_width=null, title=null) {
    const circle = parent.append('svg:circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .style('fill', fill);

    if (stroke) circle.style('stroke', stroke);
    if (stroke_width) circle.style('stroke-width', stroke_width);
    if (title) circle.attr('title', title);
}


export function drawFretboard(selector, instrument, notes) {
    const tuning = instrument.tuning;
    const string_gauges = instrument.string_gauges;
    const fret_count = instrument.fret_count;

    const svg = D3Select(selector);
    svg.selectAll('*').remove();

    const bbox = svg.node().parentElement.getBoundingClientRect();
    let width = bbox.width * 0.95;

    // Readjust width so the fretboard works for different screen sizes and fret counts
    const min_fret_distance = 26;
    const max_fret_distance = 140;
    const min_width = min_fret_distance * (fret_count + 1);
    const max_width = max_fret_distance * (fret_count + 1);
    width = Math.min(max_width, Math.max(min_width, width));

    // Calculate fret and string distances based on container width
    const fret_distance = width / (fret_count + 1);
    const string_distance = fret_distance * 0.65;

    // Calculate paddings and margins based on fret and string distances
    const string_padding = string_distance * 0.1;
    const fret_padding = fret_distance * 0.01;
    const margin_horizontal = fret_distance * 0.8;
    const margin_vertical = string_distance * 0.5;

    const height = string_distance * tuning.length + margin_vertical;
    const string_width = width - margin_horizontal * 1.2;
    const fret_height = string_distance * (tuning.length - 1);
    const fret_width = fret_distance * 0.06;

    const note_radius = fret_distance * 0.23;
    const note_stroke_width = note_radius * 0.1;
    const note_font_size = note_radius * 1.05;

    const fret_marker_radius = note_radius * 0.3;

    // Setup SVG
    svg.attr('width', width).attr('height', height);
    const transform = `translate(${margin_horizontal}, ${margin_vertical})`;

    const g_frets = svg.append('g').attr('class', 'frets').attr('transform', transform);
    const g_fret_markers = svg.append('g').attr('class', 'fret-markers').attr('transform', transform);
    const g_strings = svg.append('g').attr('class', 'strings').attr('transform', transform);
    const g_notes = svg.append('g').attr('class', 'notes').attr('transform', transform);

    // draw frets
    for (let i = 0; i <= fret_count; i++) {
        let offset = i * fret_distance;

        // make nut a little wider
        let stroke_width = fret_width;
        if (0 == i) stroke_width *= 1.5;

        g_frets.append('svg:line')
            .attr('x1', offset)
            .attr('y1', -string_padding / 2)
            .attr('x2', offset)
            .attr('y2', fret_height + string_padding)
            .style('stroke', '#222222')
            .style('stroke-width', stroke_width)
            .append('title').text(i);
    }

    // draw fret markers
    for (let i of instrument.fret_markers) {
        if (i > fret_count) {
            break;
        }

        let cx = i * fret_distance - fret_distance / 2;
        let cy = height - margin_vertical - fret_marker_radius * 3;

        if (0 == i % 12) {
            const offset = fret_marker_radius * 1.3;
            drawCircle(g_fret_markers, cx + offset, cy, fret_marker_radius);
            // make sure the next circle is offset in the other direction
            cx -= offset;
        }

        drawCircle(g_fret_markers, cx, cy, fret_marker_radius);
    }

    // draw strings
    for (let i = 0; i < tuning.length; i++) {
        const root = tuning[i];
        const offset = i * string_distance;
        g_strings.append('svg:line')
            .attr('x1', -fret_padding / 2)
            .attr('y1', offset)
            .attr('x2', string_width + fret_padding)
            .attr('y2', offset)
            .style('stroke', '#444444')
            .style('stroke-width', string_gauges[i] * string_distance)
            .append('title').text(root);
    }

    // draw notes
    for (let string_idx = 0; string_idx < tuning.length; string_idx++) {
        const root_idx = noteIndex(tuning[string_idx]);
        for (let fret_idx = 0; fret_idx <= fret_count; fret_idx++) {
            const note = noteAtPosition(root_idx, fret_idx, notes);
            if (!note) continue;

            const label = noteLabel(note);
            // Adjust font size based on label length to better fit sharps and flats.
            const reduce = 5 * (1 - 1 / label.length);
            const font_size = note_font_size - reduce;

            const cx = fret_idx * fret_distance - fret_distance * 0.5;
            const cy = string_idx * string_distance;

            drawCircle(g_notes, cx, cy, note_radius, '#ffffff', '#999999', note_stroke_width, note);

            g_notes.append('svg:text')
                .attr('x', cx)
                .attr('y', cy)
                .attr('dy', '0.33em')
                .attr('fill', '#000000')
                .style('text-anchor', `middle`)
                .style('font-size', `${font_size}px`)
                .text(label);
        }
    }
}