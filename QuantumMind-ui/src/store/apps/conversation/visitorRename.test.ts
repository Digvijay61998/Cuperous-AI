import { describe, expect, it } from 'vitest';
import { renameConversationVisitor, renameInList } from './visitorRename';

const conv = (id: string, name = 'Anonymous') => ({ _id: id, visitor: { _id: `v-${id}`, name }, chats: [] });

describe('visitor rename (crm-plugins-service-desk R4.5)', () => {
  it('renames only the matching conversation', () => {
    const list = [conv('c1'), conv('c2')];
    const out = renameInList(list, { conversationId: 'c2', visitorId: 'v-c2', name: 'Raj Kumar' });
    expect(out.map((c) => c.visitor.name)).toEqual(['Anonymous', 'Raj Kumar']);
    expect(out[0]).toBe(list[0]);
  });

  it('ignores empty names and missing conversations', () => {
    const c = conv('c1');
    expect(renameConversationVisitor(c, { conversationId: 'c1', name: '  ' })).toBe(c);
    expect(renameConversationVisitor(null as any, { conversationId: 'c1', name: 'Raj' })).toBeNull();
    expect(renameInList(undefined, { conversationId: 'c1', name: 'Raj' })).toEqual([]);
  });

  it('keeps the same object when the name is already shown', () => {
    const c = conv('c1', 'Raj');
    expect(renameConversationVisitor(c, { conversationId: 'c1', name: 'Raj' })).toBe(c);
  });
});
