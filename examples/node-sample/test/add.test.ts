// add.test.ts — add の試験。キットの試験（K-5）が、この名前でテストの入口と確認の手伝いを確かめる。
import { describe, it, expect } from 'vitest';
import { add } from '../src/add';

describe('add', () => {
  it('足し算ができる', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('マイナスも足せる', () => {
    expect(add(-1, -2)).toBe(-3);
  });
});
