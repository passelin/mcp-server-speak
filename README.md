# @passelin/mcp-server-speak

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server that provides the ability to speak text using the operating system's text-to-speech engine.

## Features

- Converts text to speech using the system's native text-to-speech capabilities (uses the `say` package)
- Supports customizable voices (ones available on your system)
- Adjustable speech speed
- Ability to stop speech mid-playback

## Usage

### Starting the Server

Start the MCP server:

```bash
npx @passelin/mcp-server-speak
```

This MCP server uses the `stdio` transport, which means it will read from standard input and write to standard output. You can interact with it using JSON-RPC messages.

## API

This MCP server provides the following tools:

### 1. `speak`

Speaks the provided text using the system's text-to-speech engine.

Parameters:

- `text` (string, required): The text to speak
- `voice` (string, optional): Optional voice to use for speech (depends on available system voices)
- `speed` (number, optional): Speed of speech (defaults to 1.0)

Example request:

```json
{
  "jsonrpc": "2.0",
  "id": "123",
  "method": "tools/call",
  "params": {
    "name": "speak",
    "arguments": {
      "text": "Hello! This is a test message.",
      "voice": "Alex",
      "speed": 1.2
    }
  }
}
```

### 2. `stop`

Stops any ongoing speech.

Parameters: None

Example request:

```json
{
  "jsonrpc": "2.0",
  "id": "456",
  "method": "tools/call",
  "params": {
    "name": "stop",
    "arguments": {}
  }
}
```

## Running Tests

To run tests:

```bash
npm test
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Release Management

This package uses [Semantic Versioning](https://semver.org/). To create a new release:

1. Make sure all your changes follow [Conventional Commits](https://www.conventionalcommits.org/) format:

   - `feat: add new feature` (minor version bump)
   - `fix: resolve issue` (patch version bump)
   - `feat!: breaking change` or `BREAKING CHANGE: description` (major version bump)

   You can use the helper command to create properly formatted commits:

   ```bash
   npm run commit
   ```

2. Use the npm version command to bump the version:

   ```bash
   npm version patch # for bug fixes (1.0.0 -> 1.0.1)
   npm version minor # for new features (1.0.0 -> 1.1.0)
   npm version major # for breaking changes (1.0.0 -> 2.0.0)
   ```

3. The version command will:

   - Update the package.json version
   - Automatically update CHANGELOG.md based on your commits
   - Create a git tag for the version
   - Commit these changes

4. Push the changes and tag to GitHub:

   ```bash
   git push && git push --tags
   ```

5. Create a GitHub release based on the new tag to trigger the publish workflow

## Dependencies

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk): Model Context Protocol SDK
- [say](https://www.npmjs.com/package/say): A simple text-to-speech library for Node.js
- [zod](https://www.npmjs.com/package/zod): TypeScript-first schema validation library

## License

This project is licensed under the MIT License.
