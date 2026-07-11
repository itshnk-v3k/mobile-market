import { generateId, mergeClasses, transform } from './merge-classes';

// Smoke spec verifying the Vitest + Angular 22 unit-test toolchain runs.
// The storefront was scaffolded with skipTests, so this is the first spec;
// it exercises the pure class-merge/util helpers (no TestBed needed).
describe('merge-classes utils', () => {
  describe('mergeClasses', () => {
    it('joins truthy class values', () => {
      expect(mergeClasses('a', 'b')).toBe('a b');
    });

    it('drops falsy values and de-duplicates conflicting tailwind classes', () => {
      expect(mergeClasses('px-2', undefined, null, 'px-4')).toBe('px-4');
    });
  });

  describe('transform', () => {
    it('treats an empty string (present boolean attribute) as true', () => {
      expect(transform('')).toBe(true);
    });

    it('passes booleans through unchanged', () => {
      expect(transform(false)).toBe(false);
      expect(transform(true)).toBe(true);
    });
  });

  describe('generateId', () => {
    it('prefixes the generated id when a prefix is given', () => {
      expect(generateId('m').startsWith('m-')).toBe(true);
    });
  });
});
