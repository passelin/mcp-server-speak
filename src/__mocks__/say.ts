export default {
  speak: (
    text: string,
    voice?: string,
    speed?: number,
    callback?: (err: Error | null) => void
  ) => {
    // Mock implementation that immediately "succeeds"
    console.log(
      `[MOCK] Speaking: "${text}" with voice "${voice || "default"}" at speed ${speed || 1.0}`
    );
    if (callback) {
      callback(null);
    }
  },
  stop: () => {
    console.log("[MOCK] Speech stopped");
  },
};
