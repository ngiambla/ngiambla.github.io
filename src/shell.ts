// A small shell over the generated home directory (public/home.json).
// Step 2 replaces this with a real Linux booted in the browser; until then it
// keeps the site usable and exercises the same content files.
import type { Terminal } from "@xterm/xterm";

interface Home { user: string; host: string; files: Record<string, string> }

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", green: "\x1b[1;32m", blue: "\x1b[1;34m",
  white: "\x1b[1;37m", red: "\x1b[1;31m", dim: "\x1b[2m",
};

export class Shell {
  private cwd = "";            // relative to ~
  private line = "";
  private cursor = 0;
  private history: string[] = [];
  private histIdx = 0;

  constructor(private term: Terminal, private home: Home) {}

  start(banner: string) {
    this.write(banner);
    this.run("cat README");
    this.prompt();
    this.term.onData((d) => this.onData(d));
  }

  // ---- filesystem helpers ------------------------------------------------
  private resolve(arg = ""): string | null {
    let parts = arg.startsWith("~") || arg.startsWith("/") ? [] : this.cwd.split("/").filter(Boolean);
    for (const seg of arg.replace(/^~\/?|^\/+/, "").split("/")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") parts.pop(); else parts.push(seg);
    }
    return parts.join("/");
  }
  private isDir(path: string) {
    return path === "" || Object.keys(this.home.files).some((f) => f.startsWith(path + "/"));
  }
  private list(dir: string): string[] {
    const pre = dir ? dir + "/" : "";
    const names = new Set<string>();
    for (const f of Object.keys(this.home.files)) {
      if (!f.startsWith(pre)) continue;
      const rest = f.slice(pre.length);
      names.add(rest.includes("/") ? rest.split("/")[0] + "/" : rest);
    }
    if (!dir) names.add("cv.pdf");
    return [...names].sort();
  }

  // ---- commands ----------------------------------------------------------
  private commands: Record<string, [string, (args: string[]) => void]> = {
    help: ["list commands", () => {
      this.println("Commands:");
      for (const [name, [desc]] of Object.entries(this.commands)) this.println(`  ${C.white}${name.padEnd(8)}${C.reset} ${desc}`);
    }],
    ls: ["list files", (a) => {
      const path = this.resolve(a[0]);
      if (path === null || !this.isDir(path)) return this.err(`ls: ${a[0]}: No such directory`);
      this.println(this.list(path).map((n) => (n.endsWith("/") ? C.blue + n + C.reset : n)).join("  "));
    }],
    cd: ["change directory", (a) => {
      const path = this.resolve(a[0] ?? "~");
      if (path === null || !this.isDir(path)) return this.err(`cd: ${a[0]}: No such directory`);
      this.cwd = path;
    }],
    pwd: ["print working directory", () => this.println(`/home/${this.home.user}${this.cwd ? "/" + this.cwd : ""}`)],
    cat: ["print a file", (a) => {
      if (!a.length) return this.err("usage: cat FILE");
      for (const f of a) {
        const path = this.resolve(f);
        if (path === "cv.pdf") { this.println("cv.pdf is a PDF; try `open cv.pdf`."); continue; }
        const body = path !== null ? this.home.files[path] : undefined;
        if (body === undefined) this.err(`cat: ${f}: ${path !== null && this.isDir(path) ? "Is a directory" : "No such file"}`);
        else this.write(body);
      }
    }],
    open: ["open a link, paper's code, or cv.pdf", (a) => {
      const path = this.resolve(a[0] ?? "");
      if (path === "cv.pdf") { window.open("/cv.pdf", "_blank"); return; }
      const body = path !== null ? this.home.files[path] ?? this.home.files[path + ".txt"] ?? this.home.files[`projects/${a[0]}.txt`] : undefined;
      const url = body?.match(/https?:\/\/\S+/)?.[0];
      if (!url) return this.err(`open: nothing to open for ${a[0] ?? "(none)"}`);
      this.println(`opening ${url}`);
      window.open(url, "_blank", "noopener");
    }],
    whoami: ["who am I?", () => this.run("cat about.txt")],
    clear: ["clear the screen", () => this.term.clear()],
    exit: ["leave for GitHub", () => { location.href = "https://github.com/ngiambla"; }],
  };

  run(input: string) {
    const [cmd, ...args] = input.trim().split(/\s+/);
    if (!cmd) return;
    const entry = this.commands[cmd];
    if (entry) entry[1](args);
    else this.err(`${cmd}: command not found (try ${C.white}help${C.reset}${C.red})`);
  }

  // ---- line editing ------------------------------------------------------
  private promptText() {
    const dir = "~" + (this.cwd ? "/" + this.cwd : "");
    return `${C.green}${this.home.user}@${this.home.host}${C.reset}:${C.blue}${dir}${C.reset}$ `;
  }
  private prompt() { this.term.write(this.promptText()); }
  private redraw() {
    this.term.write("\r\x1b[K" + this.promptText() + this.line);
    const back = this.line.length - this.cursor;
    if (back > 0) this.term.write(`\x1b[${back}D`);
  }
  private onData(data: string) {
    switch (data) {
      case "\r": {
        this.term.write("\r\n");
        const input = this.line;
        if (input.trim()) { this.history.push(input); }
        this.histIdx = this.history.length;
        this.line = ""; this.cursor = 0;
        this.run(input);
        this.prompt();
        return;
      }
      case "\x7f":
        if (this.cursor > 0) { this.line = this.line.slice(0, this.cursor - 1) + this.line.slice(this.cursor); this.cursor--; }
        break;
      case "\x1b[A": if (this.histIdx > 0) { this.line = this.history[--this.histIdx]; this.cursor = this.line.length; } break;
      case "\x1b[B":
        if (this.histIdx < this.history.length) { this.histIdx++; this.line = this.history[this.histIdx] ?? ""; this.cursor = this.line.length; }
        break;
      case "\x1b[D": if (this.cursor > 0) this.cursor--; break;
      case "\x1b[C": if (this.cursor < this.line.length) this.cursor++; break;
      case "\x03": this.term.write("^C\r\n"); this.line = ""; this.cursor = 0; this.prompt(); return;
      case "\x0c": this.term.clear(); break;
      case "\t": this.complete(); break;
      default:
        if (data.startsWith("\x1b")) return;
        const clean = data.replace(/[\x00-\x1f]/g, "");
        this.line = this.line.slice(0, this.cursor) + clean + this.line.slice(this.cursor);
        this.cursor += clean.length;
    }
    this.redraw();
  }
  private complete() {
    const before = this.line.slice(0, this.cursor);
    const words = before.split(/\s+/);
    const word = words[words.length - 1];
    let options: string[];
    if (words.length === 1) options = Object.keys(this.commands).filter((c) => c.startsWith(word));
    else {
      const slash = word.lastIndexOf("/");
      const dirPart = slash >= 0 ? word.slice(0, slash + 1) : "";
      const dir = this.resolve(dirPart);
      if (dir === null || !this.isDir(dir)) return;
      options = this.list(dir).filter((n) => n.startsWith(word.slice(dirPart.length))).map((n) => dirPart + n);
    }
    if (options.length === 1) {
      const add = options[0].slice(word.length) + (options[0].endsWith("/") ? "" : " ");
      this.line = before + add + this.line.slice(this.cursor);
      this.cursor += add.length;
    } else if (options.length > 1) {
      this.term.write("\r\n" + options.join("  ") + "\r\n");
    }
  }

  private write(s: string) { this.term.write(s.replace(/\r?\n/g, "\r\n")); }
  private println(s = "") { this.write(s + "\n"); }
  private err(s: string) { this.println(C.red + s + C.reset); }
}
