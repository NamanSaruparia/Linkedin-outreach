import * as XLSX from "xlsx";
import type { Connection } from "../types";

/** LinkedIn Connections.csv / .xlsx column headers (May 2026 export format). */
const LINKEDIN_HEADERS = [
  "first name",
  "last name",
  "url",
  "email address",
  "company",
  "position",
  "connected on",
] as const;

const COLUMN_MAP: Record<string, keyof Pick<
  Connection,
  "firstName" | "lastName" | "url" | "email" | "company" | "position" | "connectedOn"
>> = {
  "first name": "firstName",
  "last name": "lastName",
  url: "url",
  "email address": "email",
  company: "company",
  position: "position",
  "connected on": "connectedOn",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

function formatConnectedOn(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.d} ${MONTHS[parsed.m - 1]} ${parsed.y}`;
    }
  }
  const s = cellStr(value);
  if (/^\d+(\.\d+)?$/.test(s)) {
    const parsed = XLSX.SSF.parse_date_code(Number(s));
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${parsed.d} ${MONTHS[parsed.m - 1]} ${parsed.y}`;
    }
  }
  return s;
}

function isLinkedInHeaderRow(row: unknown[]): boolean {
  const cells = row.map((c) => normalizeHeader(cellStr(c)));
  return (
    cells.includes("first name") &&
    cells.includes("last name") &&
    cells.includes("url") &&
    cells.includes("connected on")
  );
}

function findLinkedInHeaderIndex(rows: unknown[][]): number {
  return rows.findIndex((row) => Array.isArray(row) && isLinkedInHeaderRow(row));
}

function slugFromUrl(url: string): string {
  const m = url.match(/linkedin\.com\/in\/([^/?]+)/i);
  return m ? m[1].toLowerCase() : "";
}

function generateId(
  firstName: string,
  lastName: string,
  url: string,
  index: number
): string {
  const slug = slugFromUrl(url);
  if (slug) return `li-${slug}`;
  const name = `${firstName}-${lastName}`.trim().replace(/\s+/g, "-").toLowerCase();
  return `conn-${index}-${name || "unknown"}`;
}

function isDataRow(row: unknown[], colIndex: Map<string, number>): boolean {
  const firstIdx = colIndex.get("first name");
  const urlIdx = colIndex.get("url");
  const first = firstIdx != null ? cellStr(row[firstIdx]) : "";
  const url = urlIdx != null ? cellStr(row[urlIdx]) : "";

  if (!first && !url) return false;
  if (first.toLowerCase() === "notes:") return false;
  if (first.toLowerCase().startsWith("when exporting")) return false;
  if (!url.includes("linkedin.com/in/")) return false;

  return true;
}

function rowToConnection(
  row: unknown[],
  colIndex: Map<string, number>,
  index: number
): Connection | null {
  const get = (header: string) => {
    const idx = colIndex.get(header);
    return idx != null ? row[idx] : "";
  };

  const firstName = cellStr(get("first name"));
  const lastName = cellStr(get("last name"));
  const url = cellStr(get("url"));
  const email = cellStr(get("email address"));
  const company = cellStr(get("company"));
  const position = cellStr(get("position"));
  const connectedOn = formatConnectedOn(get("connected on"));

  if (!isDataRow(row, colIndex)) return null;

  const raw: Record<string, string> = {
    "First Name": firstName,
    "Last Name": lastName,
    URL: url,
    "Email Address": email,
    Company: company,
    Position: position,
    "Connected On": connectedOn,
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id: generateId(firstName, lastName, url, index),
    firstName,
    lastName,
    fullName,
    url,
    email,
    company,
    position,
    connectedOn,
    status: "pending",
    contactedAt: null,
    repliedAt: null,
    updatedAt: null,
    notes: "",
    customMessage: "",
    raw,
  };
}

