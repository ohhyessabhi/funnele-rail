import { useVisibleTasks } from "../hooks/useVisibleTasks";
import { TaskList } from "../components/TaskList";

export function MyWork() {
  const tasks = useVisibleTasks();

  if (!tasks.length) {
    return (
      <div className="empty">
        <strong>No tasks assigned</strong>
        <div className="hint">
          You’re all caught up, or your team hasn’t assigned any work yet
        </div>
      </div>
    );
  }
  return <TaskList tasks={tasks} grouped />;
}
