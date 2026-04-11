# SSH Keep-Alive Configuration

## Client Side (~/.ssh/config)

```bash
# Edit SSH config
nano ~/.ssh/config

# Tambahkan:
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
```

## Server Side (/etc/ssh/sshd_config)

```bash
# Edit SSH server config (as root)
sudo nano /etc/ssh/sshd_config

# Tambahkan/uncomment:
ClientAliveInterval 60
ClientAliveCountMax 3
TCPKeepAlive yes

# Restart SSH service
sudo systemctl restart sshd
```

## Auto-Reconnect Script

```bash
#!/bin/bash
# save as: ~/ssh-tunnel.sh

while true; do
    ssh -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o ExitOnForwardFailure=yes \
        -L 3000:localhost:3000 \
        -L 4000:localhost:4000 \
        user@your-server
    
    echo "SSH disconnected, reconnecting in 5s..."
    sleep 5
done

# Make executable:
chmod +x ~/ssh-tunnel.sh

# Run:
./ssh-tunnel.sh
```
