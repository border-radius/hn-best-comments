### HN Best Comments bot

Checks /bestcomments every 5 minutes and posts new comments to the telegram channel.

Usage:

```bash
git clone https://github.com/akkez/hn-best-comments
cd hn-best-comments
docker build -t hn-best-comments-app . 
docker run --restart=always --env CHANNEL_ID=@mychannel --env BOT_TOKEN=12345:token hn-best-comments-app
```

License: MIT