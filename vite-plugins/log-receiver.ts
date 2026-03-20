import type { Plugin } from 'vite';
import type { LogEntry, LogLevel } from '../src/utils/logger.types';

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  debug: '\x1b[36m',  // cyan
  info: '\x1b[32m',   // green
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
} as const;

const colorForLevel = (level: LogLevel): string => ANSI[level];

const formatEntry = (entry: LogEntry): string => {
  const color = colorForLevel(entry.level);
  const level = `${color}${ANSI.bold}[${entry.level.toUpperCase()}]${ANSI.reset}`;
  const scope = `${ANSI.dim}[${entry.scope}]${ANSI.reset}`;
  const duration =
    typeof entry.durationMs === 'number'
      ? ` ${ANSI.dim}(${entry.durationMs.toFixed(1)}ms)${ANSI.reset}`
      : '';
  const tags =
    entry.tags.length > 0 ? ` ${ANSI.dim}tags=${entry.tags.join(',')}${ANSI.reset}` : '';

  let line = `${level} ${scope} ${entry.event}${duration}${tags}`;

  if (entry.context) {
    line += `\n    ${ANSI.dim}${JSON.stringify(entry.context)}${ANSI.reset}`;
  }
  if (entry.error) {
    line += `\n    ${ANSI.error}${entry.error.name}: ${entry.error.message}${ANSI.reset}`;
    if (entry.error.stack) {
      const stackLines = entry.error.stack.split('\n').slice(1, 4).join('\n    ');
      line += `\n    ${ANSI.dim}${stackLines}${ANSI.reset}`;
    }
  }

  return line;
};

export function logReceiverPlugin(): Plugin {
  return {
    name: 'log-receiver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/dev-log', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const entry = JSON.parse(body) as LogEntry;
            process.stdout.write(formatEntry(entry) + '\n');
          } catch {
            // malformed payload — ignore
          }
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}
