import type { TemplateDay } from './data';

export interface Template {
  key: string;
  name: string;
  days: number;
  blurb: string;
  plan: TemplateDay[];
}

const C = (id: string, sets: number, min: number, max: number, rest = 150, inc = 2.5) => ({ id, sets, min, max, rest, inc });
const A = (id: string, sets: number, min: number, max: number, rest = 90, inc = 2) => ({ id, sets, min, max, rest, inc });

export const TEMPLATES: Template[] = [
  {
    key: 'fb3',
    name: 'Full Body ×3',
    days: 3,
    blurb: 'Three whole-body days a week. The fastest way for a newer lifter to add weight to the bar.',
    plan: [
      { name: 'Day A', exercises: [C('Barbell_Squat', 3, 5, 8, 180), C('Barbell_Bench_Press_-_Medium_Grip', 3, 5, 8, 180), C('Bent_Over_Barbell_Row', 3, 6, 10), A('Plank', 3, 1, 1, 60, 0)] },
      { name: 'Day B', exercises: [C('Romanian_Deadlift', 3, 6, 10, 180), C('x_Overhead_Press', 3, 5, 8, 180), C('Wide-Grip_Lat_Pulldown', 3, 8, 12, 120, 2), A('Dumbbell_Lunges', 2, 8, 12)] },
      { name: 'Day C', exercises: [C('Barbell_Deadlift', 2, 3, 5, 240, 5), C('Incline_Dumbbell_Press', 3, 8, 12, 120, 2), C('Seated_Cable_Rows', 3, 8, 12, 120, 2), A('Hanging_Leg_Raise', 3, 8, 15, 60, 0)] },
    ],
  },
  {
    key: 'ul4',
    name: 'Upper / Lower',
    days: 4,
    blurb: 'Four days, each muscle twice a week. A strength day and a volume day for each half.',
    plan: [
      { name: 'Upper — Strength', exercises: [C('Barbell_Bench_Press_-_Medium_Grip', 4, 4, 6, 180), C('Bent_Over_Barbell_Row', 4, 5, 8, 150), C('x_Overhead_Press', 3, 5, 8), A('Chin-Up', 3, 5, 10, 120, 0), A('EZ-Bar_Skullcrusher', 3, 8, 12)] },
      { name: 'Lower — Strength', exercises: [C('Barbell_Squat', 4, 4, 6, 210), C('Romanian_Deadlift', 3, 6, 8, 180), A('Leg_Press', 3, 8, 12, 120, 5), A('Standing_Calf_Raises', 4, 8, 12)] },
      { name: 'Upper — Volume', exercises: [A('Incline_Dumbbell_Press', 3, 8, 12, 120), A('Wide-Grip_Lat_Pulldown', 3, 10, 12, 120), A('Seated_Dumbbell_Press', 3, 8, 12), A('One-Arm_Dumbbell_Row', 3, 10, 12), A('Side_Lateral_Raise', 3, 12, 20, 60, 1), A('Barbell_Curl', 3, 8, 12)] },
      { name: 'Lower — Volume', exercises: [C('Front_Barbell_Squat', 3, 6, 10, 180), A('Barbell_Hip_Thrust', 3, 8, 12, 120, 5), A('Lying_Leg_Curls', 3, 10, 15), A('Leg_Extensions', 3, 10, 15), A('Seated_Calf_Raise', 3, 12, 20), A('Cable_Crunch', 3, 10, 15)] },
    ],
  },
  {
    key: 'ppl6',
    name: 'Push / Pull / Legs',
    days: 6,
    blurb: 'Six days, run through twice a week. High volume for lifters chasing size.',
    plan: [
      { name: 'Push', exercises: [C('Barbell_Bench_Press_-_Medium_Grip', 4, 5, 8, 180), C('x_Overhead_Press', 3, 6, 10), A('Incline_Dumbbell_Press', 3, 8, 12, 120), A('Side_Lateral_Raise', 4, 12, 20, 60, 1), A('Triceps_Pushdown', 3, 10, 15)] },
      { name: 'Pull', exercises: [C('Barbell_Deadlift', 3, 3, 5, 240, 5), A('Pullups', 3, 6, 10, 120, 0), A('Seated_Cable_Rows', 3, 8, 12, 120), A('Face_Pull', 3, 12, 20, 60, 1), A('Hammer_Curls', 3, 8, 12)] },
      { name: 'Legs', exercises: [C('Barbell_Squat', 4, 5, 8, 210), C('Romanian_Deadlift', 3, 8, 10, 180), A('Leg_Press', 3, 10, 15, 120, 5), A('Lying_Leg_Curls', 3, 10, 15), A('Standing_Calf_Raises', 4, 10, 15)] },
    ],
  },
];
