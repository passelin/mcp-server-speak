// Setup file for Jest
// If running in a CI environment, automatically mock the 'say' module

if (process.env.CI === "true" || process.env.MOCK_TTS === "true") {
  console.log("Running in CI environment, mocking TTS module");
  jest.mock("say");
} else {
  console.log("Running in normal environment, using real TTS module");
}
