import type { ConvertOptions } from '@pixelforge/image-engine';

export type TaskOutput = {
  files: { data: Blob; before: Blob; after: Blob };
  name: string; size: number; width: number; height: number;
  originalWidth: number; originalHeight: number; format: string;
};
export type Task = {
  id: string; file: File; order: number;
  status: 'waiting' | 'working' | 'paused' | 'interrupted' | 'done' | 'error' | 'cancelled';
  options?: ConvertOptions; output?: TaskOutput; error?: string;
};

export async function openTaskStore() {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('pixelforge-tasks', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('tasks', { keyPath: 'id' });
      request.result.createObjectStore('settings');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('请关闭其他 PixelForge 窗口后重试。'));
  });
  db.onversionchange = () => db.close();

  function write(action: (tasks: IDBObjectStore, settings: IDBObjectStore) => void) {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['tasks', 'settings'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error ?? new Error('任务未能保存，请检查存储空间。'));
      try { action(transaction.objectStore('tasks'), transaction.objectStore('settings')); }
      catch (error) { transaction.abort(); reject(error); }
    });
  }

  return {
    async load() {
      const transaction = db.transaction(['tasks', 'settings'], 'readonly');
      const tasks = transaction.objectStore('tasks').getAll();
      const enabled = transaction.objectStore('settings').get('enabled');
      const options = transaction.objectStore('settings').get('options');
      return new Promise<{ tasks: Task[]; enabled: boolean; options?: ConvertOptions }>((resolve, reject) => {
        transaction.oncomplete = () => resolve({ tasks: tasks.result, enabled: enabled.result === true, options: options.result });
        transaction.onabort = () => reject(transaction.error);
      });
    },
    put(tasks: Task[], options?: ConvertOptions) {
      return write((store, settings) => {
        tasks.forEach((task) => store.put(task));
        if (options) settings.put(options, 'options');
      });
    },
    remove(id?: string) { return write((tasks) => { if (id) tasks.delete(id); else tasks.clear(); }); },
    setEnabled(enabled: boolean, tasks: Task[], options: ConvertOptions) {
      return write((store, settings) => {
        store.clear();
        if (enabled) tasks.forEach((task) => store.put(task));
        settings.put(enabled, 'enabled');
        settings.put(options, 'options');
      });
    },
    close() { db.close(); },
  };
}
