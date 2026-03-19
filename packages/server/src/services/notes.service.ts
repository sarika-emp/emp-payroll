import { v4 as uuid } from "uuid";
import { getDB } from "../db/adapters";
import { getEmpCloudDB } from "../db/empcloud";

export interface CreateNoteInput {
  orgId: string;
  employeeId: string;
  authorId: string;
  content: string;
  category?: string;
  isPrivate?: boolean;
}

export async function createNote(input: CreateNoteInput) {
  const db = getDB();
  const id = uuid();
  await db.create("employee_notes", {
    id,
    org_id: input.orgId,
    employee_id: input.employeeId,
    author_id: input.authorId,
    content: input.content,
    category: input.category || "general",
    is_private: input.isPrivate ? 1 : 0,
  });
  return { id };
}

export async function getNotes(employeeId: string, orgId: string) {
  const db = getDB();
  // Get notes from payroll DB
  const result = await db.raw<any>(
    `SELECT n.id, n.content, n.category, n.is_private, n.created_at, n.author_id
     FROM employee_notes n
     WHERE n.employee_id = ? AND n.org_id = ?
     ORDER BY n.created_at DESC`,
    [employeeId, orgId],
  );
  const notes = Array.isArray(result)
    ? Array.isArray(result[0])
      ? result[0]
      : result
    : result.rows || [];

  // Enrich with author names from EmpCloud
  try {
    const ecDb = getEmpCloudDB();
    for (const note of notes) {
      if (note.author_id) {
        const author = await ecDb("users")
          .where({ id: Number(note.author_id) })
          .select("first_name", "last_name")
          .first();
        note.author_first_name = author?.first_name || null;
        note.author_last_name = author?.last_name || null;
      }
    }
  } catch {
    // EmpCloud may not be available — notes still returned without author names
  }

  return notes;
}

export async function deleteNote(noteId: string, orgId: string) {
  const db = getDB();
  const count = await db.deleteMany("employee_notes", { id: noteId, org_id: orgId });
  return count > 0;
}
