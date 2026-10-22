// D1-shaped wrapper over any libSQL client, so the game's query code stays unchanged.
// Kept free of the native Node client so the Vercel function can use the HTTP-only one.
const plain = rs => rs.rows.map(row => Object.fromEntries(rs.columns.map(c => [c, typeof row[c] === 'bigint' ? Number(row[c]) : row[c]])));

class Stmt {
  constructor(client, sql, args = []) { this.client = client; this.sql = sql; this.args = args; }
  bind(...args) { return new Stmt(this.client, this.sql, args); }
  async first() { return plain(await this.client.execute({ sql: this.sql, args: this.args }))[0] ?? null; }
  async all() { return { results: plain(await this.client.execute({ sql: this.sql, args: this.args })) }; }
  async run() { const rs = await this.client.execute({ sql: this.sql, args: this.args }); return { success: true, meta: { changes: rs.rowsAffected } }; }
}

export function wrapClient(client) {
  return {
    prepare: sql => new Stmt(client, sql),
    // Runs in order inside one write transaction; any failure rolls back all of it.
    batch: async stmts => (await client.batch(stmts.map(s => ({ sql: s.sql, args: s.args })), 'write')).map(rs => ({ success: true, meta: { changes: rs.rowsAffected }, results: plain(rs) })),
    exec: sql => client.executeMultiple(sql),
    close: () => client.close(),
  };
}

