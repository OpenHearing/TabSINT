import { choiceBtnClassHelper } from '../response-area-helper-functions';
import { ChoiceInterface } from '../../interfaces/choice.interface';

const choice = (overrides: Partial<ChoiceInterface> = {}): ChoiceInterface => ({ id: 'a', text: 'A', correct: false, ...overrides });

describe('choiceBtnClassHelper', () => {
  it('includes btn-default when no special options are set', () => {
    const cls = choiceBtnClassHelper(choice(), { selected: [] });
    expect(cls).toContain('btn-default');
  });

  it('adds active class when the choice is selected (default scheme)', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['a'] });
    expect(cls).toContain('active');
  });

  it('does not add active class when choice is not selected', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['b'] });
    expect(cls).not.toContain('active');
  });

  it('markIncorrect scheme: selected choice gets btn-danger', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['a'] }, { buttonScheme: 'markIncorrect' });
    expect(cls).toContain('btn-danger');
  });

  it('markIncorrect scheme: non-selected choice gets btn-success', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['b'] }, { buttonScheme: 'markIncorrect' });
    expect(cls).toContain('btn-success');
  });

  it('markCorrect scheme: selected choice gets btn-success', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['a'] }, { buttonScheme: 'markCorrect' });
    expect(cls).toContain('btn-success');
  });

  it('markCorrect scheme: non-selected choice gets btn-danger', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: ['b'] }, { buttonScheme: 'markCorrect' });
    expect(cls).toContain('btn-danger');
  });

  it('gradeResponse feedback disables buttons', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a' }), { selected: [] }, { feedback: 'gradeResponse' });
    expect(cls).toContain('btn-disabled');
  });

  it('gradeResponse feedback marks correct selection as btn-success', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a', correct: true }), { selected: ['a'] }, { feedback: 'gradeResponse' });
    expect(cls).toContain('btn-success');
  });

  it('gradeResponse feedback marks incorrect selection as btn-danger', () => {
    const cls = choiceBtnClassHelper(choice({ id: 'a', correct: false }), { selected: ['a'] }, { feedback: 'gradeResponse' });
    expect(cls).toContain('btn-danger');
  });
});
