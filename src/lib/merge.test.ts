import { describe, expect, it } from 'vitest';
import type { BackupTables } from './backup';
import { mergeLocalIntoCloud } from './merge';
import { buildDefaultPlan } from './seed';

const empty = (): BackupTables => ({
  exercises: [],
  planEntries: [],
  workouts: [],
  sets: [],
  segments: [],
  bodyWeights: [],
});

/** Der feste Plan mit anderen Schlüsseln, wie auf einem Gerät nach der Umwandlung alter Daten. */
function defaultPlanWithIds(prefix: string): BackupTables {
  const rows = buildDefaultPlan({ exercises: '', planEntries: '' });
  const id = (old: string) => `${prefix}${old.replace('#', '')}`;
  return {
    ...empty(),
    exercises: rows.exercises.map((e) => ({ ...e, id: id(e.id) })),
    planEntries: rows.planEntries.map((p) => ({ ...p, id: `p${id(p.id)}`, exerciseId: id(p.exerciseId) })),
  };
}

/** Der Plan vom Mac: umbenannt, ersetzt, umsortiert. */
function macPlan(): BackupTables {
  const plan = defaultPlanWithIds('mac');
  plan.exercises = plan.exercises.map((e) =>
    e.name === 'Seitheben (Maschine/Kabel)'
      ? { ...e, name: 'Seitheben' }
      : e.name === 'Reverse Butterfly'
        ? { ...e, name: 'FacePull' }
        : e,
  );
  plan.planEntries = plan.planEntries.map((p) => (p.order === 0 ? { ...p, targetSets: 4 } : p));
  return plan;
}

const workout = { id: 'wrkLocal', date: '2026-11-20', split: 'upper' as const, startedAt: '2026-11-20T17:00:00.000Z' };

describe('mergeLocalIntoCloud', () => {
  it('übernimmt alles, wenn die Cloud noch leer ist', () => {
    const local = { ...macPlan(), workouts: [workout] };
    expect(mergeLocalIntoCloud(empty(), local)).toEqual(local);
  });

  it('lädt den unveränderten festen Plan nicht zusätzlich hoch (iPhone nach dem Mac)', () => {
    const merged = mergeLocalIntoCloud(macPlan(), defaultPlanWithIds('phone'));
    expect(merged.exercises).toEqual([]);
    expect(merged.planEntries).toEqual([]);
  });

  it('legt Übungen mit gleichem Namen nicht doppelt an und hängt Sätze um', () => {
    const cloud = macPlan();
    const local = defaultPlanWithIds('phone');
    const brust = local.exercises.find((e) => e.name === 'Brustpresse')!;
    local.workouts = [workout];
    local.sets = [{ id: 'setLocal', workoutId: workout.id, exerciseId: brust.id, warmup: false, setNumber: 1, weightKg: 80, reps: 8 }];
    local.segments = [{ id: 'sgmLocal', workoutId: workout.id, exerciseId: brust.id, startedAt: workout.startedAt }];
    const cloudBrust = cloud.exercises.find((e) => e.name === 'Brustpresse')!;

    const merged = mergeLocalIntoCloud(cloud, local);
    expect(merged.exercises).toEqual([]);
    expect(merged.workouts).toEqual([workout]);
    expect(merged.sets).toEqual([{ ...local.sets[0], exerciseId: cloudBrust.id }]);
    expect(merged.segments[0].exerciseId).toBe(cloudBrust.id);
  });

  it('behält Sätze an einer Übung, die die Cloud nicht kennt, ohne sie in den Plan zu nehmen', () => {
    const local = defaultPlanWithIds('phone');
    const reverse = local.exercises.find((e) => e.name === 'Reverse Butterfly')!;
    local.workouts = [workout];
    local.sets = [{ id: 'setLocal', workoutId: workout.id, exerciseId: reverse.id, warmup: false, setNumber: 1, weightKg: 30, reps: 12 }];

    const merged = mergeLocalIntoCloud(macPlan(), local);
    expect(merged.exercises).toEqual([{ ...reverse, archived: true }]);
    expect(merged.planEntries).toEqual([]);
    expect(merged.sets[0].exerciseId).toBe(reverse.id);
  });

  it('hängt Übungen eines geänderten Plans, die in der Liste fehlen, ans Ende', () => {
    const local = defaultPlanWithIds('phone');
    local.exercises.push({ id: 'phoneDips', name: 'Dips', archived: false });
    local.planEntries.push({
      id: 'pphoneDips', split: 'upper', exerciseId: 'phoneDips', order: 9,
      warmupSets: 0, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12,
    });
    const cloud = macPlan();

    const merged = mergeLocalIntoCloud(cloud, local);
    const upperInCloud = cloud.planEntries.filter((p) => p.split === 'upper').length;
    // Dips neu; „Seitheben (Maschine/Kabel)“ und „Reverse Butterfly“ heißen am Mac anders und
    // kommen deshalb aus dem geänderten Plan des Geräts ebenfalls dazu.
    expect(merged.exercises.map((e) => e.name).sort()).toEqual(['Dips', 'Reverse Butterfly', 'Seitheben (Maschine/Kabel)']);
    expect(merged.planEntries.map((p) => p.order)).toEqual([upperInCloud, upperInCloud + 1, upperInCloud + 2]);
    // Gleichnamige Übungen behalten die Ziele aus der Cloud.
    expect(merged.planEntries.every((p) => merged.exercises.some((e) => e.id === p.exerciseId))).toBe(true);
  });

  it('nimmt eine archivierte Übung aus der Cloud wieder in den Plan', () => {
    const cloud = macPlan();
    cloud.exercises.push({ id: 'macDips', name: 'Dips', archived: true });
    const local = { ...empty(), exercises: [{ id: 'phoneDips', name: 'dips', archived: false }] };
    local.planEntries = [{
      id: 'pphoneDips', split: 'lower', exerciseId: 'phoneDips', order: 0,
      warmupSets: 0, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12,
    }];

    const merged = mergeLocalIntoCloud(cloud, local);
    expect(merged.exercises).toEqual([{ id: 'macDips', name: 'Dips', archived: false }]);
    expect(merged.planEntries).toEqual([{ ...local.planEntries[0], exerciseId: 'macDips', order: 7 }]);
  });

  it('lässt das Körpergewicht eines Tages, den die Cloud schon hat, wie in der Cloud', () => {
    const cloud = { ...macPlan(), bodyWeights: [{ id: '#2026-11-20', date: '2026-11-20', weightKg: 78 }] };
    const local = {
      ...empty(),
      bodyWeights: [
        { id: '#2026-11-20', date: '2026-11-20', weightKg: 79 },
        { id: '#2026-11-19', date: '2026-11-19', weightKg: 78.4 },
      ],
    };
    expect(mergeLocalIntoCloud(cloud, local).bodyWeights).toEqual([local.bodyWeights[1]]);
  });

  it('ist beim zweiten Mal wirkungslos', () => {
    const cloud = macPlan();
    const first = mergeLocalIntoCloud(cloud, macPlan());
    expect(first.exercises).toEqual([]);
    expect(first.planEntries).toEqual([]);
  });
});
