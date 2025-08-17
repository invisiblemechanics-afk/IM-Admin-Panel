import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export type SkillTagOption = {
  value: string;       // the tag slug/string
  label: string;       // same as value (keep simple)
  chapterId: string;
  chapterName: string;
};

const CACHE_KEY = 'allSkillTagsCache.v1';
const CACHE_MS = 5 * 60 * 1000; // 5 minutes

export function useAllSkillTags() {
  const [tags, setTags] = useState<SkillTagOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chaptersSnap = await getDocs(collection(db, 'Chapters'));
      const raw: SkillTagOption[] = [];
      chaptersSnap.forEach((docSnap) => {
        const d = docSnap.data() as any;
        const chapterId = docSnap.id;
        const chapterName = d?.name ?? chapterId;
        const arr: string[] = Array.isArray(d?.skillTags) ? d.skillTags : [];
        arr.forEach((t) => {
          raw.push({ value: String(t), label: String(t), chapterId, chapterName });
        });
      });

      // de-dupe by value and sort alphabetically
      const map = new Map<string, SkillTagOption>();
      raw.forEach((o) => {
        if (!map.has(o.value)) map.set(o.value, o);
      });
      const all = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'en'));

      setTags(all);
      // cache
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data: all })
        );
      } catch {}
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // try cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_MS && Array.isArray(data)) {
          setTags(data);
          setLoading(false);
          // also refresh in background
          fetchAll();
          return;
        }
      }
    } catch {}
    fetchAll();
  }, [fetchAll]);

  return { tags, loading, error, refresh: fetchAll };
}









