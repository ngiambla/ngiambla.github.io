#!/usr/bin/env node
// Turns content/site.json into the plain-text files that live in the
// terminal's home directory. The same tree is later copied into the Linux
// image, so `ls`, `cat` and `less` work on it like any other files.
//
// Output:
//   generated/home/<handle>/...   real files (packed into the Linux image)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(join(root, "content/site.json"), "utf8"));
const p = site.profile;
const WIDTH = 72;

function wrap(text, indent = "") {
  const out = [];
  let line = indent;
  for (const word of text.split(/\s+/)) {
    if (line.trim() && (line + " " + word).length > WIDTH) {
      out.push(line);
      line = indent + word;
    } else {
      line = line.trim() ? line + " " + word : indent + word;
    }
  }
  if (line.trim()) out.push(line);
  return out.join("\n");
}
const rule = (c = "=") => c.repeat(WIDTH);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const files = {};
const add = (path, body) => (files[path] = body.replace(/\s+$/, "") + "\n");

// ---- about.txt -----------------------------------------------------------
add("about.txt", [
  p.name, `${p.title} · ${p.location}`, rule(), "",
  ...p.summary.map((s) => wrap(s) + "\n"),
  "Interests:", ...p.interests.map((i) => `  * ${i}`), "",
  `GitHub:   ${p.github}`, `Web:      ${p.site}`,
  `From:     ${p.hometown}`,
].join("\n"));

// ---- cv.txt --------------------------------------------------------------
const cv = [p.name, rule(), "", "EXPERIENCE", rule("-")];
for (const e of site.experience) {
  cv.push(`${e.org}, ${e.where}`, `  ${e.role}  (${e.when})`);
  for (const h of e.highlights) cv.push(wrap(h, "      ").replace(/^ {6}/, "    - "));
  cv.push("");
}
cv.push("EDUCATION", rule("-"));
for (const ed of site.education) {
  cv.push(`${ed.school} (${ed.when})`, `  ${ed.degree}`);
  if (ed.note) cv.push(wrap(ed.note, "  "));
  cv.push("");
}
cv.push("Full PDF: ~/cv.pdf");
add("cv.txt", cv.join("\n"));

// ---- papers/ -------------------------------------------------------------
const index = ["Publications", rule(), ""];
for (const pub of site.publications) {
  const name = `${pub.year}-${pub.id}.txt`;
  index.push(`${name.padEnd(30)} ${pub.title.slice(0, WIDTH - 31)}${pub.title.length > WIDTH - 31 ? "…" : ""}`);
  const body = [wrap(pub.title), rule("-"), "", wrap(`Authors: ${pub.authors}`), ""];
  body.push(`Year:    ${pub.year}`);
  if (pub.venue) body.push(`Venue:   ${pub.venue}`);
  if (pub.code) body.push(`Code:    ${pub.code}`);
  if (pub.bench) body.push(`Bench:   ${pub.bench}`);
  if (pub.abstract) body.push("", wrap(pub.abstract));
  add(`papers/${name}`, body.join("\n"));
}
add("papers/README", index.join("\n"));

// ---- projects/ -----------------------------------------------------------
for (const pr of site.projects) add(`projects/${slug(pr.name)}.txt`, `${pr.name}\n${rule("-")}\n${wrap(pr.about)}\n\n${pr.url}`);

// ---- README (motd) -------------------------------------------------------
add("hello.c", [
  "#include <stdio.h>",
  "",
  "int main(void) {",
  `    printf("Hello from ${p.handle}.github.io!\\n");`,
  "    return 0;",
  "}",
].join("\n"));

add("README", [
  `Welcome! I'm ${p.name.split(" ")[0]}, a ${p.title.toLowerCase()}.`,
  "",
  "  cat about.txt        who I am",
  "  cat cv.txt           experience and education",
  "  ls papers/           publications (cat any file)",
  "  ls projects/         things I've built",
  "  open vlang           open a project or paper's link in a new tab",
  "  explore              a first-person ASCII maze (source: ~/explore)",
  "  gcc hello.c          compile and run C",
  "  python3, htop, tmux  also installed",
  "",
  `Last updated ${site.updated}.`,
].join("\n"));

// ---- write ---------------------------------------------------------------
const outHome = join(root, "generated/home", p.handle);
rmSync(join(root, "generated"), { recursive: true, force: true });
for (const [rel, body] of Object.entries(files)) {
  const dest = join(outHome, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, body);
}
copyFileSync(join(root, "public/cv.pdf"), join(outHome, "cv.pdf"));
console.log(`content: wrote ${Object.keys(files).length} files to generated/home/${p.handle}`);
