// Boots Alpine Linux (i386, under the v86 emulator) into an xterm.js
// terminal. The first visit is a cold boot; after that the machine is
// snapshotted into IndexedDB and resumed on later visits until the visitor
// runs `reboot` or clears site data.
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SerializeAddon } from "@xterm/addon-serialize";
import { V86 } from "v86";
import wasmUrl from "v86/build/v86.wasm?url";
import "@xterm/xterm/css/xterm.css";
import "./crt.css";
import * as state from "./state";

const MEMORY = 128 * 1024 * 1024;
const AUTOSAVE_MS = 30_000;
const PROMPT_MARK = "ngiambla@";      // the shell prompt: login is done
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const term = new Terminal({
  fontFamily: '"Ubuntu Mono", monospace',
  fontSize: 17,
  cursorBlink: true,
  allowTransparency: true,
  scrollback: 5000,
  theme: { background: "#00000000", foreground: "#c8f7d8", cursor: "#66ff66", green: "#66ff66", brightGreen: "#66ff66", blue: "#1e90ff", brightBlue: "#4aa8ff" },
});
const fit = new FitAddon();
const serializer = new SerializeAddon();
term.loadAddon(fit);
term.loadAddon(serializer);

async function main() {
  // Load the webfont before xterm measures its cells, or the grid comes out
  // sized for the fallback font and leaves an empty strip on the right.
  await Promise.all([document.fonts.load('17px "Ubuntu Mono"'), document.fonts.load('bold 17px "Ubuntu Mono"')]).catch(() => {});
  term.open(document.getElementById("term")!);
  fit.fit();
  term.focus();

  const image = (await (await fetch("/linux/version.txt", { cache: "no-cache" })).text()).trim();
  let saved = await state.load();
  if (saved && saved.image !== image) {
    term.writeln(dim("The site's Linux image was updated since your last visit, so this is a fresh boot."));
    await state.clear();
    saved = undefined;
  }

  let initial_state: { buffer: ArrayBuffer } | undefined;
  if (saved) {
    term.write(saved.screen);
    initial_state = { buffer: await state.gunzip(saved.machine) };
  } else {
    term.writeln(dim("Booting Alpine Linux (i386) with v86. The first boot takes a little while;"));
    term.writeln(dim("after that this machine is saved here and resumes instantly. Type `reboot` to start over.\r\n"));
  }

  const emulator = new V86({
    wasm_path: wasmUrl,
    memory_size: MEMORY,
    vga_memory_size: 2 * 1024 * 1024,
    bios: { url: "/bios/seabios.bin" },
    vga_bios: { url: "/bios/vgabios.bin" },
    filesystem: { baseurl: "/linux/flat/", basefs: "/linux/fs.json" },
    bzimage_initrd_from_filesystem: true,
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_free=on console=ttyS0",
    uart1: true,
    // Networking through the browser: the guest's plain-HTTP requests become
    // fetch() calls (made over HTTPS), so only CORS-enabled sites answer.
    net_device: { type: "virtio", relay_url: "fetch" },
    preserve_mac_from_state_image: true,
    disable_keyboard: true,
    disable_mouse: true,
    disable_speaker: true,
    autostart: true,
    initial_state,
  } as ConstructorParameters<typeof V86>[0]);

  // ---- console: serial0 <-> xterm ------------------------------------------
  let shellUp = !!saved, dirty = false, pending: number[] = [], tail = "";
  const flush = () => {
    if (!pending.length) return;
    const bytes = new Uint8Array(pending);
    pending = [];
    term.write(bytes);
  };
  emulator.add_listener("serial0-output-byte", (b: number) => {
    if (!pending.length) requestAnimationFrame(flush);
    pending.push(b);
    dirty = true;
    if (!shellUp) {
      tail = (tail + String.fromCharCode(b)).slice(-64);
      if (tail.includes(PROMPT_MARK)) {
        shellUp = true;
        // The resize listener in the guest may still be starting: say it a few times.
        for (const ms of [0, 2000, 6000]) setTimeout(sendSize, ms);
        scheduleSave(5000);
      }
    }
  });
  const enc = new TextEncoder();
  term.onData((d) => { emulator.serial_send_bytes(0, enc.encode(d)); dirty = true; });
  term.onBinary((d) => emulator.serial_send_bytes(0, Uint8Array.from(d, (c) => c.charCodeAt(0))));

  // ---- control channel: serial1 (resize in; OPEN/REBOOT out) ---------------
  const sendSize = () => emulator.serial_send_bytes(1, enc.encode(`${term.rows} ${term.cols}\n`));
  addEventListener("resize", () => { fit.fit(); if (shellUp) sendSize(); });
  let ctl = "";
  emulator.add_listener("serial1-output-byte", (b: number) => {
    const c = String.fromCharCode(b);
    if (c !== "\n") { ctl += c; return; }
    const [cmd, ...rest] = ctl.trim().split(" ");
    ctl = "";
    if (cmd === "OPEN") window.open(rest.join(" "), "_blank", "noopener");
    if (cmd === "REBOOT") reboot();
  });

  // ---- saving ----------------------------------------------------------------
  let saving = false, rebooting = false, timer = 0;
  async function persist() {
    if (saving || rebooting || !shellUp || !dirty) return;
    saving = true;
    dirty = false;
    try {
      const machine = await state.gzip(await emulator.save_state());
      if (!rebooting) await state.save({ image, machine, screen: serializer.serialize({ scrollback: 500 }), savedAt: Date.now() });
    } catch (e) {
      console.warn("could not save machine state", e);
      dirty = true;
    } finally {
      saving = false;
    }
  }
  function scheduleSave(ms = AUTOSAVE_MS) { clearTimeout(timer); timer = window.setTimeout(() => { persist(); scheduleSave(); }, ms); }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") persist(); });

  async function reboot() {
    rebooting = true;
    emulator.stop();
    await state.clear();
    location.reload();
  }

  if (saved) {
    emulator.add_listener("emulator-started", () => { sendSize(); scheduleSave(); });
  } else {
    emulator.add_listener("download-progress", (e: { file_name: string; loaded: number; total: number; lengthComputable: boolean }) => {
      if (e.lengthComputable && e.total > 1 << 20) {
        term.write(`\r${dim(`fetching ${e.file_name.split("/").pop()} ${Math.round((100 * e.loaded) / e.total)}%`)}\x1b[K`);
      }
    });
  }
  Object.assign(window, { emulator }); // handy from the devtools console
}

main().catch((e) => term.writeln(`\x1b[1;31mCould not start Linux: ${e}\x1b[0m`));
