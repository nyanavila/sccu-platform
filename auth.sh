#!/bin/bash
export TOKEN=$(curl -s -X POST \
  http://127.0.0.1:8080/my/logins/direct \
  -H 'Content-Type: application/json' \
  -H 'Authorization: DirectLogin username="nyanavila_20",password="Sccu2026#Admin",consumer_key="sccu-key-2026"' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")
echo "Token: $TOKEN"
echo $TOKEN > ~/sccu/token.txt
