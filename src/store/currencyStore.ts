import { getCurrencyList } from "../api/erpDataApi";   
import {
  DEFAULT_NUMBER_FORMAT_PATTERN,
  formatAmountByPattern,
  formatAmountWithSymbol,
  type FormatAmountOptions,
} from "../utils/currencyFormat";   

interface CurrencyRecord {
  name: string;
  symbol: string | null;
  currency_name?: string;
  number_format?: string | null;
}

interface CurrencyMeta {
  symbol: string;
  numberFormat: string;
}

const STORAGE_KEY = "currency_store_cache_v3";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

let cache = new Map<string, CurrencyMeta>();
let status: "idle" | "loading" | "ready" | "error" = "idle";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function readFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as {
      savedAt: number;
      entries: [string, CurrencyMeta][];
    };

    if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) return false;
    if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) return false;

    cache = new Map(parsed.entries);
    return true;
  } catch {
    return false;
  }
}

function writeToStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ savedAt: Date.now(), entries: [...cache.entries()] }),
    );
  } catch {
    // localStorage unavailable/full — non-fatal
  }
}

async function fetchCurrencies(codes: string[]): Promise<void> {
  const pending = [...new Set(codes.filter(Boolean))].filter((c) => !cache.has(c));
  if (pending.length === 0) return;

  const BATCH_SIZE = 20;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((code) => getCurrencyList({ search: code, page_size: 5 })),
    );

    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;

      const res: any = result.value;
      const envelope = res?.message ?? res;
      const records: CurrencyRecord[] = Array.isArray(envelope)
        ? envelope
        : envelope?.data ?? [];

      if (records.length === 0) return;

      const code = batch[idx];
      const exactMatch = records.find(
        (record) => record?.name?.toUpperCase() === code.toUpperCase(),
      );
      if (!exactMatch) return;

      cache.set(exactMatch.name, {
        symbol: exactMatch.symbol || exactMatch.name,
        numberFormat: exactMatch.number_format || DEFAULT_NUMBER_FORMAT_PATTERN,
      });
    });
  }
}

export function ensureCurrencies(codes: string[]): Promise<void> {
  const pending = [...new Set(codes.filter(Boolean))].filter((c) => !cache.has(c));
  if (pending.length === 0) return Promise.resolve();

  if (status !== "loading") {
    status = "loading";
    notify();
  }

  const promise = fetchCurrencies(pending)
    .then(() => {
      status = "ready";
      writeToStorage();
      notify();
    })
    .catch((err) => {
      status = cache.size === 0 ? "error" : "ready";
      notify();
      throw err;
    });

  return promise;
}

export function hydrateFromStorage(): void {
  const hadCachedCopy = readFromStorage();
  if (hadCachedCopy) {
    status = "ready";
    notify();
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStatus() {
  return status;
}

export function isReady() {
  return status === "ready" || cache.size > 0;
}

export function getSymbol(code: string | null | undefined): string {
  if (!code) return "";
  return cache.get(code)?.symbol ?? code;
}

export function getNumberFormat(code: string | null | undefined): string {
  if (!code) return DEFAULT_NUMBER_FORMAT_PATTERN;
  return cache.get(code)?.numberFormat ?? DEFAULT_NUMBER_FORMAT_PATTERN;
}

export function formatAmount(
  code: string | null | undefined,
  value: number | string | null | undefined,
  options?: FormatAmountOptions,
): string {
  const meta = code ? cache.get(code) : undefined;
  const pattern = meta?.numberFormat ?? DEFAULT_NUMBER_FORMAT_PATTERN;

  if (!options?.withSymbol) {
    return formatAmountByPattern(value, pattern);
  }

  return formatAmountWithSymbol(value, pattern, meta?.symbol ?? code ?? "", options);
}