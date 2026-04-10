import { Tasks } from './tasks.service';

describe('Tasks', () => {
  let tasks: Tasks;

  beforeEach(() => {
    tasks = new Tasks();
  });

  it('should be created', () => {
    expect(tasks).toBeTruthy();
  });

  it('registers a task and reflects it in isOngoing and numOngoing', () => {
    tasks.register('myTask', 'doing something');
    expect(tasks.isOngoing('myTask')).toBeTrue();
    expect(tasks.numOngoing()).toBe(1);
  });

  it('deregisters a task and removes it', () => {
    tasks.register('myTask', 'doing something');
    tasks.deregister('myTask');
    expect(tasks.isOngoing('myTask')).toBeFalse();
    expect(tasks.numOngoing()).toBe(0);
  });

  it('resets hidden to false when all tasks are deregistered', () => {
    tasks.register('myTask', 'doing something');
    tasks.hide();
    tasks.deregister('myTask');
    expect(tasks.hidden).toBeFalse();
  });

  it('keeps hidden true when deregistering a task but others remain', () => {
    tasks.register('task1', 'first');
    tasks.register('task2', 'second');
    tasks.hide();
    tasks.deregister('task1');
    expect(tasks.hidden).toBeTrue();
  });

  it('emits updated task list via tasks$ when registering', done => {
    tasks.tasks$.subscribe(list => {
      if (list['myTask']) {
        expect(list['myTask']).toBe('doing something');
        done();
      }
    });
    tasks.register('myTask', 'doing something');
  });

  it('hide and unhide toggle the hidden flag', () => {
    tasks.hide();
    expect(tasks.hidden).toBeTrue();
    tasks.unhide();
    expect(tasks.hidden).toBeFalse();
  });

  it('isOngoing returns false for an unregistered task', () => {
    expect(tasks.isOngoing('nonexistent')).toBeFalse();
  });
});
