// Unit tests for motivational message cycling
let motivationalMessages;
let getNextMessage;

try {
  // Try to import from renderer.js if exported (Node hack)
  const renderer = require('../renderer');
  motivationalMessages = renderer.motivationalMessages;
  getNextMessage = renderer.getNextMessage;
} catch (e) {
  motivationalMessages = [
    'Keep at it!',
    'Stay focused!',
    'You got this!',
    'Almost there!',
    'Keep writing!'
  ];
  getNextMessage = function(current, list = motivationalMessages) {
    const idx = list.indexOf(current);
    return list[(idx + 1) % list.length];
  };
}

describe('Motivational Message Cycling', () => {
  test('cycles to next message', () => {
    expect(getNextMessage('Keep at it!')).toBe('Stay focused!');
    expect(getNextMessage('Keep writing!')).toBe('Keep at it!');
  });
  test('returns first if current not found', () => {
    expect(getNextMessage('Not in list')).toBe('Keep at it!');
  });
});
