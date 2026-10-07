import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { executeTransformation, appendResult } from '../../src/core/engine';
import { compatibleInputs, supportsInputs, registry } from '../../src/core/registry';
import {
  newSession,
  type TransformObject,
  type TransformationDefinition,
} from '../../src/core/types';
import { saveSession, restoreSession, resolveBytes, clearStorage } from '../../src/storage/objects';
const image = (id: string): TransformObject => ({
  id,
  type: 'image',
  name: `${id}.png`,
  mimeType: 'image/png',
  size: 1,
  createdAt: 1,
  metadata: { width: 1, height: 1 },
  storage: { kind: 'blob', blob: new Blob([id], { type: 'image/png' }) },
  preview: { objectId: id },
});
const a = image('a'),
  b = image('b');
const op: TransformationDefinition = {
  ...registry[0],
  inputs: { min: 1, max: 3 },
  outputs: { min: 1, max: 3 },
  defaults: () => ({}),
  validate: () => {},
};
describe('shared multi-input/output execution', () => {
  for (const [inputs, outputs] of [
    [[a, b], [image('joined')]],
    [[a], [image('page1'), image('page2')]],
    [
      [a, b],
      [image('out1'), image('out2')],
    ],
  ] as const) {
    it(`records ${inputs.length} inputs and atomically commits ${outputs.length} outputs`, async () => {
      const result = await executeTransformation(inputs, op, {}, [
        { supports: () => true, execute: async () => [...outputs] },
      ]);
      const source = { ...newSession(), objects: [a, b], activeId: a.id };
      const updated = appendResult(source, result);
      expect(updated.operations[0].inputIds).toEqual(inputs.map((o) => o.id));
      expect(updated.operations[0].outputIds).toEqual(outputs.map((o) => o.id));
      expect(updated.activeId).toBe(outputs[0].id);
      expect(updated.objects.slice(0, 2)).toEqual([a, b]);
      expect(source.objects).toHaveLength(2);
      await clearStorage();
      await saveSession(updated);
      const restored = (await restoreSession())!;
      expect(restored.operations).toEqual(updated.operations);
      for (const o of restored.objects)
        expect(await (await resolveBytes(o.storage)).text()).toBe(o.id);
    });
  }
  it('rejects duplicate, empty, excessive and unsupported inputs before execution', async () => {
    const execute = vi.fn();
    for (const inputs of [
      [],
      [a, a],
      [a, b, image('c'), image('d')],
      [{ ...a, mimeType: 'application/pdf' }],
    ])
      await expect(
        executeTransformation(inputs, op, {}, [{ supports: () => true, execute }]),
      ).rejects.toMatchObject({ code: 'INCOMPATIBLE_INPUT' });
    expect(execute).not.toHaveBeenCalled();
    expect(compatibleInputs([a, b])).toEqual([]);
    expect(supportsInputs(op, [a, b])).toBe(true);
  });
  it('rejects incomplete outputs and graph collisions without partial commits', async () => {
    for (const outputs of [
      [],
      [image('x'), image('x')],
      [a],
      [{ ...image('x'), mimeType: 'text/plain' }],
    ])
      await expect(
        executeTransformation([a, b], op, {}, [
          { supports: () => true, execute: async () => outputs },
        ]),
      ).rejects.toMatchObject({ code: 'INVALID_OUTPUT' });
    const result = await executeTransformation([a, b], op, {}, [
      { supports: () => true, execute: async () => [image('x'), image('y')] },
    ]);
    const source = { ...newSession(), objects: [a, b, image('y')], activeId: a.id };
    expect(() => appendResult(source, result)).toThrow('conflicting');
    expect(source.objects).toHaveLength(3);
    expect(source.operations).toHaveLength(0);
    expect(() => appendResult({ ...source, objects: [a] }, result)).toThrow('conflicting');
    await expect(
      executeTransformation([a, b], op, {}, [
        {
          supports: () => true,
          execute: async () => {
            throw new Error('second input unavailable');
          },
        },
      ]),
    ).rejects.toMatchObject({ code: 'EXECUTION_FAILED' });
  });
});