function parseWorkbook(workbook: XLSX.WorkBook): Connection[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (rows.length === 0) {
    throw new Error("The file appears to be empty.");
  }

  const headerIdx = findLinkedInHeaderIndex(rows);
  if (headerIdx < 0) {
    throw new Error(
      "Could not find LinkedIn connection headers. Expected columns: First Name, Last Name, URL, Email Address, Company, Position, Connected On. Use the Connections.csv file from your LinkedIn data export."
    );
  }

  const headerRow = rows[headerIdx].map((c) => normalizeHeader(cellStr(c)));
  const colIndex = new Map<string, number>();
  headerRow.forEach((h, i) => {
    if (COLUMN_MAP[h]) colIndex.set(h, i);
  });

  const missing = LINKEDIN_HEADERS.filter((h) => !colIndex.has(h));
  if (missing.length > 0) {
    throw new Error(
      `Missing expected columns: ${missing.join(", ")}. Re-export Connections from LinkedIn.`
    );
  }

  const connections: Connection[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const conn = rowToConnection(row, colIndex, connections.length);
    if (conn) connections.push(conn);
  }

  if (connections.length === 0) {
    throw new Error("No connection rows found after the header. Check that Connections.csv is complete.");
  }

  return connections;
}

export function parseConnectionsFile(file: File): Promise<Connection[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          raw: true,
        });
        resolve(parseWorkbook(workbook));
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error(
                "Failed to parse file. Upload Connections.csv from LinkedIn (Settings → Data privacy → Get a copy of your data)."
              )
        );
      }
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsArrayBuffer(file);
  });
}

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/$/, "");
}

function nameKey(conn: Connection): string {
  return conn.fullName.trim().toLowerCase().replace(/\s+/g, " ");
}

function findExisting(
  inc: Connection,
  byId: Map<string, Connection>,
  byUrl: Map<string, Connection>,
  byName: Map<string, Connection>
): Connection | undefined {
  if (inc.id && byId.has(inc.id)) return byId.get(inc.id);
  if (inc.url) {
    const u = normalizeUrl(inc.url);
    if (byUrl.has(u)) return byUrl.get(u);
  }
  const nk = nameKey(inc);
  if (nk && nk !== "unknown" && byName.has(nk)) return byName.get(nk);
  return undefined;
}

function mergeWithPrevious(inc: Connection, prev: Connection): Connection {
  return {
    ...inc,
    id: prev.id,
    status: prev.status,
    contactedAt: prev.contactedAt,
    repliedAt: prev.repliedAt,
    updatedAt: prev.updatedAt,
    notes: prev.notes,
    customMessage: prev.customMessage,
  };
}

export interface ImportMergeResult {
  connections: Connection[];
  added: number;
  statusPreserved: number;
  keptNotInFile: number;
  total: number;
}

/**
 * Re-import: match by LinkedIn URL, id, or name.
 * Existing outreach status/notes/messages stay; new rows are added.
 * Contacts only in the old list (not in new file) are kept at the end.
 */
export function mergeConnections(
  existing: Connection[],
  incoming: Connection[]
): ImportMergeResult {
  const byId = new Map(existing.map((c) => [c.id, c]));
  const byUrl = new Map(
    existing
      .filter((c) => c.url)
      .map((c) => [normalizeUrl(c.url), c])
  );
  const byName = new Map(
    existing
      .filter((c) => nameKey(c) && nameKey(c) !== "unknown")
      .map((c) => [nameKey(c), c])
  );

  const matchedPrevIds = new Set<string>();
  let added = 0;
  let statusPreserved = 0;

  const merged = incoming.map((inc) => {
    const prev = findExisting(inc, byId, byUrl, byName);
    if (prev) {
      matchedPrevIds.add(prev.id);
      statusPreserved++;
      return mergeWithPrevious(inc, prev);
    }
    added++;
    return inc;
  });

  const keptNotInFile = existing.filter((c) => !matchedPrevIds.has(c.id));

  const connections = [...merged, ...keptNotInFile];

  return {
    connections,
    added,
    statusPreserved,
    keptNotInFile: keptNotInFile.length,
    total: connections.length,
  };
}
