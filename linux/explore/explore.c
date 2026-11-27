/*
 * explore: walk around a wafer-scale chip, rendered in ASCII.
 *
 * A classic grid raycaster (one ray per terminal column) drawn with
 * ANSI escape codes. Walls are shaded by distance, the floor and ceiling
 * fade into the dark, and a minimap sits in the corner.
 *
 * Scattered across the wafer are glowing cores ('P' on the map). Each one
 * holds a paper; walk onto it to read the title. Find them all.
 *
 *   W/S or Up/Down     move        A/D or Left/Right   turn
 *   Q/E                strafe      M                   toggle map
 *   X or Ctrl-C        quit
 *
 * Build it yourself:   cd ~/explore && gcc -O2 -o explore explore.c -lm
 */
#define _DEFAULT_SOURCE
#include <math.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <sys/select.h>
#include <sys/time.h>
#include <termios.h>
#include <time.h>
#include <unistd.h>

#define MAP_W 32
#define MAP_H 32

/* '#' wafer edge, 'C' compute core block, 'R' router block, '.' fabric,
 * 'P' paper core (walkable), '@' start. Generated at startup. */
static char map[MAP_H][MAP_W + 1];

static const char *papers[] = {
    "2026  Beyond Exascale: Dataflow Domain Translation on a Cerebras Cluster",
    "2025  Evaluating Training Acceleration through Selective Workload Skipping",
    "2024  Towards Higher First Silicon Success via Improved FSM Detection",
    "2021  vlang: Mapping Verilog Netlists to Modern Technologies",
    "2019  ASAP: Automatic Sizing and Partitioning for Dynamic Memory Heaps in HLS",
    "2019  A Dynamic Memory Allocation Library for High-Level Synthesis",
    "2017  Keyword and Keyphrase Extraction Using Newton's Law of Gravitation",
};
#define NPAPERS (int)(sizeof papers / sizeof *papers)
static int paper_x[NPAPERS], paper_y[NPAPERS], found[NPAPERS];
static int nfound;

static double px, py, dir;        /* player position and heading (radians) */
static int rows = 24, cols = 80, show_map = 1;
static volatile sig_atomic_t resized = 1, quit;
static struct termios saved;
static char *frame;
static size_t frame_len, frame_cap;
static const char *message = "Find the 7 paper cores (P on the map).";
static double message_until;

/* ---- terminal --------------------------------------------------------- */
static void restore(void)
{
    tcsetattr(0, TCSAFLUSH, &saved);
    fputs("\x1b[0m\x1b[2J\x1b[H\x1b[?25h\x1b[?1049l", stdout);
    fflush(stdout);
}
static void on_signal(int s) { if (s == SIGWINCH) resized = 1; else quit = 1; }
static void raw_mode(void)
{
    struct termios t;
    tcgetattr(0, &saved);
    atexit(restore);
    t = saved;
    t.c_lflag &= ~(ICANON | ECHO | ISIG);
    t.c_iflag &= ~(IXON | ICRNL);
    t.c_cc[VMIN] = 0;
    t.c_cc[VTIME] = 0;
    tcsetattr(0, TCSAFLUSH, &t);
    fputs("\x1b[?1049h\x1b[?25l\x1b[2J", stdout);
}
static double now(void)
{
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return tv.tv_sec + tv.tv_usec / 1e6;
}
static void out(const char *s, size_t n)
{
    if (frame_len + n > frame_cap) {
        frame_cap = (frame_len + n) * 2;
        frame = realloc(frame, frame_cap);
        if (!frame) exit(1);
    }
    memcpy(frame + frame_len, s, n);
    frame_len += n;
}
static void outs(const char *s) { out(s, strlen(s)); }

/* ---- world ------------------------------------------------------------ */
static unsigned rng = 0x5eed1234;
static unsigned rnd(void) { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return rng; }

static void build_wafer(void)
{
    double c = (MAP_W - 1) / 2.0, r = MAP_W / 2.0 - 1;
    for (int y = 0; y < MAP_H; y++) {
        for (int x = 0; x < MAP_W; x++) {
            double d = hypot(x - c, y - c);
            char ch = '.';
            if (d > r) ch = '#';                                   /* off-wafer */
            else if (x % 4 == 2 && y % 4 == 2) ch = (rnd() % 3) ? 'C' : 'R';
            else if (x % 4 == 2 && y % 4 == 3 && rnd() % 4 == 0) ch = 'C';
            map[y][x] = ch;
        }
        map[y][MAP_W] = 0;
    }
    for (int i = 0; i < NPAPERS; i++) {
        int x, y;
        do { x = rnd() % MAP_W; y = rnd() % MAP_H; }
        while (map[y][x] != '.' || hypot(x - c, y - c) < 3);
        map[y][x] = 'P';
        paper_x[i] = x; paper_y[i] = y;
    }
    px = c + 0.5; py = c + 0.5; dir = 0;
    map[(int)py][(int)px] = '.';
}
static int solid(int x, int y)
{
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 1;
    char ch = map[y][x];
    return ch == '#' || ch == 'C' || ch == 'R';
}

