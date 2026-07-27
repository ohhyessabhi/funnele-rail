import { useVisibleTasks } from "../hooks/useVisibleTasks";
import { TaskList } from "../components/TaskList";

export function Project() {
  const tasks = useVisibleTasks();

  if (!tasks.length) {
    return (
      <div className="empty">
        <strong>No tasks in this client</strong>
      </div>
    );
  }
  return <TaskList tasks={tasks} grouped={false} />;
}
