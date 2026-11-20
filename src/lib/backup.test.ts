import { describe, expect, it } from 'vitest';
import { BACKUP_APP, backupFileName, buildBackup, serializeBackup, type BackupTables } from './backup';

const tables: BackupTables = {
  exercises: [{ id: 'exr1', name: 'Bankdrücken', archived: false }],
  planEntries: [
    { id: 'pln1', split: 'upper', exerciseId: 'exr1', order: 0, warmupSets: 1, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
  ],
  workouts: [
    { id: 'wrk7', date: '2026-11-19', split: 'upper', startedAt: '2026-11-19T17:00:00.000Z', finishedAt: '2026-11-19T18:00:00.000Z' },
  ],
  sets: [
    { id: 'sts1', workoutId: 'wrk7', exerciseId: 'exr1', warmup: true, setNumber: 1, weightKg: 40, reps: 10 },
    { id: 'sts2', workoutId: 'wrk7', exerciseId: 'exr1', warmup: false, setNumber: 1, weightKg: 82.5, reps: 8 },
  ],
  segments: [{ id: 'sgm1', workoutId: 'wrk7', exerciseId: 'exr1', startedAt: '2026-11-19T17:00:00.000Z', endedAt: '2026-11-19T17:20:00.000Z' }],
  bodyWeights: [{ id: '#2026-11-19', date: '2026-11-19', weightKg: 78.4 }],
};

describe('backup', () => {
  it('enthält alle Tabellen samt Aufwärmsätzen und Abschnitten', () => {
    const backup = buildBackup(tables, 3, new Date('2026-11-20T08:00:00.000Z'));
    expect(backup.app).toBe(BACKUP_APP);
    expect(backup.schemaVersion).toBe(3);
    expect(backup.exportedAt).toBe('2026-11-20T08:00:00.000Z');
    expect(Object.keys(backup.tables).sort()).toEqual(
      ['bodyWeights', 'exercises', 'planEntries', 'segments', 'sets', 'workouts'],
    );
    expect(backup.tables.sets).toHaveLength(2);
    expect(backup.tables.segments).toHaveLength(1);
  });

  it('übersteht JSON verlustfrei', () => {
    const backup = buildBackup(tables, 3, new Date('2026-11-20T08:00:00.000Z'));
    expect(JSON.parse(serializeBackup(backup))).toEqual(backup);
  });

  it('benennt die Datei nach dem lokalen Tag', () => {
    expect(backupFileName('2026-11-20')).toBe('training-backup-2026-11-20.json');
  });
});
