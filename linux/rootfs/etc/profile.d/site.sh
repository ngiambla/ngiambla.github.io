export TERM=xterm-256color
export PS1='\[\e[1;32m\]\u@\h\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]$ '
alias ls='ls --color=auto' ll='ls -l' la='ls -A'
if [ "$(tty)" = /dev/ttyS0 ] && [ -z "$SITE_WELCOMED" ]; then
    export SITE_WELCOMED=1
    cd ~ && cat ~/README 2>/dev/null
fi
