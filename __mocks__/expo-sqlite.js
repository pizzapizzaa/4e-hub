// Manual mock for expo-sqlite — in-memory stub for unit tests
const mockDb = {
  execAsync: jest.fn(() => Promise.resolve()),
  getAllAsync: jest.fn(() => Promise.resolve([])),
  runAsync: jest.fn(() => Promise.resolve()),
  closeAsync: jest.fn(() => Promise.resolve()),
};

module.exports = {
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
  _mockDb: mockDb, // exposed so tests can inspect calls
};
