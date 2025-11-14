import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';
import { useFormChangeHandler } from './useFormChangeHandler';

describe('useFormChangeHandler', () => {
  it('updates a top-level field correctly', () => {
    const initialData = { name: 'John', age: 30 };
    const { result } = renderHook(() => {
      const [formData, setFormData] = useState(initialData);
      const handler = useFormChangeHandler(formData, setFormData);
      return { formData, handler };
    });

    act(() => {
      result.current.handler('name', 'Jane');
    });

    expect(result.current.formData).toEqual({ name: 'Jane', age: 30 });
  });

  it('updates a top-level field with a different type correctly', () => {
    const initialData = { name: 'John', age: 30 };
    const { result } = renderHook(() => {
      const [formData, setFormData] = useState(initialData);
      const handler = useFormChangeHandler(formData, setFormData);
      return { formData, handler };
    });

    act(() => {
      result.current.handler('age', 31);
    });

    expect(result.current.formData).toEqual({ name: 'John', age: 31 });
  });

  it('handles nested updates using a function', () => {
    const initialData = { user: { firstName: 'John', lastName: 'Doe' }, age: 30 };
    const { result } = renderHook(() => {
      const [formData, setFormData] = useState(initialData);
      const handler = useFormChangeHandler(formData, setFormData);
      return { formData, handler };
    });

    act(() => {
      result.current.handler((prev) => ({
        ...prev,
        user: { ...prev.user, firstName: 'Jane' },
      }));
    });

    expect(result.current.formData).toEqual({ user: { firstName: 'Jane', lastName: 'Doe' }, age: 30 });
  });

  it('does nothing if formData is null', () => {
    const { result } = renderHook(() => {
      const [formData, setFormData] = useState<any>(null);
      const handler = useFormChangeHandler(formData, setFormData);
      return { formData, handler };
    });

    act(() => {
      result.current.handler('name', 'Jane');
    });

    expect(result.current.formData).toBeNull();
  });

  it('returns a stable handler function', () => {
    const initialData = { name: 'John' };
    const { result, rerender } = renderHook(() => {
      const [formData, setFormData] = useState(initialData);
      const handler = useFormChangeHandler(formData, setFormData);
      return { formData, handler };
    });

    const initialHandler = result.current.handler;
    rerender();
    expect(result.current.handler).toBe(initialHandler);
  });
});
