FROM postgres:16-alpine

# Install tools: AWS CLI (S3), rsync + openssh (Synology NAS)
RUN apk add --no-cache aws-cli bash rsync openssh-client

COPY backup.sh /usr/local/bin/backup.sh
COPY restore.sh /usr/local/bin/restore.sh
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh

# Default: run backup daily at 02:00 via crond
COPY crontab /etc/crontabs/root

VOLUME /backups

CMD ["crond", "-f", "-d", "8"]
