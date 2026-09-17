export type BreakSession = {
  countingDown: boolean;
  closing: boolean;
  sharedBreakEndTime: number | null;
  generation: number;
};

export function initialBreakSession(): BreakSession {
  return {
    countingDown: true,
    closing: false,
    sharedBreakEndTime: null,
    generation: 0,
  };
}

/* Persistent Tauri windows keep this tree alive across breaks. Each event
   must leave a state the next show() can render — a leftover `closing`
   paints the "done" sheet (or a blank veil) over the next notice. */
export function onBreakStart(
  session: BreakSession,
  endTime: number,
): BreakSession {
  return {
    countingDown: false,
    closing: false,
    sharedBreakEndTime: endTime,
    generation: session.generation + 1,
  };
}

export function onBreakClosing(session: BreakSession): BreakSession {
  return { ...session, closing: true };
}

export function onBreakParked(session: BreakSession): BreakSession {
  return {
    countingDown: true,
    closing: false,
    sharedBreakEndTime: null,
    generation: session.generation + 1,
  };
}