/* ---- rendering -------------------------------------------------------- */

static void render(void)
{
    int view_h = rows - 1;          /* last line is the status bar */
    double fov = 1.0;               /* ~57 degrees */
    double aspect = 0.5;            /* terminal cells are ~2x taller than wide */

    frame_len = 0;
    outs("\x1b[H");

    /* one ray per column */
    static double *dist; static char *kind; static int *side; static int cap;
    if (cap < cols) {
        cap = cols;
        dist = realloc(dist, cap * sizeof *dist);
        kind = realloc(kind, cap);
        side = realloc(side, cap * sizeof *side);
    }
    for (int x = 0; x < cols; x++) {
        double a = dir + (x / (double)cols - 0.5) * fov;
        double rx = cos(a), ry = sin(a);
        int mx = (int)px, my = (int)py, sx = rx < 0 ? -1 : 1, sy = ry < 0 ? -1 : 1, s = 0;
        double ddx = fabs(1 / (rx ? rx : 1e-9)), ddy = fabs(1 / (ry ? ry : 1e-9));
        double tx = (rx < 0 ? px - mx : mx + 1 - px) * ddx;
        double ty = (ry < 0 ? py - my : my + 1 - py) * ddy;
        for (int i = 0; i < 64 && !solid(mx, my); i++) {
            if (tx < ty) { tx += ddx; mx += sx; s = 0; }
            else         { ty += ddy; my += sy; s = 1; }
        }
        double d = (s == 0 ? tx - ddx : ty - ddy) * cos(a - dir);
        dist[x] = d < 0.05 ? 0.05 : d;
        kind[x] = (mx >= 0 && my >= 0 && mx < MAP_W && my < MAP_H) ? map[my][mx] : '#';
        side[x] = s;
    }

    int cur = -1;   /* current color, to avoid repeating escapes */
    for (int y = 0; y < view_h; y++) {
        for (int x = 0; x < cols; x++) {
            double h = view_h / dist[x] * aspect * 2;
            double top = (view_h - h) / 2, bot = (view_h + h) / 2;
            int color; const char *glyph;
            if (y >= top && y < bot) {
                /* solid blocks up close, fading to stipple in the distance;
                 * the two wall orientations get different brightness */
                static const char *wall[] = { "\xe2\x96\x88", "\xe2\x96\x93", "\xe2\x96\x92", "\xe2\x96\x91", ":", "." };
                double d = dist[x];
                int i = d < 1.5 ? 0 : d < 3 ? 1 : d < 5 ? 2 : d < 8 ? 3 : d < 12 ? 4 : 5;
                glyph = wall[i];
                color = kind[x] == '#' ? 37 : kind[x] == 'R' ? 36 : 32;
                if (!side[x]) color += 60;
                if (kind[x] == '#') color = side[x] ? 90 : 37;
            } else if (y >= bot) {
                /* project the floor cell back into the world and draw the
                 * wafer's grid where the point lands near a cell edge */
                double rd = view_h * aspect / (y + 0.5 - view_h / 2.0);
                double a = dir + (x / (double)cols - 0.5) * fov;
                double wd = rd / cos(a - dir);
                double wx = px + cos(a) * wd, wy = py + sin(a) * wd;
                double fx = wx - floor(wx), fy = wy - floor(wy);
                int on_line = (fx < 0.06 || fx > 0.94 || fy < 0.06 || fy > 0.94);
                if (on_line && rd < 5) { glyph = "+"; color = 32; }
                else if (rd < 6)       { glyph = "."; color = rd < 2.5 ? 34 : 94; }
                else                   { glyph = " "; color = 34; }
            } else {
                unsigned hsh = (unsigned)(x * 73856093u) ^ (unsigned)(y * 19349663u);
                glyph = (y < view_h / 3 && hsh % 37 == 0) ? "." : " ";
                color = 90;
            }
            if (color != cur) {
                char esc[16];
                snprintf(esc, sizeof esc, "\x1b[%dm", color);
                outs(esc);
                cur = color;
            }
            outs(glyph);
        }
        if (y < view_h - 1) outs("\r\n");
    }

    /* minimap, top-left */
    if (show_map && rows > MAP_H / 2 + 4 && cols > MAP_W + 10) {
        for (int y = 0; y < MAP_H; y += 2) {
            char esc[32];
            snprintf(esc, sizeof esc, "\x1b[%d;2H\x1b[0m", y / 2 + 2);
            outs(esc);
            for (int x = 0; x < MAP_W; x++) {
                char ch = map[y][x];
                if ((int)px == x && ((int)py == y || (int)py == y + 1)) outs("\x1b[1;33m@\x1b[0m");
                else if (map[y + 1][x] == 'P' || ch == 'P') outs("\x1b[1;35mP\x1b[0m");
                else if (ch == '#') outs(" ");
                else if (ch == 'C' || ch == 'R') outs("\x1b[32m\xe2\x96\xaa\x1b[0m");
                else outs("\x1b[2m\xc2\xb7\x1b[0m");
            }
        }
    }

    /* status bar */
    char bar[512];
    const char *msg = now() < message_until ? message : "WASD/arrows move · Q/E strafe · M map · X quit";
    int n = snprintf(bar, sizeof bar, "\x1b[%d;1H\x1b[0;7m wafer explorer \x1b[0;1m  papers %d/%d  \x1b[0m %s",
                     rows, nfound, NPAPERS, msg);
    out(bar, n);
    outs("\x1b[K");
    fwrite(frame, 1, frame_len, stdout);
    fflush(stdout);
}

