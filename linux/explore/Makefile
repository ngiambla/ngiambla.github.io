CC ?= gcc
CFLAGS ?= -O2 -Wall -Wextra -std=c99

explore: explore.c
	$(CC) $(CFLAGS) -o $@ $< -lm

clean:
	rm -f explore
