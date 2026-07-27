import { useEffect, useMemo, useState } from "react";
import useAppStore from "../store/appStore";
import { createTask } from "../lib/api";

export function Palette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const setView = useAppStore((s) => s.setView);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const showToast = useAppStore((s) => s.showToast);

  const [input, setInput] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setInput("");
      setIdx(0);
    }
  }, [open]);

  const close = () => setPaletteOpen(false);

  const items = useMemo(() => {
    const s = input.trim().toLowerCase();
    const list = [];
    if (s) {
      list.push({
        k: "Create",
        label: `New: ${input.trim()}`,
        run: async () => {
          try {
            const task = await createTask({
              project_id: projects[0]?.id ?? null,
              title: input.trim(),
            });
            setSelectedTask(task.id);
          } catch (e) {
            showToast(e.message, true);
          }
        },
      });
    }
    projects
      .filter((p) => !s || p.name.toLowerCase().includes(s))
      .forEach((p) =>
        list.push({
          k: "Client",
          label: p.name,
          run: () => setView("project", p.id),
        })
      );
    tasks
      .filter((t) => s && t.title.toLowerCase().includes(s))
      .slice(0, 5)
      .forEach((t) =>
        list.push({
          k: "Task",
          label: t.title,
          run: () => setSelectedTask(t.id),
        })
      );
    return list;
  }, [input, projects, tasks, setView, setSelectedTask, showToast]);

  useEffect(() => {
    if (idx >= items.length) setIdx(0);
  }, [items.length, idx]);

  const runItem = (item) => {
    close();
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => Math.min(i + 1, items.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => Math.max(i - 1, 0));
    }
    if (e.key === "Enter" && items[idx]) {
      e.preventDefault();
      runItem(items[idx]);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="palette">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search or create a task"
          autoComplete="off"
        />
        <div className="pal-list">
          {items.length ? (
            items.map((it, i) => (
              <div
                key={i}
                className={`pal-item ${i === idx ? "on" : ""}`}
                onMouseEnter={() => setIdx(i)}
                onClick={() => runItem(it)}
              >
                <span className="k">{it.k}</span>
                <span>{it.label}</span>
              </div>
            ))
          ) : (
            <div className="pal-empty">No matches</div>
          )}
        </div>
      </div>
    </>
  );
}
