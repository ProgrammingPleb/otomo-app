// Background task setup may never be initialized if paired with a UI page
// thus, the task may never defined with expo-task-manager listener not being
// registered and cause a hang after a reboot session with no app launches
// which in turn causes the Android JobScheduler to limit the task.
// Ref: 3 regular timeouts in 24 hours is the JobScheduler's quota.
// This is to ensure that the worker is registered on headless runs and avoids
// the task definition skip.
// TODO: Check if there are any fixes for this particular issue.
import "./src/workers/background";
// Leave this comment in as formatters may redo the order
// ! The line above must always be first regardless
import "expo-router/entry";