/* ---- input & movement ------------------------------------------------- */
static void try_move(double dx, double dy)
{
    double r = 0.2;
    if (!solid((int)(px + dx + (dx > 0 ? r : -r)), (int)py)) px += dx;
    if (!solid((int)px, (int)(py + dy + (dy > 0 ? r : -r)))) py += dy;
    for (int i = 0; i < NPAPERS; i++) {
        if ((int)px == paper_x[i] && (int)py == paper_y[i] && !found[i]) {
            found[i] = 1;
            nfound++;
            map[paper_y[i]][paper_x[i]] = '.';
            message = nfound == NPAPERS ? "All papers found! The whole list: cat ~/papers/README" : papers[i];
            message_until = now() + (nfound == NPAPERS ? 1e9 : 6);
        }
    }
}

static int handle_input(void)
{
    unsigned char buf[64];
    int n = read(0, buf, sizeof buf), moved = 0;
    double step = 0.25, turn = 0.12;
    for (int i = 0; i < n; i++) {
        int k = buf[i];
        if (k == 0x1b && i + 2 < n && buf[i + 1] == '[') { k = 256 + buf[i + 2]; i += 2; }
        switch (k) {
        case 'w': case 'W': case 256 + 'A': try_move(cos(dir) * step, sin(dir) * step); break;
        case 's': case 'S': case 256 + 'B': try_move(-cos(dir) * step, -sin(dir) * step); break;
        case 'a': case 'A': case 256 + 'D': dir -= turn; break;
        case 'd': case 'D': case 256 + 'C': dir += turn; break;
        case 'q': case 'Q': try_move(sin(dir) * step, -cos(dir) * step); break;
        case 'e': case 'E': try_move(-sin(dir) * step, cos(dir) * step); break;
        case 'm': case 'M': show_map = !show_map; break;
        case 'x': case 'X': case 3: quit = 1; break;
        default: continue;
        }
        moved = 1;
    }
    return moved;
}

int main(void)
{
    if (!isatty(0) || !isatty(1)) { fprintf(stderr, "explore: needs a terminal\n"); return 1; }
    rng ^= (unsigned)time(NULL);
    build_wafer();
    signal(SIGWINCH, on_signal);
    signal(SIGINT, on_signal);
    signal(SIGTERM, on_signal);
    raw_mode();
    message_until = now() + 8;

    int dirty = 1;
    while (!quit) {
        if (resized) {
            struct winsize ws;
            if (ioctl(1, TIOCGWINSZ, &ws) == 0 && ws.ws_row > 4 && ws.ws_col > 10) { rows = ws.ws_row; cols = ws.ws_col; }
            resized = 0;
            fputs("\x1b[2J", stdout);
            dirty = 1;
        }
        if (dirty) { render(); dirty = 0; }
        fd_set fds;
        FD_ZERO(&fds);
        FD_SET(0, &fds);
        struct timeval tv = { 0, 100000 };
        if (select(1, &fds, NULL, NULL, &tv) > 0) dirty = handle_input();
        else if (message_until > 0 && now() > message_until) { message_until = 0; dirty = 1; }  /* clear expired message */
    }
    return 0;
}
