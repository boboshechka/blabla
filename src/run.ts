import Executor, { ICompletedTasksCollection, IExecutor, PerformanceReport } from './Executor';
import ITask from './Task';

export default async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0): Promise<{
    completed: ICompletedTasksCollection
    performance: PerformanceReport
}> {
    maxThreads = Math.max(0, maxThreads);

    executor = new Executor();
    executor.start();

    /**
     * Код надо писать сюда
     * Тут что-то вызываем в правильном порядке executor.executeTask для тасков из очереди queue
     */

    let runningPromises: Promise<void>[] = [];
    const currentQueue = [...queue];

    while (currentQueue.length > 0) {
        let qId = 0;
        while (qId < currentQueue.length) {
            const task = currentQueue[qId];

            // Если превышено количество тредов
            if (maxThreads > 0 && runningPromises.length >= maxThreads) {
                break;
            }

            // Если задача уже запущена для этого id
            if (executor.executeData.running[task.targetId]) {
                // Переходим к следующей задаче
                qId++;
            }
            else {
                // Запустить задачу
                currentQueue.splice(qId, 1);
                const promise = executor.executeTask(task).then(() => {
                    // Задача выполнена, удалить из списка
                    runningPromises = runningPromises.filter(p => p !== promise);
                });
                runningPromises.push(promise);
            }
        }

        // Ждём, пока завершится хотя бы одна задача
        await Promise.race(runningPromises);
    }

    // Дождаться завершения оставшихся задач
    await Promise.all(runningPromises);

    /**
     * Конец реализации
     */

    executor.stop();
    return {
        completed: executor.executeData.completed,
        performance: executor.performanceReport,
    };
}
