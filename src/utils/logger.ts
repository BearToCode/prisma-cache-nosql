import chalk, { ChalkInstance } from 'chalk';

export type LogLevel = 'log' | 'warn' | 'error';

const Gray = chalk.hex('#333333');
const Green = chalk.hex('#57F2A5');
const Red = chalk.hex('#F93131');
const Orange = chalk.hex('#FDA12E');
const DarkGray = chalk.hex('#42454b');

export class Logger {
	private _module: string | undefined;
	constructor(public readonly logLevel: LogLevel = 'warn') {}

	public module(name: string) {
		const logger = new Logger(this.logLevel);
		logger._module = name;
		return logger;
	}

	/**
	 * Log a message to stdout
	 * @param message The message to log
	 */
	public log(...args: unknown[]): void {
		if (this.logLevel === 'log') {
			this.write({
				type: 'log',
				color: Green,
				args,
				method: console.log
			});
		}
	}

	/**
	 * Log a warning to stderr
	 * @param message The message to log
	 */
	public warn(...args: unknown[]): void {
		if (this.logLevel === 'log' || this.logLevel === 'warn') {
			this.write({
				type: 'warn',
				color: Orange,
				args,
				method: console.warn
			});
		}
	}

	/**
	 * Log an error to stderr
	 * @param message The message to log
	 */
	public error(...args: unknown[]): void {
		if (this.logLevel === 'log' || this.logLevel === 'warn' || this.logLevel === 'error') {
			this.write({
				type: 'error',
				color: Red,
				args,
				method: console.error
			});
		}
	}

	private write({
		type,
		color,
		args,
		method
	}: {
		type: string;
		color: ChalkInstance;
		args: unknown[];
		method: (...args: unknown[]) => void;
	}) {
		const prefix = this._module
			? `${DarkGray('prisma-cache')} [${color.bold(type)}] ` + `<${Gray.italic(this._module)}>`
			: `${DarkGray('prisma-cache')} [${color.bold(type)}]`;

		method(prefix, ...args);
	}
}
