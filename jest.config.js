module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  roots: [
    './test',
  ],
  globals: {
    'ts-jest': {
      astTransformers: ['ts-nameof']
    },
  },
};
