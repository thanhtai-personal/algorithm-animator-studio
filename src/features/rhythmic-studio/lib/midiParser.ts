import type { NoteEvent } from '../types';

interface RawMidiEvent {
  tick: number;
  midi: number;
  velocity: number;
  durationTicks: number;
}

interface TempoEvent { tick: number; microsecondsPerQuarter: number }

function readVarLen(view: DataView, start: number): { value: number; next: number } {
  let value = 0;
  let offset = start;
  for (let i = 0; i < 4; i += 1) {
    const byte = view.getUint8(offset++);
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) break;
  }
  return { value, next: offset };
}

function ascii(view: DataView, offset: number, length: number) {
  return String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(offset + i)));
}

function ticksToMs(tick: number, division: number, tempos: TempoEvent[]): number {
  let elapsedUs = 0;
  let previousTick = 0;
  let tempo = 500000;
  for (const event of tempos) {
    if (event.tick > tick) break;
    elapsedUs += ((event.tick - previousTick) / division) * tempo;
    previousTick = event.tick;
    tempo = event.microsecondsPerQuarter;
  }
  elapsedUs += ((tick - previousTick) / division) * tempo;
  return elapsedUs / 1000;
}

export function parseMidi(buffer: ArrayBuffer): NoteEvent[] {
  const view = new DataView(buffer);
  if (ascii(view, 0, 4) !== 'MThd') throw new Error('Not a Standard MIDI file');
  const headerLength = view.getUint32(4);
  const trackCount = view.getUint16(10);
  const division = view.getUint16(12);
  if (division & 0x8000) throw new Error('SMPTE time division is not supported');

  let offset = 8 + headerLength;
  const tempos: TempoEvent[] = [{ tick: 0, microsecondsPerQuarter: 500000 }];
  const rawNotes: RawMidiEvent[] = [];

  for (let track = 0; track < trackCount; track += 1) {
    if (ascii(view, offset, 4) !== 'MTrk') throw new Error('Invalid MIDI track');
    const length = view.getUint32(offset + 4);
    const end = offset + 8 + length;
    let cursor = offset + 8;
    let tick = 0;
    let runningStatus = 0;
    const active = new Map<string, { tick: number; velocity: number }>();

    while (cursor < end) {
      const delta = readVarLen(view, cursor);
      tick += delta.value;
      cursor = delta.next;
      let status = view.getUint8(cursor);
      if (status < 0x80) {
        if (!runningStatus) throw new Error('Invalid running status');
        status = runningStatus;
      } else {
        cursor += 1;
        if (status < 0xf0) runningStatus = status;
      }

      if (status === 0xff) {
        const type = view.getUint8(cursor++);
        const size = readVarLen(view, cursor);
        cursor = size.next;
        if (type === 0x51 && size.value === 3) {
          tempos.push({
            tick,
            microsecondsPerQuarter: (view.getUint8(cursor) << 16) | (view.getUint8(cursor + 1) << 8) | view.getUint8(cursor + 2),
          });
        }
        cursor += size.value;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const size = readVarLen(view, cursor);
        cursor = size.next + size.value;
        continue;
      }

      const kind = status & 0xf0;
      const channel = status & 0x0f;
      const data1 = view.getUint8(cursor++);
      const data2Needed = ![0xc0, 0xd0].includes(kind);
      const data2 = data2Needed ? view.getUint8(cursor++) : 0;
      const key = `${channel}:${data1}`;
      if (kind === 0x90 && data2 > 0) {
        active.set(key, { tick, velocity: data2 / 127 });
      } else if (kind === 0x80 || (kind === 0x90 && data2 === 0)) {
        const start = active.get(key);
        if (start) {
          rawNotes.push({ tick: start.tick, midi: data1, velocity: start.velocity, durationTicks: Math.max(1, tick - start.tick) });
          active.delete(key);
        }
      }
    }
    offset = end;
  }

  const sortedTempos = tempos.sort((a, b) => a.tick - b.tick).filter((event, index, all) => index === 0 || event.tick !== all[index - 1].tick || event.microsecondsPerQuarter !== all[index - 1].microsecondsPerQuarter);
  return rawNotes
    .sort((a, b) => a.tick - b.tick || a.midi - b.midi)
    .map((item, index) => {
      const startMs = ticksToMs(item.tick, division, sortedTempos);
      const endMs = ticksToMs(item.tick + item.durationTicks, division, sortedTempos);
      return {
        id: `midi-${index}`,
        timeMs: startMs,
        midi: item.midi,
        velocity: item.velocity,
        durationMs: Math.max(70, endMs - startMs),
      };
    });
}
