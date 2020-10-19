## isolated Prosody test for jitsimeet

## instructions
- setup docker and docker-compose
- fill .env file
- run `docker-compose up -d --build`
- optional: to scale to 7 nodes (adjust your settings), run `docker-compose up -d --build --scale test=7`

## env var setup
- if you are using uuid for **CONFERENCE_PREFIX** variable, subtract last 4 digits because the last part will be added automatically.
for example, if your uuid id **25b98905-194c-4a70-8706-25f4a77b3456**, set `CONFERENCE_PREFIX=25b98905-194c-4a70-8706-25f4a77b`  
if you want to test with 4 conference, then you will have conferences with:  
25b98905-194c-4a70-8706-25f4a77b0000  
25b98905-194c-4a70-8706-25f4a77b0001  
25b98905-194c-4a70-8706-25f4a77b0002  
25b98905-194c-4a70-8706-25f4a77b0003  

## todo
- implement test which user join and left randomly (closer to actual user's behaviour)