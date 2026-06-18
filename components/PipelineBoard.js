"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateContactStatus } from "@/app/actions";

export default function PipelineBoard({ columns }) {
  const router = useRouter();

  async function move(contactId, status) {
    await updateContactStatus(contactId, status);
    router.refresh();
  }

  return (
    <div className="pipeline">
      {columns.map((col) => (
        <div key={col.id} className="pipeline-col">
          <h3>
            {col.label} ({col.contacts.length})
          </h3>
          {col.contacts.map((c) => (
            <div key={c.id} className="pipeline-card">
              <Link href={`/leads/${c.id}`}>
                <strong>{c.name}</strong>
                <span>{c.email}</span>
              </Link>
              <div style={{ marginTop: ".5rem" }}>
                <select
                  defaultValue={c.status}
                  onChange={(e) => move(c.id, e.target.value)}
                  style={{ width: "100%", fontSize: ".78rem", padding: ".3rem" }}
                >
                  {columns.map((s) => (
                    <option key={s.id} value={s.id}>
                      → {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
