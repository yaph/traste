import {select as D3Select} from 'd3-selection';
import {noteAtPosition, noteColor, noteIndex, noteLabel} from './notes';

// Object for user interface variables that need to be globally accessible
const UI = {};


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


function drawNotes(notes) {
    for (let string_idx = 0; string_idx < UI.tuning.length; string_idx++) {
        const root_idx = noteIndex(UI.tuning[string_idx]);
        for (let fret_idx = 0; fret_idx <= UI.fret_count; fret_idx++) {
            const note = noteAtPosition(root_idx, fret_idx, notes);
            if (!note) continue;

            const label = noteLabel(note);
            // Adjust font size based on label length to better fit sharps and flats.
            const reduce = 5 * (1 - 1 / label.length);
            const font_size = (UI.note_radius * 1.05) - reduce;

            const cx = fret_idx * UI.fret_distance - UI.fret_distance * 0.5;
            const cy = string_idx * UI.string_distance;

            drawCircle(UI.notes, cx, cy, UI.note_radius, noteColor(note), '#999999', UI.note_radius * 0.1, note);

            UI.notes.append('svg:text')
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


export function drawFretboard(selector, instrument, notes, width=null) {
    UI.tuning = instrument.tuning;
    UI.fret_count = instrument.fret_count;

    const svg = D3Select(selector);
    svg.selectAll('*').remove();

    if (width === null) {
        const bbox = svg.node().parentElement.getBoundingClientRect();
        width = bbox.width * 0.95;
    }

    // Readjust width so the fretboard works for different screen sizes and fret counts
    const min_width = 26 * (UI.fret_count + 1);
    width = Math.max(min_width, width);

    // Calculate fret and string distances based on container width
    UI.fret_distance = width / (UI.fret_count + 1);
    UI.string_distance = UI.fret_distance * 0.65;
    UI.note_radius = UI.fret_distance * 0.23;

    // Calculate paddings and margins based on fret and string distances
    const string_padding = UI.string_distance * 0.1;
    const fret_padding = UI.fret_distance * 0.01;
    const margin_horizontal = UI.fret_distance * 0.8;
    const margin_vertical = UI.string_distance * 0.5;

    const height = UI.string_distance * UI.tuning.length + margin_vertical;
    const string_width = width - margin_horizontal * 1.2;
    const fret_height = UI.string_distance * (UI.tuning.length - 1);
    const fret_width = UI.fret_distance * 0.06;
    const fret_marker_radius = UI.note_radius * 0.3;

    // Setup SVG
    svg.attr('width', width).attr('height', height);
    const transform = `translate(${margin_horizontal}, ${margin_vertical})`;

    const g_frets = svg.append('g').attr('class', 'frets').attr('transform', transform);
    const g_fret_markers = svg.append('g').attr('class', 'fret-markers').attr('transform', transform);
    const g_strings = svg.append('g').attr('class', 'strings').attr('transform', transform);

    UI.notes = svg.append('g').attr('class', 'notes').attr('transform', transform);

    // draw frets
    for (let i = 0; i <= UI.fret_count; i++) {
        let offset = i * UI.fret_distance;

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
        if (i > UI.fret_count) {
            break;
        }

        let cx = i * UI.fret_distance - UI.fret_distance / 2;
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
    for (let i = 0; i < UI.tuning.length; i++) {
        const root = UI.tuning[i];
        const offset = i * UI.string_distance;
        g_strings.append('svg:line')
            .attr('x1', -fret_padding / 2)
            .attr('y1', offset)
            .attr('x2', string_width + fret_padding)
            .attr('y2', offset)
            .style('stroke', '#444444')
            .style('stroke-width', instrument.string_gauges[i] * UI.string_distance)
            .append('title').text(root);
    }

    drawNotes(notes);
}



export function fretboard(selector, config) {

    const svg = D3Select(selector);
    svg.selectAll('*').remove();

    if (typeof(config.width) === 'undefined') {
        config.width = svg.node().parentElement.getBoundingClientRect() * 0.95;
    }

    // Set width so the fretboard works for different screen sizes and fret counts
    const width = Math.max(26 * (config.fret_count + 1), config.width);

    // Calculate fret and string distances based on container width
    config.fret_distance = width / (config.fret_count + 1);
    config.string_distance = config.fret_distance * 0.65;
    config.note_radius = config.fret_distance * 0.23;

    // Calculate paddings and margins based on fret and string distances
    const string_padding = config.string_distance * 0.1;
    const fret_padding = config.fret_distance * 0.01;
    const margin_horizontal = config.fret_distance * 0.8;
    const margin_vertical = config.string_distance * 0.5;

    const height = config.string_distance * config.tuning.length + margin_vertical;
    const string_width = width - margin_horizontal * 1.2;
    const fret_height = config.string_distance * (config.tuning.length - 1);
    const fret_width = config.fret_distance * 0.06;
    const fret_marker_radius = config.note_radius * 0.3;

    // Setup SVG
    svg.attr('width', width).attr('height', height);
    const transform = `translate(${margin_horizontal}, ${margin_vertical})`;

    const drawing = {
        frets: svg.append('g').attr('class', 'frets').attr('transform', transform),
        fret_markers: svg.append('g').attr('class', 'fret-markers').attr('transform', transform),
        strings: svg.append('g').attr('class', 'strings').attr('transform', transform),
        notes: svg.append('g').attr('class', 'notes').attr('transform', transform)
    }

    // draw frets
    for (let i = 0; i <= config.fret_count; i++) {
        let offset = i * config.fret_distance;

        // make nut a little wider
        let stroke_width = fret_width;
        if (0 == i) stroke_width *= 1.5;

        drawing.frets.append('svg:line')
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
        if (i > config.fret_count) {
            break;
        }

        let cx = i * config.fret_distance - config.fret_distance / 2;
        let cy = height - margin_vertical - fret_marker_radius * 3;

        if (0 == i % 12) {
            const offset = fret_marker_radius * 1.3;
            drawCircle(g_fret_markers, cx + offset, cy, fret_marker_radius);
            // make sure the next circle is offset in the other direction
            cx -= offset;
        }

        drawCircle(drawing.fret_markers, cx, cy, fret_marker_radius);
    }

    // draw strings
    for (let i = 0; i < config.tuning.length; i++) {
        const root = config.tuning[i];
        const offset = i * config.string_distance;
        drawing.strings.append('svg:line')
            .attr('x1', -fret_padding / 2)
            .attr('y1', offset)
            .attr('x2', string_width + fret_padding)
            .attr('y2', offset)
            .style('stroke', '#444444')
            .style('stroke-width', instrument.string_gauges[i] * config.string_distance)
            .append('title').text(root);
    }

    drawNotes(drawing, notes);
}