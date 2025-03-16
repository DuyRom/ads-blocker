#!/bin/bash
mitmproxy --mode transparent --listen-host 0.0.0.0 --listen-port 8081 --set block_global=false -s ./modify_response.py