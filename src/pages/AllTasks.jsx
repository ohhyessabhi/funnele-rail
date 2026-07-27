import { useVisibleTasks } from "../hooks/useVisibleTasks";
import { TaskList } from "../components/TaskList";

export function AllTasks() {
  const tasks = useVisibleTasks();

  if (!tasks.length) {
    return (
      <div className="empty">
        <strong>No tasks</strong>
        <div className="hint">Create a task or accept one from the inbox</div>
      </div>
    );
  }
  return <TaskList tasks={tasks} grouped showTotal />;
}
