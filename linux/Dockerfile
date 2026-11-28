# The Linux that boots in the browser (v86, i386). Built by scripts/build-linux.sh;
# the build context is the repository root.
FROM docker.io/i386/alpine:3.22

# Kernel + init, then the toolchain visitors get to play with.
RUN apk add --no-cache openrc alpine-base agetty linux-virt linux-firmware-none \
        gcc musl-dev make less vim file ncurses \
        python3 py3-pip htop tmux curl openssh-client

# ---- user, hostname, login ------------------------------------------------
ARG USER=ngiambla
RUN adduser -D -s /bin/ash "$USER" && passwd -d "$USER" && passwd -d root \
 && echo coquitlam > /etc/hostname && echo 'hostname="coquitlam"' > /etc/conf.d/hostname
# Only the serial console is wired to the page: drop the VGA gettys,
# autologin on ttyS0, and listen for terminal resizes on ttyS1.
RUN sed -i '/^tty[0-9]/d' /etc/inittab \
 && echo "ttyS0::respawn:/sbin/agetty --autologin $USER --noclear -s ttyS0 115200 xterm-256color" >> /etc/inittab \
 && echo "::respawn:/usr/local/sbin/termsize" >> /etc/inittab
COPY linux/rootfs/ /
RUN chmod +x /usr/local/sbin/* /usr/local/bin/* 2>/dev/null; true

# ---- services: only what a serial shell needs -----------------------------
RUN for i in devfs dmesg mdev; do rc-update add $i sysinit; done \
 && for i in hwclock modules sysctl hostname bootmisc networking; do rc-update add $i boot; done \
 && rc-update add killprocs shutdown

# ---- content: the generated home directory + the game ----------------------
COPY --chown=1000:1000 generated/home/$USER/ /home/$USER/
COPY --chown=1000:1000 linux/explore/ /home/$USER/explore/
RUN cd /home/$USER/explore && make && install -m755 explore /usr/local/bin/explore && make clean \
 && chown -R $USER:$USER /home/$USER

# initramfs with the 9p root filesystem drivers (see v86 tools/docker/alpine).
RUN mkinitfs -F "base virtio 9p" $(cat /usr/share/kernel/virt/kernel.release)

# Trim what nobody will read in the browser.
RUN rm -rf /var/cache/apk/* /usr/share/man /usr/share/doc /usr/share/info \
        /lib/modules/*/kernel/drivers/gpu /lib/modules/*/kernel/sound \
        /lib/modules/*/kernel/drivers/media /lib/modules/*/kernel/drivers/infiniband \
        /lib/modules/*/kernel/drivers/net/wireless
