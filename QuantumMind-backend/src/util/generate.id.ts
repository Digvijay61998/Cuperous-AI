import { nanoid } from 'nanoid';

export const generateId = (pretext: string, length = 10): string => {
  const id = pretext ? `${pretext}_${nanoid(length)}` : nanoid(length);
  return id;
};
