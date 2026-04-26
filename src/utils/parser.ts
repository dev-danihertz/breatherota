export interface Shift {
  name: string;
  start: number;
  end: number;
  startTimeStr: string;
  endTimeStr: string;
}

export interface DayData {
  day: string;
  shifts: Shift[];
}

function timeToDecimal(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  let decimal = (hours || 0) + (minutes || 0) / 60;
  if (decimal === 0 && hours === 0) return 24;
  return decimal;
}

export function parseSchedule(text: string): DayData[] {
  if (!text) return [];
  
  const days: DayData[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let currentDay: DayData | null = null;

  const dayRegex = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d+/i;
  const shiftRegex = /^(.+?)\s*[—–-]\s*(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})/;

  lines.forEach(line => {
    const dayMatch = line.match(dayRegex);
    if (dayMatch) {
      currentDay = { day: line, shifts: [] };
      days.push(currentDay);
    } else if (currentDay) {
      const shiftMatch = line.match(shiftRegex);
      if (shiftMatch) {
        const [_, name, startStr, endStr] = shiftMatch;
        currentDay.shifts.push({
          name: name.trim(),
          start: timeToDecimal(startStr),
          end: timeToDecimal(endStr),
          startTimeStr: startStr,
          endTimeStr: endStr
        });
      }
    }
  });

  return days;
}
