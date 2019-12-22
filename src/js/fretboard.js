import {select as D3Select} from 'd3-selection';
import {noteIndex, noteLabel, chromatic_scale, enharmonic_notes} from './notes';


function drawCircle(parent, cx, cy, radius, fill='#cccccc', stroke=null, stroke_width=null, title=null) {
    let circle = parent.append('svg:circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', radius)
        .style('fill', fill);

    if (stroke) circle.style('stroke', stroke);
    if (stroke_width) circle.style('stroke-width', stroke_width);
    if (title) circle.attr('title', title);
}


export function drawFretboard(selector, instrument, notes) {
    let tuning = instrument.tuning;
    let string_gauges = instrument.string_gauges;
    let fret_count = instrument.fret_count;

    let svg = D3Select(selector);
    svg.selectAll('*').remove();

    let bbox = svg.node().parentElement.getBoundingClientRect();
    let width = bbox.width * 0.95;

    // Readjust width so the fretboard works for different screen sizes and fret counts
    let min_fret_distance = 40;
    let max_fret_distance = 140;
    let min_width = min_fret_distance * (fret_count + 1);
    let max_width = max_fret_distance * (fret_count + 1);
    width = Math.min(max_width, Math.max(min_width, width));

    // Calculate fret and string distances based on container width
    let fret_distance = width / (fret_count + 1);
    let string_distance = fret_distance * 0.65;

    // Calculate paddings and margins based on fret and string distances
    let string_padding = string_distance * 0.1;
    let fret_padding = fret_distance * 0.01;
    let margin_horizontal = fret_distance * 0.8;
    let margin_vertical = string_distance * 0.5;

    let height = string_distance * tuning.length + margin_vertical;
    let string_width = width - margin_horizontal * 1.2;
    let fret_markers = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    let fret_height = string_distance * (tuning.length - 1);
    let fret_width = fret_distance * 0.06;

    let note_radius = fret_distance * 0.22;
    let note_stroke_width = note_radius * 0.2;
    let note_font_size = note_radius * 1.05;

    let fret_marker_radius = note_radius * 0.3;

    // Setup SVG
    svg.attr('width', width).attr('height', height);
    let transform = `translate(${margin_horizontal}, ${margin_vertical})`;

    // Background rectangle
    //svg.append('defs').append('pattern').attr('id', 'bg-rect').append('image').attr('xlink:href', '/img/veneer.png');
    //svg.append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height).style('fill', "#eee");

    let g_frets = svg.append('g').attr('class', 'frets').attr('transform', transform);
    let g_fret_markers = svg.append('g').attr('class', 'fret-markers').attr('transform', transform);
    let g_strings = svg.append('g').attr('class', 'strings').attr('transform', transform);
    let g_notes = svg.append('g').attr('class', 'notes').attr('transform', transform);

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
    for (let i of fret_markers) {
        if (i > fret_count) {
            break;
        }

        let cx = i * fret_distance - fret_distance / 2;
        let cy = height - margin_vertical - fret_marker_radius * 3;

        if (0 == i % 12) {
            let offset = fret_marker_radius * 1.3;
            drawCircle(g_fret_markers, cx + offset, cy, fret_marker_radius);
            // make sure the next circle is offset in the other direction
            cx -= offset;
        }

        drawCircle(g_fret_markers, cx, cy, fret_marker_radius);
    }

    // draw strings
    for (let i = 0; i < tuning.length; i++) {
        let root = tuning[i];
        let offset = i * string_distance;
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
    for (let i = 0; i < tuning.length; i++) {
        let root_idx = noteIndex(tuning[i]);
        for (let j = 0; j <= fret_count; j++) {
            let note_index = (root_idx + j) % chromatic_scale.length;
            let note = chromatic_scale[note_index];
            if (!notes.includes(note)) {
                let enharmonic_note = enharmonic_notes[note]
                if (notes.includes(enharmonic_note)) {
                    note = enharmonic_note;
                } else {
                    continue;
                }
            }

            let cx = j * fret_distance - fret_distance * 0.5;
            let cy = i * string_distance;
            let x = cx - note_font_size * 0.34;
            let y = cy + note_font_size * 0.34;

            // shift to left more for sharps and flats
            if (note.length > 1) {
                x = cx - note_font_size * 0.5;
            }

            drawCircle(g_notes, cx, cy, note_radius, '#ffffff', '#aaaaaa', note_stroke_width, note);

            g_notes.append('svg:text')
                .attr('x', x)
                .attr('y', y)
                .attr('fill', '#000000')
                .style('font-size', `${note_font_size}px`)
                .text(noteLabel(note));
        }
    }
}