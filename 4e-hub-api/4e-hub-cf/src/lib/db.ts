// Turso HTTP API v2 client — no external dependencies, works in any edge runtime.

type TursoArgValue = string | number | null;

type TursoWireArg =
	| { type: 'text'; value: string }
	| { type: 'integer'; value: string } // integers are strings in the wire format
	| { type: 'float'; value: number }
	| { type: 'null' };

type TursoWireValue =
	| { type: 'text'; value: string }
	| { type: 'integer'; value: string }
	| { type: 'float'; value: number }
	| { type: 'blob'; base64: string }
	| { type: 'null' };

interface TursoExecuteResult {
	cols: { name: string; decltype: string | null }[];
	rows: TursoWireValue[][];
	affected_row_count: number;
	last_insert_rowid: string | null;
}

interface TursoPipelineResponse {
	results: Array<
		| { type: 'ok'; response: { type: 'execute'; result: TursoExecuteResult } | { type: 'close' } }
		| { type: 'error'; error: { message: string } }
	>;
}

function encodeArg(v: TursoArgValue): TursoWireArg {
	if (v === null) return { type: 'null' };
	if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'float', value: String(v) } as TursoWireArg;
	return { type: 'text', value: v };
}

function decodeValue(v: TursoWireValue): string | number | null {
	switch (v.type) {
		case 'text': return v.value;
		case 'integer': return parseInt(v.value, 10);
		case 'float': return v.value;
		case 'null': return null;
		case 'blob': return v.base64;
	}
}

export type Row = Record<string, string | number | null>;

export class TursoClient {
	private baseUrl: string;
	private token: string;

	constructor(url: string, token: string) {
		// Accept libsql:// or https:// URLs
		this.baseUrl = url.replace(/^libsql:\/\//, 'https://');
		this.token = token;
	}

	async execute(sql: string, args: TursoArgValue[] = []): Promise<{ rows: Row[]; affectedRows: number }> {
		const body = {
			requests: [
				{ type: 'execute', stmt: { sql, args: args.map(encodeArg) } },
				{ type: 'close' },
			],
		};

		const res = await fetch(`${this.baseUrl}/v2/pipeline`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Turso HTTP ${res.status}: ${text}`);
		}

		const data = (await res.json()) as TursoPipelineResponse;
		const first = data.results[0];

		if (first.type === 'error') throw new Error(`Turso query error: ${first.error.message}`);
		if (first.type !== 'ok' || first.response.type !== 'execute') throw new Error('Unexpected Turso response shape');

		const { cols, rows, affected_row_count } = first.response.result;
		const parsed = rows.map((row) => Object.fromEntries(cols.map((col, i) => [col.name, decodeValue(row[i])])));

		return { rows: parsed, affectedRows: affected_row_count };
	}

	/** Execute multiple statements atomically inside a BEGIN/COMMIT transaction. */
	async batch(stmts: { sql: string; args?: TursoArgValue[] }[]): Promise<void> {
		const requests: object[] = [
			{ type: 'execute', stmt: { sql: 'BEGIN', args: [] } },
			...stmts.map(s => ({ type: 'execute', stmt: { sql: s.sql, args: (s.args ?? []).map(encodeArg) } })),
			{ type: 'execute', stmt: { sql: 'COMMIT', args: [] } },
			{ type: 'close' },
		];

		const res = await fetch(`${this.baseUrl}/v2/pipeline`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ requests }),
		});

		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Turso HTTP ${res.status}: ${text}`);
		}

		const data = (await res.json()) as TursoPipelineResponse;
		for (const result of data.results) {
			if (result.type === 'error') throw new Error(`Turso batch error: ${result.error.message}`);
		}
	}
}

export function getTursoClient(env: Env): TursoClient {
	return new TursoClient(env.TURSO_URL, env.TURSO_AUTH_TOKEN);
}
